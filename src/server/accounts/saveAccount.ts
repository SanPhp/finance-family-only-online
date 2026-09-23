import { AppError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import type { CreateAccountProps, UpdateAccountProps } from '@/lib/validationZodSchema/AccountZodSchema';
import { accountSelect } from './listAccounts';

export async function createAccount(session: SessionPayload, input: CreateAccountProps) {
  return prisma.account.create({
    data: {
      id_family: session.id_family,
      name: input.name,
      type: input.type,
      opening_balance_cents: input.opening_balance_cents,
      closing_day: input.closing_day ?? null,
      due_day: input.due_day ?? null,
    },
    select: accountSelect,
  });
}

export async function updateAccount(session: SessionPayload, id: string, input: UpdateAccountProps) {
  // filtra pela família da sessão: um id de outra família se comporta como inexistente
  const current = await prisma.account.findFirst({
    where: { id, id_family: session.id_family },
    select: { id: true, type: true },
  });
  if (!current) throw new AppError('NOT_FOUND', 'Conta não encontrada.');

  const isCard = current.type === 'CREDIT_CARD';
  if (!isCard && (input.closing_day !== undefined || input.due_day !== undefined)) {
    throw new AppError('VALIDATION_ERROR', 'Fechamento e vencimento são só do cartão.');
  }
  if (isCard && input.opening_balance_cents !== undefined && input.opening_balance_cents !== 0) {
    throw new AppError('VALIDATION_ERROR', 'Cartão não tem saldo inicial.');
  }

  return prisma.account.update({ where: { id: current.id }, data: input, select: accountSelect });
}
