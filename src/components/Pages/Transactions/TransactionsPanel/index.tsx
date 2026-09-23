'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TransactionFilters } from '@/components/Pages/Transactions/TransactionFilters';
import { TransactionFormSheet } from '@/components/Pages/Transactions/TransactionFormSheet';
import { TransactionList } from '@/components/Pages/Transactions/TransactionList';
import { currentMonth, monthRange } from '@/lib/date';
import { formatCurrency } from '@/lib/money';
import { getAccounts } from '@/services/accounts';
import { getCategories } from '@/services/categories';
import { getMembers } from '@/services/family';
import { getTransactions } from '@/services/transactions';
import type { Transaction } from '@/types/transaction';
import { LoadingMessage } from '@/components/LoadingMessage';
import { ErrorMessage } from '@/components/ErrorMessage';
import S from './style.module.scss';

const PAGE_SIZE = 30;
const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

export function TransactionsPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const monthParam = params.get('month');
  const month = monthParam && MONTH_FORMAT.test(monthParam) ? monthParam : currentMonth();
  const typeParam = params.get('type');
  const type = typeParam === 'INCOME' || typeParam === 'EXPENSE' ? typeParam : undefined;
  const id_category = params.get('category') ?? undefined;
  const id_account = params.get('account') ?? undefined;
  const id_user = params.get('member') ?? undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const isNewOpen = params.get('new') === '1';
  const [editing, setEditing] = useState<Transaction | null>(null);

  /** Atualiza a URL. Mudar um filtro volta para a página 1 (abrir/fechar o "novo" não). */
  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    if (Object.keys(changes).some((key) => key !== 'page' && key !== 'new')) next.delete('page');
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  const transactions = useQuery({
    queryKey: ['transactions', { month, type, id_category, id_account, id_user, page }],
    queryFn: () => getTransactions({ ...monthRange(month), type, id_category, id_account, id_user, page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const categories = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const members = useQuery({ queryKey: ['members'], queryFn: getMembers });

  // erros primeiro: assim o TypeScript sabe que, depois disso, os dados existem
  if (transactions.isError) return <ErrorMessage message={transactions.error.message} onRetry={() => void transactions.refetch()} />;
  if (categories.isError) return <ErrorMessage message={categories.error.message} onRetry={() => void categories.refetch()} />;
  if (accounts.isError) return <ErrorMessage message={accounts.error.message} onRetry={() => void accounts.refetch()} />;
  if (members.isError) return <ErrorMessage message={members.error.message} onRetry={() => void members.refetch()} />;
  if (transactions.isPending || categories.isPending || accounts.isPending || members.isPending) {
    return <LoadingMessage />;
  }

  const { me } = members.data;
  const { items, totals, total, limit } = transactions.data;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const balance = totals.income_cents - totals.expense_cents;
  const activeFilters = [id_category, id_account, id_user].filter(Boolean).length;
  // ADMIN altera qualquer lançamento; MEMBER só os que ele mesmo registrou
  const canEdit = (item: Transaction) => me.role === 'ADMIN' || item.id_created_by === me.id_user;
  const sheetLists = {
    categories: categories.data,
    accounts: accounts.data,
    members: members.data.members,
    currentUserId: me.id_user,
  };

  return (
    <>
      <TransactionFilters
        onNew={() => update({ new: '1' })}
        month={month}
        type={type}
        id_category={id_category}
        id_account={id_account}
        id_user={id_user}
        activeFilters={activeFilters}
        categories={categories.data}
        accounts={accounts.data}
        members={members.data.members}
        onChange={update}
      />

      <div className={S.summary}>
        <Card className={S.kpi}>
          <span className={S.kpiLabel}>⬇️ Entradas</span>
          <b className={`${S.kpiValue} ${S.income}`}>{formatCurrency(totals.income_cents)}</b>
        </Card>
        <Card className={S.kpi}>
          <span className={S.kpiLabel}>⬆️ Saídas</span>
          <b className={`${S.kpiValue} ${S.expense}`}>{formatCurrency(totals.expense_cents)}</b>
        </Card>
        <Card className={S.kpi}>
          <span className={S.kpiLabel}>💰 Saldo</span>
          <b className={`${S.kpiValue} ${balance < 0 ? S.expense : ''}`}>{formatCurrency(balance)}</b>
        </Card>
      </div>

      <Card>
        {items.length === 0 ? (
          <div className={S.empty}>
            <p>{activeFilters > 0 || type ? 'Nenhum lançamento com esses filtros.' : 'Nenhum lançamento neste mês.'}</p>
            {activeFilters > 0 || type ? (
              <Button variant="ghost" onClick={() => update({ type: null, category: null, account: null, member: null })}>
                Limpar filtros
              </Button>
            ) : (
              <Button onClick={() => update({ new: '1' })}>＋ Registrar um lançamento</Button>
            )}
          </div>
        ) : (
          <TransactionList
            items={items}
            categories={categories.data}
            accounts={accounts.data}
            members={members.data.members}
            canEdit={canEdit}
            onSelect={setEditing}
          />
        )}

        {totalPages > 1 && (
          <nav className={S.pager} aria-label="Paginação">
            <Button variant="ghost" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
              ← Anterior
            </Button>
            <span>Página {page} de {totalPages}</span>
            <Button variant="ghost" disabled={page >= totalPages} onClick={() => update({ page: String(page + 1) })}>
              Próxima →
            </Button>
          </nav>
        )}
      </Card>

      <TransactionFormSheet
        open={isNewOpen}
        onOpenChange={(open) => !open && update({ new: null })}
        {...sheetLists}
      />
      <TransactionFormSheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        transaction={editing ?? undefined}
        {...sheetLists}
      />
    </>
  );
}
