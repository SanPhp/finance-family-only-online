import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingMessage } from '@/components/LoadingMessage';
import { PageHeader } from '@/components/PageHeader';
import { InsightsPanel } from '@/components/Pages/Insights/InsightsPanel';

export const metadata: Metadata = { title: 'Insights · Finance Family' };

export default function InsightsPage() {
  return (
    <>
      <PageHeader title="Insights" subtitle="O que merece sua atenção nas finanças" />
      {/* useSearchParams (mês na URL) exige Suspense */}
      <Suspense fallback={<LoadingMessage />}>
        <InsightsPanel />
      </Suspense>
    </>
  );
}
