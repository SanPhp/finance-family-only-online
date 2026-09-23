import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { CategoriesPanel } from '@/components/Pages/Categories/CategoriesPanel';

export const metadata: Metadata = { title: 'Categorias · Finance Family' };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categorias" subtitle="Como você organiza o que entra e o que sai" />
      <CategoriesPanel />
    </>
  );
}
