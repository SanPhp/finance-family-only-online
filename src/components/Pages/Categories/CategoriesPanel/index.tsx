'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryFormSheet } from '@/components/Pages/Categories/CategoryFormSheet';
import { getCategories, updateCategory } from '@/services/categories';
import { getMembers } from '@/services/family';
import type { Category, CategoryType } from '@/types/category';
import { LoadingMessage } from '@/components/LoadingMessage';
import { ErrorMessage } from '@/components/ErrorMessage';
import S from './style.module.scss';

type SheetState = { category?: Category; type: CategoryType } | null;

const groups: { type: CategoryType; title: string; empty: string }[] = [
  { type: 'EXPENSE', title: 'Saídas', empty: 'Nenhuma categoria de saída.' },
  { type: 'INCOME', title: 'Entradas', empty: 'Nenhuma categoria de entrada.' },
];

export function CategoriesPanel() {
  const queryClient = useQueryClient();
  const [sheet, setSheet] = useState<SheetState>(null);

  const categories = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const members = useQuery({ queryKey: ['members'], queryFn: getMembers });
  const canManage = members.data?.me.role === 'ADMIN';

  const toggle = useMutation({
    mutationFn: (category: Category) => updateCategory(category.id, { isActive: !category.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  if (categories.isPending) return <LoadingMessage />;
  if (categories.error) return <ErrorMessage message={categories.error.message} onRetry={() => void categories.refetch()} />;

  return (
    <>
      {toggle.error && <p className={S.error} role="alert">{toggle.error.message}</p>}

      <div className={S.grid}>
        {groups.map((group) => {
          const items = categories.data.filter((category) => category.type === group.type);
          return (
            <Card key={group.type} title={group.title}>
              {items.length === 0 && <p className={S.info}>{group.empty}</p>}

              {items.map((category) => (
                <div key={category.id} className={category.isActive ? S.row : `${S.row} ${S.inactive}`}>
                  <span className={S.icon} aria-hidden>{category.icon}</span>
                  <span className={S.name}>
                    {category.name}
                    {!category.isActive && <small> · desativada</small>}
                  </span>
                  {canManage && (
                    <span className={S.actions}>
                      <button type="button" className={S.link} onClick={() => setSheet({ category, type: group.type })}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className={S.link}
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate(category)}
                      >
                        {category.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                    </span>
                  )}
                </div>
              ))}

              {canManage && (
                <Button variant="ghost" fullWidth className={S.add} onClick={() => setSheet({ type: group.type })}>
                  ＋ Nova categoria
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <CategoryFormSheet
        open={sheet !== null}
        onOpenChange={(open) => !open && setSheet(null)}
        category={sheet?.category}
        type={sheet?.type ?? 'EXPENSE'}
      />
    </>
  );
}
