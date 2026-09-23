'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { BudgetFormSheet } from '@/components/Pages/Budgets/BudgetFormSheet';
import { ProgressBar } from '@/components/ProgressBar';
import { currentMonth, monthElapsedPercent } from '@/lib/date';
import { formatCurrency } from '@/lib/money';
import { getBudgets } from '@/services/budgets';
import { getCategories } from '@/services/categories';
import { getMembers } from '@/services/family';
import type { Budget } from '@/types/budget';
import { LoadingMessage } from '@/components/LoadingMessage';
import { ErrorMessage } from '@/components/ErrorMessage';
import S from './style.module.scss';

const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;
// a partir daqui o orçamento entra em "Atenção"; a barra usa o mesmo limite
const WARNING_PERCENT = 85;

type SheetState = { budget?: Budget } | null;

function statusOf(percent: number) {
  if (percent >= 100) return { label: 'Estourou', className: S.pillDanger };
  if (percent >= WARNING_PERCENT) return { label: 'Atenção', className: S.pillWarning };
  return { label: 'No plano', className: S.pillOk };
}

export function BudgetsPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [sheet, setSheet] = useState<SheetState>(null);

  const monthParam = params.get('month');
  const month = monthParam && MONTH_FORMAT.test(monthParam) ? monthParam : currentMonth();

  const budgets = useQuery({ queryKey: ['budgets', month], queryFn: () => getBudgets(month), placeholderData: keepPreviousData });
  const categories = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const members = useQuery({ queryKey: ['members'], queryFn: getMembers });

  // erros primeiro: assim o TypeScript sabe que, depois disso, os dados existem
  if (budgets.isError) return <ErrorMessage message={budgets.error.message} onRetry={() => void budgets.refetch()} />;
  if (categories.isError) return <ErrorMessage message={categories.error.message} onRetry={() => void categories.refetch()} />;
  if (members.isError) return <ErrorMessage message={members.error.message} onRetry={() => void members.refetch()} />;
  if (budgets.isPending || categories.isPending || members.isPending) return <LoadingMessage />;

  const canManage = members.data.me.role === 'ADMIN';
  const categoryById = new Map(categories.data.map((category) => [category.id, category]));
  const { items, totals } = budgets.data;

  const usedPercent = totals.planned_cents > 0 ? Math.round((totals.spent_cents * 100) / totals.planned_cents) : 0;
  const elapsedPercent = monthElapsedPercent(month);
  const available = totals.planned_cents - totals.spent_cents;
  // o que mais preocupa aparece primeiro
  const sorted = [...items].sort((a, b) => b.percent - a.percent);

  const budgetedIds = new Set(items.map((item) => item.id_category));
  const freeCategories = categories.data.filter(
    (category) => category.type === 'EXPENSE' && category.isActive && !budgetedIds.has(category.id),
  );

  function changeMonth(next: string) {
    const query = new URLSearchParams(params.toString());
    query.set('month', next);
    router.replace(`${pathname}?${query.toString()}`);
  }

  return (
    <>
      <div className={S.bar}>
        <MonthSwitcher month={month} onChange={changeMonth} />
        {canManage && (
          <div className={S.newButton}>
            <Button onClick={() => setSheet({})} disabled={freeCategories.length === 0}>
              ＋ Novo orçamento
            </Button>
          </div>
        )}
      </div>

      <div className={S.kpis}>
        <Card className={S.kpi}>
          <span className={S.kpiLabel}>Planejado</span>
          <b className={S.kpiValue}>{formatCurrency(totals.planned_cents)}</b>
        </Card>
        <Card className={S.kpi}>
          <span className={S.kpiLabel}>Gasto</span>
          <b className={S.kpiValue}>{formatCurrency(totals.spent_cents)}</b>
        </Card>
        <Card className={S.kpi}>
          <span className={S.kpiLabel}>Disponível</span>
          <b className={`${S.kpiValue} ${available >= 0 ? S.income : S.expense}`}>{formatCurrency(available)}</b>
        </Card>
        <Card className={S.kpi}>
          <span className={S.kpiLabel}>Ritmo do mês</span>
          <b className={`${S.kpiValue} ${usedPercent > elapsedPercent ? S.warning : S.income}`}>{usedPercent}%</b>
          <small className={S.kpiNote}>o esperado hoje é {elapsedPercent}%</small>
        </Card>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <div className={S.empty}>
            <p>Nenhum orçamento definido.</p>
            {canManage ? (
              <Button onClick={() => setSheet({})} disabled={freeCategories.length === 0}>＋ Criar o primeiro</Button>
            ) : (
              <p>Peça a um administrador para definir os limites.</p>
            )}
          </div>
        </Card>
      ) : (
        <div className={S.grid}>
          {sorted.map((budget) => {
            const category = categoryById.get(budget.id_category);
            const status = statusOf(budget.percent);
            const over = budget.remaining_cents < 0;

            return (
              <Card key={budget.id}>
                <div className={S.head}>
                  <span className={S.name}>
                    <i className={S.icon} aria-hidden>{category?.icon ?? '❔'}</i>
                    {category?.name ?? 'Categoria'}
                  </span>
                  <span className={`${S.pill} ${status.className}`}>{status.label}</span>
                </div>

                <b className={S.spent}>{formatCurrency(budget.spent_cents)}</b>
                <ProgressBar percent={budget.percent} label={`${category?.name ?? 'Categoria'}: ${budget.percent}% do orçamento`} />
                <small className={over ? S.expense : S.note}>
                  {over
                    ? `Limite ${formatCurrency(budget.amount_cents)} · passou ${formatCurrency(-budget.remaining_cents)}`
                    : `Limite ${formatCurrency(budget.amount_cents)} · resta ${formatCurrency(budget.remaining_cents)}`}
                </small>

                {canManage && (
                  <button type="button" className={S.edit} onClick={() => setSheet({ budget })}>
                    Editar
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <BudgetFormSheet
        open={sheet !== null}
        onOpenChange={(open) => !open && setSheet(null)}
        budget={sheet?.budget}
        categoryName={sheet?.budget ? categoryById.get(sheet.budget.id_category)?.name : undefined}
        freeCategories={freeCategories}
      />
    </>
  );
}
