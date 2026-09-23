import { formatCurrency } from '@/lib/money';
import type { Insight } from '@/types/insight';

// Limites das regras. Ficam aqui, juntos, para ajustar num lugar só.
const PROJECTION_MIN_DAY = 5; // antes disso o ritmo do mês ainda não diz nada
const GROWTH_MIN_PERCENT = 30;
const GROWTH_MIN_CENTS = 5_000; // R$ 50: evita alarme por variação pequena
const SAVING_MIN_PERCENT = 30;
const SAVING_MIN_CENTS = 10_000; // R$ 100
const SAVING_MIN_DAY = 10;
const MAX_INSIGHTS = 8;

const LEVEL_RANK = { danger: 0, warning: 1, success: 2 } as const;

type Input = {
  categoryNames: Map<string, string>;
  budgets: { id_category: string; amount_cents: number; spent_cents: number }[];
  /** saídas do mês por categoria */
  spentByCategory: Map<string, number>;
  /** saídas por categoria no mês anterior, até o mesmo dia do mês (ou o mês todo, se o consultado já acabou) */
  previousByCategory: Map<string, number>;
  /** dia de hoje dentro do mês, se o mês consultado é o atual; null nos demais */
  day: number | null;
  daysInMonth: number;
};

/** Regras simples e explicáveis; nenhuma caixa-preta. Devolve os insights mais importantes primeiro. */
export function buildInsights({ categoryNames, budgets, spentByCategory, previousByCategory, day, daysInMonth }: Input): Insight[] {
  const insights: Insight[] = [];
  const nameOf = (id: string) => categoryNames.get(id) ?? 'Categoria';
  const isCurrentMonth = day !== null;
  const alerted = new Set<string>(); // categorias que já têm alerta de orçamento não repetem como "cresceu"

  for (const budget of budgets) {
    const name = nameOf(budget.id_category);
    const limit = formatCurrency(budget.amount_cents);

    if (budget.spent_cents > budget.amount_cents) {
      const over = budget.spent_cents - budget.amount_cents;
      const percent = Math.round((budget.spent_cents * 100) / budget.amount_cents);
      alerted.add(budget.id_category);
      insights.push({
        id: `BUDGET_OVER:${budget.id_category}`,
        type: 'BUDGET_OVER',
        level: 'danger',
        id_category: budget.id_category,
        title: `${name} estourou o orçamento`,
        message: `Já são ${formatCurrency(budget.spent_cents)} de um limite de ${limit} (${percent}%): ${formatCurrency(over)} acima.`,
        impact_cents: over,
      });
    } else if (isCurrentMonth && day >= PROJECTION_MIN_DAY && day < daysInMonth && budget.spent_cents > 0) {
      const projected = Math.round((budget.spent_cents / day) * daysInMonth);
      if (projected > budget.amount_cents) {
        alerted.add(budget.id_category);
        insights.push({
          id: `BUDGET_PROJECTED:${budget.id_category}`,
          type: 'BUDGET_PROJECTED',
          level: 'warning',
          id_category: budget.id_category,
          title: `${name} pode estourar o orçamento`,
          message: `No ritmo atual, o mês deve fechar em cerca de ${formatCurrency(projected)} (limite ${limit}).`,
          impact_cents: projected - budget.amount_cents,
        });
      }
    }
  }

  for (const [id, current] of spentByCategory) {
    const previous = previousByCategory.get(id) ?? 0;
    if (alerted.has(id) || current <= 0 || previous <= 0) continue;

    const diff = current - previous;
    const percent = Math.round((diff * 100) / previous);
    const name = nameOf(id);

    if (percent >= GROWTH_MIN_PERCENT && diff >= GROWTH_MIN_CENTS) {
      insights.push({
        id: `CATEGORY_GROWTH:${id}`,
        type: 'CATEGORY_GROWTH',
        level: 'warning',
        id_category: id,
        title: `${name} cresceu ${percent}%`,
        message: `Gasto de ${formatCurrency(current)} contra ${formatCurrency(previous)} no mesmo período do mês anterior (${formatCurrency(diff)} a mais).`,
        impact_cents: diff,
      });
    } else if (-percent >= SAVING_MIN_PERCENT && -diff >= SAVING_MIN_CENTS && (!isCurrentMonth || day >= SAVING_MIN_DAY)) {
      insights.push({
        id: `CATEGORY_SAVING:${id}`,
        type: 'CATEGORY_SAVING',
        level: 'success',
        id_category: id,
        title: `Você economizou ${formatCurrency(-diff)} em ${name}`,
        message: `Gasto de ${formatCurrency(current)} contra ${formatCurrency(previous)} no mesmo período do mês anterior.`,
        impact_cents: -diff,
      });
    }
  }

  return insights
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || b.impact_cents - a.impact_cents)
    .slice(0, MAX_INSIGHTS);
}
