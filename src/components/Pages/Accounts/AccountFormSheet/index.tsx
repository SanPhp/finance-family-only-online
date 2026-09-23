'use client';

import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { MoneyInput } from '@/components/MoneyInput';
import { Select } from '@/components/Select';
import { Sheet } from '@/components/Sheet';
import { accountTypes } from '@/constants/account';
import { centsToInputValue, parseSignedMoneyToCents } from '@/lib/money';
import {
  AccountFormZodSchema,
  type AccountFormProps,
  type CreateAccountProps,
  type UpdateAccountProps,
} from '@/lib/validationZodSchema/AccountZodSchema';
import { createAccount, updateAccount } from '@/services/accounts';
import type { Account } from '@/types/account';
import S from './style.module.scss';

const FORM_ID = 'account-form';
const days = Array.from({ length: 31 }, (_, index) => index + 1);

const namePlaceholders = {
  CHECKING: 'Ex.: Nubank ou Itaú',
  CASH: 'Ex.: Carteira',
  CREDIT_CARD: 'Ex.: Nubank crédito',
  SAVINGS: 'Ex.: Poupança Caixa',
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
};

export function AccountFormSheet({ open, onOpenChange, account }: Props) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={account ? 'Editar conta' : 'Nova conta ou cartão'}
      footer={<Button type="submit" form={FORM_ID} fullWidth>Salvar</Button>}
    >
      {/* remonta ao trocar de conta, para os campos começarem com os valores certos */}
      <AccountForm key={account?.id ?? 'new'} account={account} onDone={() => onOpenChange(false)} />
    </Sheet>
  );
}

function AccountForm({ account, onDone }: { account?: Account; onDone: () => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AccountFormProps>({
    resolver: zodResolver(AccountFormZodSchema),
    defaultValues: {
      name: account?.name ?? '',
      type: account?.type ?? 'CHECKING',
      balance: account ? centsToInputValue(account.opening_balance_cents) : '',
      closing_day: account?.closing_day?.toString() ?? '',
      due_day: account?.due_day?.toString() ?? '',
    },
  });

  const type = useWatch({ control, name: 'type' });
  const isCard = type === 'CREDIT_CARD';

  const mutation = useMutation({
    mutationFn: (data: AccountFormProps) => {
      if (account) return updateAccount(account.id, toUpdatePayload(data));
      return createAccount(toCreatePayload(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onDone();
    },
  });

  return (
    <form id={FORM_ID} onSubmit={handleSubmit((data) => mutation.mutate(data))} noValidate>
      {!account && (
        <>
          <Select label="Tipo" error={errors.type?.message} {...register('type')}>
            {accountTypes.map((item) => (
              <option key={item.type} value={item.type}>{item.icon} {item.label}</option>
            ))}
          </Select>
          {type === 'CHECKING' && (
            <p className={S.help}>
              Usa o cartão no débito? É esta opção: a compra sai direto da conta. Exemplos: Nubank, Itaú, Inter.
            </p>
          )}
        </>
      )}

      <Input label="Nome" placeholder={namePlaceholders[type]} autoComplete="off" error={errors.name?.message} {...register('name')} />

      {isCard ? (
        <div className={S.days}>
          <Select label="Dia de fechamento" error={errors.closing_day?.message} {...register('closing_day')}>
            <option value="">Escolha</option>
            {days.map((day) => <option key={day} value={day}>Dia {day}</option>)}
          </Select>
          <Select label="Dia de vencimento" error={errors.due_day?.message} {...register('due_day')}>
            <option value="">Escolha</option>
            {days.map((day) => <option key={day} value={day}>Dia {day}</option>)}
          </Select>
        </div>
      ) : (
        <MoneyInput allowNegative
          label="Saldo inicial (R$)"
          placeholder="0,00"
          autoComplete="off"
          error={errors.balance?.message}
          {...register('balance')}
        />
      )}

      {mutation.error && <p className={S.error} role="alert">{mutation.error.message}</p>}
      {mutation.isPending && <p className={S.info}>Salvando...</p>}
    </form>
  );
}

function toCreatePayload(data: AccountFormProps): CreateAccountProps {
  if (data.type === 'CREDIT_CARD') {
    return {
      name: data.name,
      type: data.type,
      opening_balance_cents: 0,
      closing_day: Number(data.closing_day),
      due_day: Number(data.due_day),
    };
  }
  return { name: data.name, type: data.type, opening_balance_cents: parseSignedMoneyToCents(data.balance) ?? 0 };
}

function toUpdatePayload(data: AccountFormProps): UpdateAccountProps {
  if (data.type === 'CREDIT_CARD') {
    return { name: data.name, closing_day: Number(data.closing_day), due_day: Number(data.due_day) };
  }
  return { name: data.name, opening_balance_cents: parseSignedMoneyToCents(data.balance) ?? 0 };
}
