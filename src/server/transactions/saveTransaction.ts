import { AppError } from '@/lib/apiError';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import type { CreateTransactionProps, UpdateTransactionProps } from '@/lib/validationZodSchema/TransactionZodSchema';
import type { Transaction } from '@/types/transaction';
import { toDateOnly, toTransactionDto, transactionSelect } from './transactionDto';

type TxType = 'INCOME' | 'EXPENSE';
type Client = Prisma.TransactionClient;

const NOT_FOUND = 'Lançamento não encontrado.';

function invalid(field: string, message: string): never {
  throw new AppError('VALIDATION_ERROR', message, { [field]: message });
}

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

// Conta, categoria e membro precisam ser da família da sessão: um id de outra família se comporta como inexistente.
async function checkAccount(session: SessionPayload, id: string, mustBeActive: boolean) {
  const account = await prisma.account.findFirst({
    where: { id, id_family: session.id_family },
    select: { isActive: true },
  });
  if (!account) invalid('id_account', 'Conta inválida.');
  if (mustBeActive && !account.isActive) invalid('id_account', 'Esta conta está desativada.');
}

async function checkCategory(session: SessionPayload, id: string, type: TxType, mustBeActive: boolean) {
  const category = await prisma.category.findFirst({
    where: { id, id_family: session.id_family },
    select: { isActive: true, type: true },
  });
  if (!category) invalid('id_category', 'Categoria inválida.');
  if (category.type !== type) {
    invalid('id_category', type === 'INCOME' ? 'Escolha uma categoria de entrada.' : 'Escolha uma categoria de saída.');
  }
  if (mustBeActive && !category.isActive) invalid('id_category', 'Esta categoria está desativada.');
}

async function checkUser(session: SessionPayload, id: string) {
  const user = await prisma.user.findFirst({ where: { id, id_family: session.id_family, isActive: true }, select: { id: true } });
  if (!user) invalid('id_user', 'Membro inválido.');
}

/** Só lançamento de saída pode ser vinculado (compromisso é sempre uma dívida a pagar). */
async function checkCommitment(session: SessionPayload, id: string, type: TxType) {
  if (type !== 'EXPENSE') invalid('id_commitment', 'Só uma saída pode ser vinculada a um compromisso.');
  const commitment = await prisma.commitment.findFirst({ where: { id, id_family: session.id_family }, select: { id: true } });
  if (!commitment) invalid('id_commitment', 'Compromisso inválido.');
}

/** +1 (ou -1) no contador do compromisso, sem passar de 0 nem do total; atualiza o status sozinho. */
async function adjustCommitment(client: Client, id: string, delta: 1 | -1) {
  const commitment = await client.commitment.findUnique({ where: { id }, select: { paid_installments: true, total_installments: true } });
  if (!commitment) return; // já não existe mais: nada a ajustar
  const paid_installments = Math.min(commitment.total_installments, Math.max(0, commitment.paid_installments + delta));
  await client.commitment.update({
    where: { id },
    data: { paid_installments, status: paid_installments >= commitment.total_installments ? 'DONE' : 'ACTIVE' },
  });
}

/** ADMIN altera qualquer lançamento; MEMBER só os que ele mesmo registrou. */
function assertCanModify(session: SessionPayload, transaction: { id_created_by: string }) {
  if (session.role !== 'ADMIN' && transaction.id_created_by !== session.id_user) {
    throw new AppError('FORBIDDEN', 'Você só pode alterar os lançamentos que registrou.');
  }
}

async function findOwn(session: SessionPayload, id: string) {
  return prisma.transaction.findFirst({ where: { id, id_family: session.id_family }, select: transactionSelect });
}

/**
 * Cria um lançamento. Se o cliente mandar o `id` (gerado pelo aparelho) e ele já existir,
 * devolve o existente sem duplicar — reenviar a mesma requisição é seguro.
 */
export async function createTransaction(
  session: SessionPayload,
  input: CreateTransactionProps,
): Promise<{ transaction: Transaction; created: boolean }> {
  if (input.id) {
    const existing = await prisma.transaction.findUnique({ where: { id: input.id }, select: transactionSelect });
    if (existing) {
      if (existing.id_family !== session.id_family) throw new AppError('CONFLICT', 'Identificador já utilizado.');
      return { transaction: toTransactionDto(existing), created: false };
    }
  }

  await checkAccount(session, input.id_account, true);
  await checkCategory(session, input.id_category, input.type, true);
  if (input.id_user) await checkUser(session, input.id_user);
  if (input.id_commitment) await checkCommitment(session, input.id_commitment, input.type);

  try {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          id: input.id,
          id_family: session.id_family,
          id_account: input.id_account,
          id_category: input.id_category,
          id_user: input.id_user ?? null,
          id_created_by: session.id_user,
          id_commitment: input.id_commitment ?? null,
          type: input.type,
          amount_cents: input.amount_cents,
          description: input.description,
          occurred_on: toDateOnly(input.occurred_on),
        },
        select: transactionSelect,
      });
      if (input.id_commitment) await adjustCommitment(tx, input.id_commitment, 1);
      return created;
    });
    return { transaction: toTransactionDto(row), created: true };
  } catch (error) {
    // duas requisições simultâneas com o mesmo id: a outra ganhou, devolve o que ela criou
    if (input.id && isUniqueViolation(error)) {
      const existing = await findOwn(session, input.id);
      if (existing) return { transaction: toTransactionDto(existing), created: false };
    }
    throw error;
  }
}

export async function updateTransaction(session: SessionPayload, id: string, input: UpdateTransactionProps) {
  const current = await findOwn(session, id);
  if (!current || current.deleted_at) throw new AppError('NOT_FOUND', NOT_FOUND);
  assertCanModify(session, current);

  const type = input.type ?? current.type;
  const categoryChanged = input.id_category !== undefined && input.id_category !== current.id_category;
  const accountChanged = input.id_account !== undefined && input.id_account !== current.id_account;
  const userChanged = input.id_user !== undefined && input.id_user !== current.id_user;
  const commitmentChanged = input.id_commitment !== undefined && input.id_commitment !== current.id_commitment;

  if (accountChanged) await checkAccount(session, input.id_account!, true);
  // o tipo da categoria precisa bater sempre; "ativa" só é exigido se a categoria foi trocada
  if (categoryChanged || input.type !== undefined) {
    await checkCategory(session, input.id_category ?? current.id_category, type, categoryChanged);
  }
  if (userChanged && input.id_user) await checkUser(session, input.id_user);
  if (commitmentChanged && input.id_commitment) await checkCommitment(session, input.id_commitment, type);
  else if (input.type !== undefined && type !== 'EXPENSE' && (input.id_commitment ?? current.id_commitment)) {
    invalid('id_commitment', 'Só uma saída pode ser vinculada a um compromisso.');
  }

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id: current.id },
      data: {
        ...(input.type !== undefined && { type: input.type }),
        ...(input.id_account !== undefined && { id_account: input.id_account }),
        ...(input.id_category !== undefined && { id_category: input.id_category }),
        ...(input.id_user !== undefined && { id_user: input.id_user }),
        ...(input.id_commitment !== undefined && { id_commitment: input.id_commitment }),
        ...(input.amount_cents !== undefined && { amount_cents: input.amount_cents }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.occurred_on !== undefined && { occurred_on: toDateOnly(input.occurred_on) }),
      },
      select: transactionSelect,
    });
    if (commitmentChanged) {
      if (current.id_commitment) await adjustCommitment(tx, current.id_commitment, -1);
      if (input.id_commitment) await adjustCommitment(tx, input.id_commitment, 1);
    }
    return updated;
  });
  return toTransactionDto(row);
}

/** Exclusão lógica: o registro fica, marcado como excluído, para manter o histórico. Repetir é seguro. */
export async function deleteTransaction(session: SessionPayload, id: string) {
  const current = await findOwn(session, id);
  if (!current) throw new AppError('NOT_FOUND', NOT_FOUND);
  if (current.deleted_at) return toTransactionDto(current);
  assertCanModify(session, current);

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id: current.id },
      data: { deleted_at: new Date() },
      select: transactionSelect,
    });
    if (current.id_commitment) await adjustCommitment(tx, current.id_commitment, -1);
    return updated;
  });
  return toTransactionDto(row);
}
