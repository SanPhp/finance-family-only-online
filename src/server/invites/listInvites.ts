import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';

/** Convites ainda válidos (não aceitos e não expirados) da família. */
export async function listPendingInvites(session: SessionPayload) {
  return prisma.familyInvite.findMany({
    where: { id_family: session.id_family, accepted_at: null, expires_at: { gt: new Date() } },
    select: { id: true, email: true, role: true, expires_at: true },
    orderBy: { created_at: 'desc' },
  });
}
