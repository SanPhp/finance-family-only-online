import type { Metadata } from 'next';
import { CommitmentsPanel } from '@/components/Pages/Commitments/CommitmentsPanel';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = { title: 'Compromissos · Finance Family' };

export default function CommitmentsPage() {
  return (
    <>
      <PageHeader title="Compromissos" subtitle="Compras parceladas: quanto falta pagar" />
      <CommitmentsPanel />
    </>
  );
}
