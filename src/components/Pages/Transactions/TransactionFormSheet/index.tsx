'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { MoneyInput } from '@/components/MoneyInput';
import { Modal } from '@/components/Modal';
import { Select } from '@/components/Select';
import { Sheet } from '@/components/Sheet';
import { getBudgetAlert, type BudgetAlert } from '@/lib/budgetAlert';
import { todayISO } from '@/lib/date';
import { ApiError } from '@/lib/axios';
import { centsToInputValue, parseMoneyToCents } from '@/lib/money';
import { newUlid } from '@/lib/ulid';
import { canAutoFocusSafely } from '@/lib/useAutoFocusSafe';
import {
  TransactionFormZodSchema,
  type CreateTransactionProps,
  type TransactionFormProps,
} from '@/lib/validationZodSchema/TransactionZodSchema';
import { getBudgets } from '@/services/budgets';
import { getCommitments } from '@/services/commitments';
import { createTransaction, deleteTransaction, updateTransaction } from '@/services/transactions';
import type { Account } from '@/types/account';
import type { Category, CategoryType } from '@/types/category';
import type { Member } from '@/types/family';
import type { Transaction } from '@/types/transaction';
import S from './style.module.scss';

const FORM_ID = 'transaction-form';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** presente = editando; ausente = novo lançamento */
  transaction?: Transaction;
  categories: Category[];
  accounts: Account[];
  members: Member[];
  currentUserId: string;
};

export function TransactionFormSheet({ open, onOpenChange, transaction, ...lists }: Props) {
  // com a confirmação de exclusão aberta, o Sheet fica travado: Esc e clique fora não fecham os dois
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={transaction ? 'Editar lançamento' : 'Novo lançamento'}
      locked={confirmDelete}
    >
      {/* remonta a cada abertura: campos e o id do novo lançamento começam do zero */}
      <TransactionForm
        key={transaction?.id ?? 'new'}
        transaction={transaction}
        onDone={() => onOpenChange(false)}
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        {...lists}
      />
    </Sheet>
  );
}

function TransactionForm({
  transaction,
  onDone,
  confirmDelete,
  setConfirmDelete,
  categories,
  accounts,
  members,
  currentUserId,
}: Omit<Props, 'open' | 'onOpenChange'> & {
  onDone: () => void;
  confirmDelete: boolean;
  setConfirmDelete: (value: boolean) => void;
}) {
  const queryClient = useQueryClient();
  // o id nasce aqui e é reaproveitado se a pessoa tocar em "Salvar" duas vezes: o servidor não duplica
  const [newId] = useState(() => newUlid());
  // em telas de toque, focar o campo cedo demais abre o teclado e fecha o Sheet (ver useAutoFocusSafe)
  const [autoFocusAmount] = useState(canAutoFocusSafely);

  const activeAccounts = accounts.filter((account) => account.isActive || account.id === transaction?.id_account);
  const activeMembers = members.filter((member) => member.isActive || member.id === transaction?.id_user);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<TransactionFormProps>({
    resolver: zodResolver(TransactionFormZodSchema),
    defaultValues: {
      type: transaction?.type ?? 'EXPENSE',
      amount: transaction ? centsToInputValue(transaction.amount_cents) : '',
      id_category: transaction?.id_category ?? '',
      description: transaction?.description ?? '',
      id_user: transaction ? (transaction.id_user ?? 'shared') : currentUserId,
      id_commitment: transaction?.id_commitment ?? '',
      id_account: transaction?.id_account ?? (activeAccounts.length === 1 ? activeAccounts[0].id : ''),
      occurred_on: transaction?.occurred_on ?? todayISO(),
    },
  });

  const type = useWatch({ control, name: 'type' });
  const selectedCategory = useWatch({ control, name: 'id_category' });
  const amountValue = useWatch({ control, name: 'amount' });
  const occurredOn = useWatch({ control, name: 'occurred_on' });

  // orçamento do mês da data escolhida, para avisar se este gasto o estoura (só informa, não bloqueia)
  const budgetMonth = /^\d{4}-\d{2}-\d{2}$/.test(occurredOn) ? occurredOn.slice(0, 7) : null;
  const budgets = useQuery({
    queryKey: ['budgets', budgetMonth],
    queryFn: () => getBudgets(budgetMonth!),
    enabled: budgetMonth !== null && type === 'EXPENSE',
  });
  const budget = type === 'EXPENSE' ? budgets.data?.items.find((item) => item.id_category === selectedCategory) : undefined;
  const cents = parseMoneyToCents(amountValue);
  let budgetAlert: BudgetAlert | null = null;
  if (budget && cents && cents > 0) {
    // ao editar, o valor antigo deste mesmo lançamento já está somado no gasto: informa para não contar duas vezes
    const sameSpot =
      transaction?.type === 'EXPENSE' && transaction.id_category === selectedCategory && transaction.occurred_on.slice(0, 7) === budgetMonth;
    budgetAlert = getBudgetAlert({
      categoryName: categories.find((category) => category.id === selectedCategory)?.name ?? 'A categoria',
      limitCents: budget.amount_cents,
      spentCents: budget.spent_cents,
      amountCents: cents,
      previousCents: sameSpot ? transaction.amount_cents : 0,
    });
  }

  // compromissos (parcelas) que ainda aceitam pagamento: os ativos, mais o que este lançamento já usava
  const commitments = useQuery({ queryKey: ['commitments'], queryFn: getCommitments, enabled: type === 'EXPENSE' });
  const linkableCommitments = (commitments.data ?? []).filter(
    (commitment) => commitment.status === 'ACTIVE' || commitment.id === transaction?.id_commitment,
  );

  const visibleCategories = categories.filter(
    (category) => category.type === type && (category.isActive || category.id === transaction?.id_category),
  );

  function changeType(next: CategoryType) {
    setValue('type', next);
    setValue('id_category', ''); // a categoria escolhida pertence ao outro tipo
  }

  const save = useMutation({
    mutationFn: (data: TransactionFormProps) => {
      const payload: Omit<CreateTransactionProps, 'id'> = {
        type: data.type,
        id_account: data.id_account,
        id_category: data.id_category,
        id_user: data.id_user === 'shared' ? null : data.id_user,
        id_commitment: data.id_commitment || null,
        amount_cents: parseMoneyToCents(data.amount) ?? 0,
        description: data.description,
        occurred_on: data.occurred_on,
      };
      return transaction ? updateTransaction(transaction.id, payload) : createTransaction({ ...payload, id: newId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
      onDone();
    },
    onError: (error) => {
      if (!(error instanceof ApiError) || !error.fields) return;
      const fieldMap = { amount_cents: 'amount' } as Record<string, keyof TransactionFormProps>;
      for (const [field, message] of Object.entries(error.fields)) {
        setError(fieldMap[field] ?? (field as keyof TransactionFormProps), { message });
      }
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteTransaction(transaction!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
      setConfirmDelete(false);
      onDone();
    },
  });

  if (activeAccounts.length === 0) {
    // quem administra a família pode criar a conta; o membro precisa pedir
    const isAdmin = members.find((member) => member.id === currentUserId)?.role === 'ADMIN';
    return isAdmin ? (
      <div className={S.empty}>
        <p className={S.hint}>Você ainda não tem contas nem cartões. Crie a primeira para começar a lançar.</p>
        <Link href="/accounts" className={S.linkButton}>Criar minha primeira conta</Link>
      </div>
    ) : (
      <p className={S.hint}>
        Ainda não há uma conta ativa para lançar. Peça a um administrador para criar em{' '}
        <Link href="/accounts" className={S.link}>Contas e cartões</Link>.
      </p>
    );
  }

  const saveError =
    save.error && !(save.error instanceof ApiError && save.error.fields) ? save.error.message : null;

  return (
    <>
      <form id={FORM_ID} onSubmit={handleSubmit((data) => save.mutate(data))} noValidate>
        <div className={S.segment} role="group" aria-label="Tipo">
          <button type="button" className={type === 'EXPENSE' ? `${S.seg} ${S.out}` : S.seg} aria-pressed={type === 'EXPENSE'} onClick={() => changeType('EXPENSE')}>
            ⬆️ Saída
          </button>
          <button type="button" className={type === 'INCOME' ? `${S.seg} ${S.in}` : S.seg} aria-pressed={type === 'INCOME'} onClick={() => changeType('INCOME')}>
            ⬇️ Entrada
          </button>
        </div>

        <MoneyInput
          label="Valor (R$)"
          placeholder="0,00"
          autoComplete="off"
          autoFocus={!transaction && autoFocusAmount}
          error={errors.amount?.message}
          {...register('amount')}
        />

        <span className={S.label} id="category-label">Categoria</span>
        <div className={S.cats} role="group" aria-labelledby="category-label">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={category.id === selectedCategory ? `${S.cat} ${S.catOn}` : S.cat}
              aria-pressed={category.id === selectedCategory}
              onClick={() => setValue('id_category', category.id, { shouldValidate: true })}
            >
              <span aria-hidden>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
        {visibleCategories.length === 0 && <p className={S.hint}>Não há categorias ativas desse tipo.</p>}
        {errors.id_category && <span className={S.error} role="alert">{errors.id_category.message}</span>}
        {budgetAlert && (
          <p className={budgetAlert.level === 'danger' ? `${S.alert} ${S.alertDanger}` : `${S.alert} ${S.alertWarning}`} role="status">
            ⚠️ {budgetAlert.text}
          </p>
        )}

        <Input label="Descrição" autoComplete="off" placeholder="Ex.: Padaria" error={errors.description?.message} {...register('description')} />

        {type === 'EXPENSE' && linkableCommitments.length > 0 && (
          <Select label="Parcela de um compromisso? (opcional)" error={errors.id_commitment?.message} {...register('id_commitment')}>
            <option value="">Não é parcela de nada</option>
            {linkableCommitments.map((commitment) => (
              <option key={commitment.id} value={commitment.id}>
                {commitment.name} ({commitment.paid_installments}/{commitment.total_installments})
              </option>
            ))}
          </Select>
        )}

        <Select label="Quem gastou" error={errors.id_user?.message} {...register('id_user')}>
          <option value="shared">Família (compartilhado)</option>
          {activeMembers.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </Select>

        <Select label="Conta ou cartão" error={errors.id_account?.message} {...register('id_account')}>
          <option value="">Escolha</option>
          {activeAccounts.map((account) => (
            <option key={account.id} value={account.id}>{account.name}</option>
          ))}
        </Select>

        <Input label="Data" type="date" error={errors.occurred_on?.message} {...register('occurred_on')} />

        {saveError && <p className={S.error} role="alert">{saveError}</p>}

        <div className={S.actions}>
          {transaction && (
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
              Excluir
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
        title="Excluir lançamento?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate()}>
              {remove.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </>
        }
      >
        <p>Ele deixa de aparecer na lista e nos totais.</p>
        {remove.error && <p className={S.error} role="alert">{remove.error.message}</p>}
      </Modal>
    </>
  );
}
