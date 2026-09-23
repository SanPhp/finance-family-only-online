'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { MoneyInput } from '@/components/MoneyInput';
import { Select } from '@/components/Select';
import { Sheet } from '@/components/Sheet';
import { ApiError } from '@/lib/axios';
import { centsToInputValue, parseMoneyToCents } from '@/lib/money';
import { CommitmentFormZodSchema, type CommitmentFormProps } from '@/lib/validationZodSchema/CommitmentZodSchema';
import { createCommitment, updateCommitment } from '@/services/commitments';
import type { Category } from '@/types/category';
import type { Commitment } from '@/types/commitment';
import S from './style.module.scss';

const FORM_ID = 'commitment-form';
const days = Array.from({ length: 31 }, (_, index) => index + 1);

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** presente = editando; ausente = novo compromisso */
  commitment?: Commitment;
  categories: Category[];
};

export function CommitmentFormSheet({ open, onOpenChange, commitment, categories }: Props) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={commitment ? 'Editar compromisso' : 'Novo compromisso'}
      footer={<Button type="submit" form={FORM_ID} fullWidth>Salvar</Button>}
    >
      {/* remonta ao trocar de compromisso, para os campos começarem com os valores certos */}
      <CommitmentForm key={commitment?.id ?? 'new'} commitment={commitment} categories={categories} onDone={() => onOpenChange(false)} />
    </Sheet>
  );
}

function CommitmentForm({ commitment, categories, onDone }: Omit<Props, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const queryClient = useQueryClient();
  const expenseCategories = categories.filter((category) => category.type === 'EXPENSE' && (category.isActive || category.id === commitment?.id_category));

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CommitmentFormProps>({
    resolver: zodResolver(CommitmentFormZodSchema),
    defaultValues: {
      id_category: commitment?.id_category ?? '',
      name: commitment?.name ?? '',
      amount: commitment ? centsToInputValue(commitment.amount_cents) : '',
      total_installments: commitment ? String(commitment.total_installments) : '',
      paid_installments: commitment ? String(commitment.paid_installments) : '0',
      due_day: commitment?.due_day ? String(commitment.due_day) : '',
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['commitments'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] }); // as opções de vínculo do formulário de lançamento mudam
  };

  const save = useMutation({
    mutationFn: (data: CommitmentFormProps) => {
      const payload = {
        name: data.name,
        amount_cents: parseMoneyToCents(data.amount) ?? 0,
        paid_installments: Number(data.paid_installments) || 0,
        due_day: data.due_day ? Number(data.due_day) : null,
      };
      return commitment
        ? updateCommitment(commitment.id, payload)
        : createCommitment({ id_category: data.id_category, name: payload.name, amount_cents: payload.amount_cents, total_installments: Number(data.total_installments) || 1, paid_installments: payload.paid_installments, due_day: payload.due_day ?? undefined });
    },
    onSuccess: () => {
      refresh();
      onDone();
    },
    onError: (error) => {
      if (!(error instanceof ApiError) || !error.fields) return;
      const fieldMap = { amount_cents: 'amount', total_installments: 'total_installments', paid_installments: 'paid_installments' } as Record<
        string,
        keyof CommitmentFormProps
      >;
      for (const [field, message] of Object.entries(error.fields)) {
        setError(fieldMap[field] ?? (field as keyof CommitmentFormProps), { message });
      }
    },
  });

  const toggleStatus = useMutation({
    mutationFn: () => updateCommitment(commitment!.id, { status: commitment!.status === 'DONE' ? 'ACTIVE' : 'DONE' }),
    onSuccess: () => {
      refresh();
      onDone();
    },
  });

  const saveError = save.error && !(save.error instanceof ApiError && save.error.fields) ? save.error.message : null;

  return (
    <form id={FORM_ID} onSubmit={handleSubmit((data) => save.mutate(data))} noValidate>
      {commitment ? (
        <p className={S.category}>Categoria: <b>{categories.find((category) => category.id === commitment.id_category)?.name ?? '—'}</b></p>
      ) : (
        <Select label="Categoria" error={errors.id_category?.message} {...register('id_category')}>
          <option value="">Escolha</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
          ))}
        </Select>
      )}

      <Input label="Nome" placeholder="Ex.: Celular" autoComplete="off" error={errors.name?.message} {...register('name')} />

      <MoneyInput label="Valor da parcela (R$)" placeholder="0,00" autoComplete="off" error={errors.amount?.message} {...register('amount')} />

      {commitment ? (
        <p className={S.category}>Total de parcelas: <b>{commitment.total_installments}</b></p>
      ) : (
        <Input label="Total de parcelas" type="number" inputMode="numeric" min={1} max={999} placeholder="Ex.: 10" error={errors.total_installments?.message} {...register('total_installments')} />
      )}

      <Input
        label="Parcelas já pagas"
        type="number"
        inputMode="numeric"
        min={0}
        error={errors.paid_installments?.message}
        {...register('paid_installments')}
      />
      <p className={S.help}>Você pode ajustar este número a qualquer momento — inclusive parcelas pagas antes de cadastrar aqui.</p>

      <Select label="Dia de vencimento (opcional)" error={errors.due_day?.message} {...register('due_day')}>
        <option value="">Sem data fixa</option>
        {days.map((day) => <option key={day} value={day}>Dia {day}</option>)}
      </Select>

      {saveError && <p className={S.error} role="alert">{saveError}</p>}

      {commitment && (
        <Button
          type="button"
          variant="ghost"
          fullWidth
          disabled={toggleStatus.isPending}
          className={S.toggle}
          onClick={() => toggleStatus.mutate()}
        >
          {commitment.status === 'DONE' ? 'Reabrir compromisso' : 'Marcar como concluído'}
        </Button>
      )}
      {toggleStatus.error && <p className={S.error} role="alert">{toggleStatus.error.message}</p>}
    </form>
  );
}
