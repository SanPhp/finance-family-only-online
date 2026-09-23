import bcrypt from 'bcrypt';
import { AppError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import type { AcceptInviteProps } from '@/lib/validationZodSchema/InviteZodSchema';
import { findValidInvite, INVALID_INVITE } from './getInvite';

const BCRYPT_ROUNDS = 12;
const EMAIL_TAKEN = 'Este e-mail já tem conta no sistema.';

function isUniqueViolation(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

/** Cria o usuário na família do convite (com o e-mail e o papel do convite) e devolve a sessão dele. */
export async function acceptInvite(input: AcceptInviteProps): Promise<SessionPayload> {
  const invite = await findValidInvite(input.token);
  const password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    return await prisma.$transaction(async (tx) => {
      // "reserva" o convite: se duas pessoas usarem o mesmo link ao mesmo tempo, só uma passa
      const claimed = await tx.familyInvite.updateMany({
        where: { id: invite.id, accepted_at: null },
        data: { accepted_at: new Date() },
      });
      if (claimed.count !== 1) throw new AppError('NOT_FOUND', INVALID_INVITE);

      const user = await tx.user.create({
        data: { id_family: invite.id_family, name: input.name, email: invite.email, password_hash, role: invite.role },
        select: { id: true },
      });
      return { id_user: user.id, id_family: invite.id_family, role: invite.role };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError('CONFLICT', EMAIL_TAKEN);
    throw error;
  }
}
