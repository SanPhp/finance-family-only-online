import { api } from '@/lib/axios';
import type { AcceptInviteProps, CreateInviteProps } from '@/lib/validationZodSchema/InviteZodSchema';
import type { InvitePreview, MembersResponse, PendingInvite } from '@/types/family';

export async function getMembers() {
  return (await api.get<MembersResponse>('/members')).data;
}

export async function getPendingInvites() {
  return (await api.get<PendingInvite[]>('/invites')).data;
}

export async function createInvite(data: CreateInviteProps) {
  return (await api.post<{ token: string }>('/invites', data)).data;
}

export async function getInvitePreview(token: string) {
  return (await api.get<InvitePreview>(`/invites/${encodeURIComponent(token)}`)).data;
}

export async function acceptInvite(data: AcceptInviteProps) {
  await api.post('/invites/accept', data);
}
