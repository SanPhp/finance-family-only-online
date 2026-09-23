import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import type { BudgetsResponse } from '@/types/budget';
import { monthRange } from '@/lib/date';
import { toDateOnly } from '@/server/transactions/transactionDto';

/** "AAAA-MM" do mês atual (UTC). Só é usado quando o cliente não informa o mês. */
function currentMonthUtc() {
  return new Date().toISOString().slice(0, 7);
}

/** Orçamentos da família com o uso no mês: soma das saídas (não excluídas) de cada categoria. */
export async function listBudgets(session: SessionPayload, month: string = currentMonthUtc()): Promise<BudgetsResponse> {
  const { from, to } = monthRange(month);

  const [budgets, spent] = await Promise.all([
    prisma.budget.findMany({
      where: { id_family: session.id_family },
      select: { id: true, id_category: true, amount_cents: true },
      orderBy: { created_at: 'asc' },
    }),
    prisma.transaction.groupBy({
      by: ['id_category'],
      where: {
        id_family: session.id_family,
        type: 'EXPENSE',
        deleted_at: null,
        occurred_on: { gte: toDateOnly(from), lte: toDateOnly(to) },
      },
      _sum: { amount_cents: true },
    }),
  ]);

  const spentByCategory = new Map(spent.map((row) => [row.id_category, row._sum.amount_cents ?? 0]));

  const items = budgets.map((budget) => {
    const spent_cents = spentByCategory.get(budget.id_category) ?? 0;
    return {
      ...budget,
      spent_cents,
      remaining_cents: budget.amount_cents - spent_cents,
      percent: Math.round((spent_cents * 100) / budget.amount_cents),
    };
  });

  return {
    month,
    items,
    totals: {
      planned_cents: items.reduce((sum, item) => sum + item.amount_cents, 0),
      spent_cents: items.reduce((sum, item) => sum + item.spent_cents, 0),
    },
  };
}
