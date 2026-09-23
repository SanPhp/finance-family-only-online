import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
      <h1>Página não encontrada</h1>
      <p style={{ color: 'var(--muted)' }}>O endereço não existe ou foi movido.</p>
      <p>
        <Link href="/dashboard" style={{ color: 'var(--brand-text)', fontWeight: 700 }}>
          Ir para a visão geral →
        </Link>
      </p>
    </main>
  );
}
