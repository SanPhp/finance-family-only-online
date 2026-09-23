import { formatCurrency } from '@/lib/money';

// a partir daqui o aviso aparece (o mesmo limite do status "Atenção" na tela de orçamentos)
const WARNING_PERCENT = 85;

export type BudgetAlert = { level: 'warning' | 'danger'; text: string };

type Input = {
  categoryName: string;
  /** limite mensal do orçamento */
  limitCents: number;
  /** quanto o mês já soma na categoria (inclui o valor antigo, se estiver editando) */
  spentCents: number;
  /** valor do lançamento que está sendo digitado */
  amountCents: number;
  /** valor antigo deste mesmo lançamento na mesma categoria e mês; 0 se for novo */
  previousCents?: number;
};

/** Avisa se o lançamento leva a categoria perto do limite ou acima dele. Só informa, não bloqueia. */
export function getBudgetAlert({ categoryName, limitCents, spentCents, amountCents, previousCents = 0 }: Input): BudgetAlert | null {
  const projected = spentCents - previousCents + amountCents;
  const percent = Math.round((projected * 100) / limitCents);

  if (projected > limitCents) {
    return {
      level: 'danger',
      text: `${categoryName} ficará em ${percent}% do orçamento — passa o limite em ${formatCurrency(projected - limitCents)}.`,
    };
  }
  if (percent >= WARNING_PERCENT) {
    return {
      level: 'warning',
      text: `${categoryName} chega a ${percent}% do orçamento — restam ${formatCurrency(limitCents - projected)}.`,
    };
  }
  return null;
}
