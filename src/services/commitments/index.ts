import { api } from '@/lib/axios';
import type { CreateCommitmentProps, UpdateCommitmentProps } from '@/lib/validationZodSchema/CommitmentZodSchema';
import type { Commitment } from '@/types/commitment';

export async function getCommitments() {
  return (await api.get<Commitment[]>('/commitments')).data;
}

export async function createCommitment(data: CreateCommitmentProps) {
  return (await api.post<Commitment>('/commitments', data)).data;
}

export async function updateCommitment(id: string, data: UpdateCommitmentProps) {
  return (await api.patch<Commitment>(`/commitments/${id}`, data)).data;
}
