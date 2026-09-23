import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import type { TransactionQueryProps } from '@/lib/validationZodSchema/TransactionZodSchema';
import type { TransactionsResponse } from '@/types/transaction';
import { toDateOnly, toTransactionDto, transactionSelect } from './transactionDto';

/**
 * Lista da tela: só lançamentos ativos, mais novos primeiro.
 */
export async function listTransactions(session: SessionPayload, query: TransactionQueryProps): Promise<TransactionsResponse> {
  const where: Prisma.TransactionWhereInput = {
    id_family: session.id_family,
    deleted_at: null,
    ...((query.from || query.to) && {
      occurred_on: {
        ...(query.from && { gte: toDateOnly(query.from) }),
        ...(query.to && { lte: toDateOnly(query.to) }),
      },
    }),
    ...(query.type && { type: query.type }),
    ...(query.id_category && { id_category: query.id_category }),
    ...(query.id_account && { id_account: query.id_account }),
    ...(query.id_user && { id_user: query.id_user === 'shared' ? null : query.id_user }),
  };

  const [rows, total, sums] = await Promise.all([
    prisma.transaction.findMany({
      where,
      select: transactionSelect,
      orderBy: [{ occurred_on: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({ by: ['type'], where, _sum: { amount_cents: true } }),
  ]);

  const sumOf = (type: 'INCOME' | 'EXPENSE') => sums.find((row) => row.type === type)?._sum.amount_cents ?? 0;

  return {
    items: rows.map(toTransactionDto),
    totals: { income_cents: sumOf('INCOME'), expense_cents: sumOf('EXPENSE') },
    total,
    page: query.page,
    limit: query.limit,
  };
}
