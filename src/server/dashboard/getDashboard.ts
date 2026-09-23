import { monthRange, shiftMonth } from '@/lib/date';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import { getAccountBalances } from '@/server/accounts/balances';
import { listBudgets } from '@/server/budgets/listBudgets';
import { toDateOnly, toTransactionDto, transactionSelect } from '@/server/transactions/transactionDto';
import type { DashboardResponse, MonthTotals } from '@/types/dashboard';

const RECENT_LIMIT = 5;

/** "AAAA-MM" do mês atual (UTC). Só é usado quando o cliente não informa o mês. */
function currentMonthUtc() {
  return new Date().toISOString().slice(0, 7);
}

/** Tudo que a visão geral mostra, numa única consulta da tela. */
export async function getDashboard(session: SessionPayload, month: string = currentMonthUtc()): Promise<DashboardResponse> {
  const inMonth = (target: string) => {
    const { from, to } = monthRange(target);
    return { gte: toDateOnly(from), lte: toDateOnly(to) };
  };
  const base = { id_family: session.id_family, deleted_at: null };

  async function totalsOf(target: string): Promise<MonthTotals> {
    const rows = await prisma.transaction.groupBy({
      by: ['type'],
      where: { ...base, occurred_on: inMonth(target) },
      _sum: { amount_cents: true },
    });
    const sumOf = (type: 'INCOME' | 'EXPENSE') => rows.find((row) => row.type === type)?._sum.amount_cents ?? 0;
    return { income_cents: sumOf('INCOME'), expense_cents: sumOf('EXPENSE') };
  }

  const [totals, previous_totals, byCategory, budgets, recent, balances] = await Promise.all([
    totalsOf(month),
    totalsOf(shiftMonth(month, -1)),
    prisma.transaction.groupBy({
      by: ['id_category'],
      where: { ...base, type: 'EXPENSE', occurred_on: inMonth(month) },
      _sum: { amount_cents: true },
    }),
    listBudgets(session, month),
    prisma.transaction.findMany({
      where: base,
      select: transactionSelect,
      orderBy: [{ occurred_on: 'desc' }, { id: 'desc' }],
      take: RECENT_LIMIT,
    }),
    getAccountBalances(session),
  ]);

  return {
    month,
    total_balance_cents: [...balances.values()].reduce((sum, value) => sum + value, 0),
    totals,
    previous_totals,
    expense_by_category: byCategory
      .map((row) => ({ id_category: row.id_category, amount_cents: row._sum.amount_cents ?? 0 }))
      .sort((a, b) => b.amount_cents - a.amount_cents),
    budgets,
    recent: recent.map(toTransactionDto),
  };
}
