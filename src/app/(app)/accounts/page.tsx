import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { AccountsPanel } from '@/components/Pages/Accounts/AccountsPanel';

export const metadata: Metadata = { title: 'Contas e cartões · Finance Family' };

export default function AccountsPage() {
  return (
    <>
      <PageHeader title="Contas e cartões" subtitle="De onde sai e para onde vai o dinheiro" />
      <AccountsPanel />
    </>
  );
}
