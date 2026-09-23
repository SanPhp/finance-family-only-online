import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';

export async function listMembers(session: SessionPayload) {
  const members = await prisma.user.findMany({
    where: { id_family: session.id_family },
    select: { id: true, name: true, email: true, role: true, isActive: true },
    orderBy: { created_at: 'asc' },
  });
  return { me: { id_user: session.id_user, role: session.role }, members };
}
