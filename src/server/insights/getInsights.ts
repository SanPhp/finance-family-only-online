import { monthRange, shiftMonth } from '@/lib/date';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import { listBudgets } from '@/server/budgets/listBudgets';
import { toDateOnly } from '@/server/transactions/transactionDto';
import type { InsightsResponse } from '@/types/insight';
import { buildInsights } from './buildInsights';

const MONTHS_IN_SERIES = 6;
const pad = (value: number) => String(value).padStart(2, '0');

export async function getInsights(session: SessionPayload, monthParam?: string, todayParam?: string): Promise<InsightsResponse> {
  const today = todayParam ?? new Date().toISOString().slice(0, 10);
  const month = monthParam ?? today.slice(0, 7);

  const { from, to } = monthRange(month);
  const daysInMonth = Number(to.slice(8));
  const day = today.startsWith(month) ? Number(today.slice(8)) : null;

  // mês anterior, até o mesmo dia (se o consultado é o atual) ou inteiro (se já acabou)
  const previousMonth = shiftMonth(month, -1);
  const previousRange = monthRange(previousMonth);
  const previousDays = Number(previousRange.to.slice(8));
  const previousTo = day === null ? previousRange.to : `${previousMonth}-${pad(Math.min(day, previousDays))}`;

  const family = { id_family: session.id_family, deleted_at: null };
  const seriesFrom = monthRange(shiftMonth(month, -(MONTHS_IN_SERIES - 1))).from;

  const [budgets, categories, spent, previousSpent, byMember, seriesRows] = await Promise.all([
    listBudgets(session, month),
    prisma.category.findMany({ where: { id_family: session.id_family }, select: { id: true, name: true } }),
    prisma.transaction.groupBy({
      by: ['id_category'],
      where: { ...family, type: 'EXPENSE', occurred_on: { gte: toDateOnly(from), lte: toDateOnly(to) } },
      _sum: { amount_cents: true },
    }),
    prisma.transaction.groupBy({
      by: ['id_category'],
      where: { ...family, type: 'EXPENSE', occurred_on: { gte: toDateOnly(previousRange.from), lte: toDateOnly(previousTo) } },
      _sum: { amount_cents: true },
    }),
    prisma.transaction.groupBy({
      by: ['id_user'],
      where: { ...family, type: 'EXPENSE', occurred_on: { gte: toDateOnly(from), lte: toDateOnly(to) } },
      _sum: { amount_cents: true },
    }),
    prisma.transaction.findMany({
      where: { ...family, occurred_on: { gte: toDateOnly(seriesFrom), lte: toDateOnly(to) } },
      select: { occurred_on: true, type: true, amount_cents: true },
    }),
  ]);

  const toMap = (rows: { id_category: string; _sum: { amount_cents: number | null } }[]) =>
    new Map(rows.map((row) => [row.id_category, row._sum.amount_cents ?? 0]));

  const insights = buildInsights({
    categoryNames: new Map(categories.map((category) => [category.id, category.name])),
    budgets: budgets.items,
    spentByCategory: toMap(spent),
    previousByCategory: toMap(previousSpent),
    day,
    daysInMonth,
  });

  // série dos últimos 6 meses: soma em memória (o volume de uma família é pequeno)
  const monthly = Array.from({ length: MONTHS_IN_SERIES }, (_, index) => ({
    month: shiftMonth(month, index - (MONTHS_IN_SERIES - 1)),
    income_cents: 0,
    expense_cents: 0,
  }));
  const monthlyByKey = new Map(monthly.map((entry) => [entry.month, entry]));
  for (const row of seriesRows) {
    const entry = monthlyByKey.get(row.occurred_on.toISOString().slice(0, 7));
    if (!entry) continue;
    if (row.type === 'INCOME') entry.income_cents += row.amount_cents;
    else entry.expense_cents += row.amount_cents;
  }

  return {
    month,
    insights,
    by_member: byMember
      .map((row) => ({ id_user: row.id_user, amount_cents: row._sum.amount_cents ?? 0 }))
      .sort((a, b) => b.amount_cents - a.amount_cents),
    monthly,
  };
}
