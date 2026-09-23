import { AppError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import { hashInviteToken } from './token';

export const INVALID_INVITE = 'Convite inválido ou expirado.';

/** Busca um convite válido pelo token. Inexistente, usado e expirado dão a mesma resposta. */
export async function findValidInvite(token: string) {
  const invite = await prisma.familyInvite.findUnique({
    where: { token_hash: hashInviteToken(token) },
    select: {
      id: true,
      id_family: true,
      email: true,
      role: true,
      accepted_at: true,
      expires_at: true,
      family: { select: { name: true } },
    },
  });
  if (!invite || invite.accepted_at || invite.expires_at <= new Date()) throw new AppError('NOT_FOUND', INVALID_INVITE);
  return invite;
}

export async function getInvitePreview(token: string) {
  const invite = await findValidInvite(token);
  return { email: invite.email, role: invite.role, familyName: invite.family.name };
}
