import { AppError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import type { CreateCommitmentProps, UpdateCommitmentProps } from '@/lib/validationZodSchema/CommitmentZodSchema';
import { commitmentSelect } from './listCommitments';

function invalidCategory(message: string): never {
  throw new AppError('VALIDATION_ERROR', message, { id_category: message });
}

/** Compromisso é sempre uma saída (dívida parcelada), então a categoria precisa ser de saída. */
async function checkCategory(session: SessionPayload, id: string) {
  const category = await prisma.category.findFirst({
    where: { id, id_family: session.id_family },
    select: { type: true, isActive: true },
  });
  if (!category) invalidCategory('Categoria inválida.');
  if (category.type !== 'EXPENSE') invalidCategory('Compromisso só vale para categorias de saída.');
  if (!category.isActive) invalidCategory('Esta categoria está desativada.');
}

export async function createCommitment(session: SessionPayload, input: CreateCommitmentProps) {
  await checkCategory(session, input.id_category);

  const paid = Math.min(input.paid_installments, input.total_installments);
  return prisma.commitment.create({
    data: {
      id_family: session.id_family,
      id_category: input.id_category,
      name: input.name,
      amount_cents: input.amount_cents,
      total_installments: input.total_installments,
      paid_installments: paid,
      status: paid >= input.total_installments ? 'DONE' : 'ACTIVE',
      due_day: input.due_day ?? null,
    },
    select: commitmentSelect,
  });
}

async function findOwn(session: SessionPayload, id: string) {
  const commitment = await prisma.commitment.findFirst({
    where: { id, id_family: session.id_family },
    select: { id: true, total_installments: true, status: true },
  });
  if (!commitment) throw new AppError('NOT_FOUND', 'Compromisso não encontrado.');
  return commitment;
}

/** Edita nome, valor, dia de vencimento e/ou ajusta o contador de parcelas pagas / status manualmente. */
export async function updateCommitment(session: SessionPayload, id: string, input: UpdateCommitmentProps) {
  const current = await findOwn(session, id);

  const paidRaw = input.paid_installments ?? undefined;
  if (paidRaw !== undefined && paidRaw > current.total_installments) {
    const message = `Não pode passar do total de ${current.total_installments} parcelas.`;
    throw new AppError('VALIDATION_ERROR', message, { paid_installments: message });
  }

  // se não veio status explícito, o contador decide sozinho (bateu o total = concluído)
  const nextPaid = paidRaw ?? undefined;
  const autoStatus = nextPaid !== undefined ? (nextPaid >= current.total_installments ? 'DONE' : 'ACTIVE') : undefined;

  return prisma.commitment.update({
    where: { id: current.id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.amount_cents !== undefined && { amount_cents: input.amount_cents }),
      ...(input.due_day !== undefined && { due_day: input.due_day }),
      ...(input.paid_installments !== undefined && { paid_installments: input.paid_installments }),
      status: input.status ?? autoStatus,
    },
    select: commitmentSelect,
  });
}
