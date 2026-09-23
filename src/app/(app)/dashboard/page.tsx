import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingMessage } from '@/components/LoadingMessage';
import { PageHeader } from '@/components/PageHeader';
import { DashboardPanel } from '@/components/Pages/Dashboard/DashboardPanel';

export const metadata: Metadata = { title: 'Visão geral · Finance Family' };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Visão geral" subtitle="Como está o mês da família" />
      {/* useSearchParams (mês na URL) exige Suspense */}
      <Suspense fallback={<LoadingMessage />}>
        <DashboardPanel />
      </Suspense>
    </>
  );
}
