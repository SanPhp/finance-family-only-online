import { AppError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import type { CreateInviteProps } from '@/lib/validationZodSchema/InviteZodSchema';
import { generateInviteToken, hashInviteToken, INVITE_TTL_DAYS } from './token';

export async function createInvite(session: SessionPayload, input: CreateInviteProps) {
  const email = input.email.toLowerCase();
  const message = 'Este e-mail já tem conta no sistema.';

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new AppError('CONFLICT', message, { email: message });

  const token = generateInviteToken();
  await prisma.familyInvite.create({
    data: {
      id_family: session.id_family,
      id_created_by: session.id_user,
      email,
      role: input.role,
      token_hash: hashInviteToken(token),
      expires_at: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return { token };
}
