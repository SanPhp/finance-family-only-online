import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { MembersPanel } from '@/components/Pages/Members/MembersPanel';

export const metadata: Metadata = { title: 'Família · Finance Family' };

export default function MembersPage() {
  return (
    <>
      <PageHeader title="Família" subtitle="Quem usa o sistema com você" />
      <MembersPanel />
      <p style={{ marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <Link href="/accounts" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
          🏦 Contas e cartões →
        </Link>
        <Link href="/categories" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
          🏷️ Categorias →
        </Link>
        <Link href="/commitments" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
          📱 Compromissos →
        </Link>
      </p>
    </>
  );
}
