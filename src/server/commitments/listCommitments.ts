import { prisma } from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';

export const commitmentSelect = {
  id: true,
  id_category: true,
  name: true,
  amount_cents: true,
  total_installments: true,
  paid_installments: true,
  status: true,
  due_day: true,
} as const;

/** Todos os compromissos da família, ativos e concluídos (a tela separa por aba). */
export async function listCommitments(session: SessionPayload) {
  return prisma.commitment.findMany({
    where: { id_family: session.id_family },
    select: commitmentSelect,
    orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
  });
}
