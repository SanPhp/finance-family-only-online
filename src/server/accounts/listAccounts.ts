import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import { getAccountBalances } from './balances';

export const accountSelect = {
  id: true,
  name: true,
  type: true,
  opening_balance_cents: true,
  closing_day: true,
  due_day: true,
  isActive: true,
} as const;

/** Todas as contas da família, inclusive as desativadas (a tela decide como mostrar). */
export async function listAccounts(session: SessionPayload) {
  const [accounts, balances] = await Promise.all([
    prisma.account.findMany({
      where: { id_family: session.id_family },
      select: accountSelect,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    }),
    getAccountBalances(session),
  ]);
  return accounts.map((account) => ({ ...account, balance_cents: balances.get(account.id) ?? account.opening_balance_cents }));
}
