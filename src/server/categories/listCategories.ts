import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';

/** Todas as categorias da família, inclusive as desativadas (a tela decide como mostrar). */
export async function listCategories(session: SessionPayload) {
  return prisma.category.findMany({
    where: { id_family: session.id_family },
    select: { id: true, name: true, icon: true, type: true, isActive: true },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
}
