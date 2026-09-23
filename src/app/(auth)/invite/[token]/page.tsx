import type { Metadata } from 'next';
import { AcceptInviteForm } from '@/components/Pages/AcceptInvite/AcceptInviteForm';

export const metadata: Metadata = { title: 'Convite · Finance Family' };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AcceptInviteForm token={token} />;
}
