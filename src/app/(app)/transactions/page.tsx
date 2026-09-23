import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingMessage } from '@/components/LoadingMessage';
import { PageHeader } from '@/components/PageHeader';
import { TransactionsPanel } from '@/components/Pages/Transactions/TransactionsPanel';

export const metadata: Metadata = { title: 'Lançamentos · Finance Family' };

export default function TransactionsPage() {
  return (
    <>
      <PageHeader title="Lançamentos" subtitle="Tudo que entrou e saiu" />
      {/* useSearchParams (filtros na URL) exige Suspense */}
      <Suspense fallback={<LoadingMessage />}>
        <TransactionsPanel />
      </Suspense>
    </>
  );
}
