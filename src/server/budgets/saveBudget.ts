import { AppError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import type { CreateBudgetProps, UpdateBudgetProps } from '@/lib/validationZodSchema/BudgetZodSchema';

const select = { id: true, id_category: true, amount_cents: true } as const;
const NOT_FOUND = 'Orçamento não encontrado.';

function invalidCategory(message: string): never {
  throw new AppError('VALIDATION_ERROR', message, { id_category: message });
}

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export async function createBudget(session: SessionPayload, input: CreateBudgetProps) {
  // um id de outra família se comporta como inexistente
  const category = await prisma.category.findFirst({
    where: { id: input.id_category, id_family: session.id_family },
    select: { type: true, isActive: true },
  });
  if (!category) invalidCategory('Categoria inválida.');
  if (category.type !== 'EXPENSE') invalidCategory('Orçamento só vale para categorias de saída.');
  if (!category.isActive) invalidCategory('Esta categoria está desativada.');

  try {
    return await prisma.budget.create({
      data: { id_family: session.id_family, id_category: input.id_category, amount_cents: input.amount_cents },
      select,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const message = 'Esta categoria já tem orçamento.';
      throw new AppError('CONFLICT', message, { id_category: message });
    }
    throw error;
  }
}

async function findOwn(session: SessionPayload, id: string) {
  const budget = await prisma.budget.findFirst({ where: { id, id_family: session.id_family }, select: { id: true } });
  if (!budget) throw new AppError('NOT_FOUND', NOT_FOUND);
  return budget;
}

export async function updateBudget(session: SessionPayload, id: string, input: UpdateBudgetProps) {
  const budget = await findOwn(session, id);
  return prisma.budget.update({ where: { id: budget.id }, data: { amount_cents: input.amount_cents }, select });
}

/** Orçamento é só um limite (nada depende dele), então pode ser removido de fato. */
export async function deleteBudget(session: SessionPayload, id: string) {
  const budget = await findOwn(session, id);
  await prisma.budget.delete({ where: { id: budget.id } });
}
