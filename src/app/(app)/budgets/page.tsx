import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingMessage } from '@/components/LoadingMessage';
import { PageHeader } from '@/components/PageHeader';
import { BudgetsPanel } from '@/components/Pages/Budgets/BudgetsPanel';

export const metadata: Metadata = { title: 'Orçamentos · Finance Family' };

export default function BudgetsPage() {
  return (
    <>
      <PageHeader title="Orçamentos" subtitle="Limite mensal por categoria" />
      {/* useSearchParams (mês na URL) exige Suspense */}
      <Suspense fallback={<LoadingMessage />}>
        <BudgetsPanel />
      </Suspense>
    </>
  );
}
