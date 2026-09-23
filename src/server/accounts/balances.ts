import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';

/**
 * Saldo de cada conta: saldo inicial + todas as entradas - todas as saídas, de qualquer mês (sem os excluídos).
 * Compra no cartão de crédito conta como saída na hora em que é lançada, então o saldo do cartão fica
 * negativo (o que já foi gasto nele). O sistema ainda não trata fatura.
 */
export async function getAccountBalances(session: SessionPayload): Promise<Map<string, number>> {
  const [accounts, sums] = await Promise.all([
    prisma.account.findMany({ where: { id_family: session.id_family }, select: { id: true, opening_balance_cents: true } }),
    prisma.transaction.groupBy({
      by: ['id_account', 'type'],
      where: { id_family: session.id_family, deleted_at: null },
      _sum: { amount_cents: true },
    }),
  ]);

  const balances = new Map(accounts.map((account) => [account.id, account.opening_balance_cents]));
  for (const row of sums) {
    const value = row._sum.amount_cents ?? 0;
    balances.set(row.id_account, (balances.get(row.id_account) ?? 0) + (row.type === 'INCOME' ? value : -value));
  }
  return balances;
}
