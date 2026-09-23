import { AppError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import type { CreateCategoryProps, UpdateCategoryProps } from '@/lib/validationZodSchema/CategoryZodSchema';

const NAME_TAKEN = 'Já existe uma categoria com esse nome.';
const select = { id: true, name: true, icon: true, type: true, isActive: true } as const;

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export async function createCategory(session: SessionPayload, input: CreateCategoryProps) {
  try {
    return await prisma.category.create({ data: { ...input, id_family: session.id_family }, select });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('CONFLICT', NAME_TAKEN, { name: NAME_TAKEN });
    throw error;
  }
}

export async function updateCategory(session: SessionPayload, id: string, input: UpdateCategoryProps) {
  // filtra pela família da sessão: um id de outra família se comporta como inexistente
  const current = await prisma.category.findFirst({ where: { id, id_family: session.id_family }, select: { id: true } });
  if (!current) throw new AppError('NOT_FOUND', 'Categoria não encontrada.');

  try {
    return await prisma.category.update({ where: { id: current.id }, data: input, select });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('CONFLICT', NAME_TAKEN, { name: NAME_TAKEN });
    throw error;
  }
}
