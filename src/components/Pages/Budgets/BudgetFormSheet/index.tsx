'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { MoneyInput } from '@/components/MoneyInput';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/Select';
import { Sheet } from '@/components/Sheet';
import { ApiError } from '@/lib/axios';
import { centsToInputValue, parseMoneyToCents } from '@/lib/money';
import { BudgetFormZodSchema, type BudgetFormProps } from '@/lib/validationZodSchema/BudgetZodSchema';
import { createBudget, deleteBudget, updateBudget } from '@/services/budgets';
import { canAutoFocusSafely } from '@/lib/useAutoFocusSafe';
import type { Budget } from '@/types/budget';
import type { Category } from '@/types/category';
import S from './style.module.scss';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** presente = editando o limite; ausente = novo orçamento */
  budget?: Budget;
  categoryName?: string;
  /** categorias de saída ativas que ainda não têm orçamento */
  freeCategories: Category[];
};

export function BudgetFormSheet({ open, onOpenChange, budget, ...rest }: Props) {
  // com a confirmação de remoção aberta, o Sheet fica travado: Esc e clique fora não fecham os dois
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={budget ? 'Editar orçamento' : 'Novo orçamento'}
      locked={confirmDelete}
    >
      <BudgetForm
        key={budget?.id ?? 'new'}
        budget={budget}
        onDone={() => onOpenChange(false)}
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        {...rest}
      />
    </Sheet>
  );
}

function BudgetForm({
  budget,
  categoryName,
  freeCategories,
  onDone,
  confirmDelete,
  setConfirmDelete,
}: Omit<Props, 'open' | 'onOpenChange'> & {
  onDone: () => void;
  confirmDelete: boolean;
  setConfirmDelete: (value: boolean) => void;
}) {
  const queryClient = useQueryClient();
  // em telas de toque, focar o campo cedo demais abre o teclado e fecha o Sheet (ver useAutoFocusSafe)
  const [autoFocusAmount] = useState(canAutoFocusSafely);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BudgetFormProps>({
    resolver: zodResolver(BudgetFormZodSchema),
    defaultValues: {
      id_category: budget?.id_category ?? '',
      amount: budget ? centsToInputValue(budget.amount_cents) : '',
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
  };

  const save = useMutation({
    mutationFn: (data: BudgetFormProps) => {
      const amount_cents = parseMoneyToCents(data.amount) ?? 0;
      return budget ? updateBudget(budget.id, { amount_cents }) : createBudget({ id_category: data.id_category, amount_cents });
    },
    onSuccess: () => {
      refresh();
      onDone();
    },
    onError: (error) => {
      if (!(error instanceof ApiError) || !error.fields) return;
      const fieldMap = { amount_cents: 'amount' } as Record<string, keyof BudgetFormProps>;
      for (const [field, message] of Object.entries(error.fields)) {
        setError(fieldMap[field] ?? (field as keyof BudgetFormProps), { message });
      }
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteBudget(budget!.id),
    onSuccess: () => {
      refresh();
      setConfirmDelete(false);
      onDone();
    },
  });

  const saveError = save.error && !(save.error instanceof ApiError && save.error.fields) ? save.error.message : null;

  return (
    <>
      <form onSubmit={handleSubmit((data) => save.mutate(data))} noValidate>
        {budget ? (
          <p className={S.category}>Categoria: <b>{categoryName ?? '—'}</b></p>
        ) : (
          <Select label="Categoria" error={errors.id_category?.message} {...register('id_category')}>
            <option value="">Escolha</option>
            {freeCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
            ))}
          </Select>
        )}

        <MoneyInput
          label="Limite mensal (R$)"
          placeholder="0,00"
          autoComplete="off"
          autoFocus={autoFocusAmount}
          error={errors.amount?.message}
          {...register('amount')}
        />
        <p className={S.help}>Vale para todos os meses, até você mudar.</p>

        {saveError && <p className={S.error} role="alert">{saveError}</p>}

        <div className={S.actions}>
          {budget && (
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
              Remover
            </Button>
          )}
          <Button type="submit" disabled={save.isPending} className={S.save}>
            {save.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Remover orçamento?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate()}>
              {remove.isPending ? 'Removendo...' : 'Remover'}
            </Button>
          </>
        }
      >
        <p>Os lançamentos da categoria continuam; ela só deixa de ter um limite.</p>
        {remove.error && <p className={S.error} role="alert">{remove.error.message}</p>}
      </Modal>
    </>
  );
}
