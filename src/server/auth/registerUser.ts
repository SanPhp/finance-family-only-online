import bcrypt from 'bcrypt';
import { AppError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import { DEFAULT_CATEGORIES } from '@/server/categories/defaultCategories';
import type { RegisterProps } from '@/lib/validationZodSchema/RegisterZodSchema';

const EMAIL_TAKEN = 'Este e-mail já está cadastrado.';
const BCRYPT_ROUNDS = 12;

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

/** Cria a família e o primeiro usuário, que vira ADMIN dela. */
export async function registerUser(input: RegisterProps) {
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new AppError('CONFLICT', EMAIL_TAKEN, { email: EMAIL_TAKEN });

  const password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const family = await prisma.family.create({
      data: {
        name: input.familyName,
        users: { create: { name: input.name, email, password_hash, role: 'ADMIN' } },
        categories: { create: DEFAULT_CATEGORIES.map((category) => ({ ...category })) },
      },
      select: { id: true, users: { select: { id: true } } },
    });
    return { id_family: family.id, id_user: family.users[0].id };
  } catch (error) {
    // duas requisições simultâneas com o mesmo e-mail
    if (isUniqueViolation(error)) throw new AppError('CONFLICT', EMAIL_TAKEN, { email: EMAIL_TAKEN });
    throw error;
  }
}
