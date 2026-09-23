'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { AccountFormSheet } from '@/components/Pages/Accounts/AccountFormSheet';
import { accountTypeInfo } from '@/constants/account';
import { formatCurrency } from '@/lib/money';
import { getAccounts, updateAccount } from '@/services/accounts';
import { getMembers } from '@/services/family';
import type { Account } from '@/types/account';
import { LoadingMessage } from '@/components/LoadingMessage';
import { ErrorMessage } from '@/components/ErrorMessage';
import S from './style.module.scss';

type SheetState = { account?: Account } | null;

function describe(account: Account) {
  if (account.type === 'CREDIT_CARD') return `Fecha dia ${account.closing_day} · vence dia ${account.due_day}`;
  return `Saldo inicial ${formatCurrency(account.opening_balance_cents)}`;
}

export function AccountsPanel() {
  const queryClient = useQueryClient();
  const [sheet, setSheet] = useState<SheetState>(null);

  const accounts = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const members = useQuery({ queryKey: ['members'], queryFn: getMembers });
  const canManage = members.data?.me.role === 'ADMIN';

  const toggle = useMutation({
    mutationFn: (account: Account) => updateAccount(account.id, { isActive: !account.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });

  if (accounts.isPending) return <LoadingMessage />;
  if (accounts.error) return <ErrorMessage message={accounts.error.message} onRetry={() => void accounts.refetch()} />;

  return (
    <>
      {toggle.error && <p className={S.error} role="alert">{toggle.error.message}</p>}

      <Card className={S.card}>
        {accounts.data.length === 0 && (
          <p className={S.info}>
            Você ainda não tem contas cadastradas.
            {canManage ? ' Crie a primeira para começar a lançar.' : ' Peça a um administrador para criar.'}
          </p>
        )}

        {accounts.data.length > 0 && (
          <p className={S.total}>
            Saldo total <b>{formatCurrency(accounts.data.reduce((sum, account) => sum + account.balance_cents, 0))}</b>
          </p>
        )}

        {accounts.data.map((account) => (
          <div key={account.id} className={account.isActive ? S.row : `${S.row} ${S.inactive}`}>
            <span className={S.icon} aria-hidden>{accountTypeInfo[account.type].icon}</span>
            <span className={S.name}>
              <b>{account.name}{!account.isActive && ' · desativada'}</b>
              <small>{accountTypeInfo[account.type].label} · {describe(account)}</small>
            </span>
            <span className={account.balance_cents < 0 ? `${S.balance} ${S.negative}` : S.balance}>
              {formatCurrency(account.balance_cents)}
            </span>
            {canManage && (
              <span className={S.actions}>
                <button type="button" className={S.link} onClick={() => setSheet({ account })}>Editar</button>
                <button type="button" className={S.link} disabled={toggle.isPending} onClick={() => toggle.mutate(account)}>
                  {account.isActive ? 'Desativar' : 'Ativar'}
                </button>
              </span>
            )}
          </div>
        ))}

        {canManage && (
          <Button variant="ghost" fullWidth className={S.add} onClick={() => setSheet({})}>
            ＋ Nova conta ou cartão
          </Button>
        )}
      </Card>

      <AccountFormSheet
        open={sheet !== null}
        onOpenChange={(open) => !open && setSheet(null)}
        account={sheet?.account}
      />
    </>
  );
}
