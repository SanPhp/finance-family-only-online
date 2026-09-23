'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { Sheet } from '@/components/Sheet';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import type { Account } from '@/types/account';
import type { Category } from '@/types/category';
import type { Member } from '@/types/family';
import S from './style.module.scss';

type Props = {
  month: string;
  type?: 'INCOME' | 'EXPENSE';
  id_category?: string;
  id_account?: string;
  id_user?: string;
  activeFilters: number;
  categories: Category[];
  accounts: Account[];
  members: Member[];
  onChange: (changes: Record<string, string | null>) => void;
  onNew: () => void;
};

const types = [
  { value: null, label: 'Todos' },
  { value: 'INCOME', label: '⬇️ Entradas' },
  { value: 'EXPENSE', label: '⬆️ Saídas' },
] as const;

const FORM_ID = 'transaction-filters-form';

export function TransactionFilters(props: Props) {
  const { month, type, activeFilters, onChange, onNew } = props;
  const [open, setOpen] = useState(false);

  return (
    <div className={S.bar}>
      <MonthSwitcher month={month} onChange={(next) => onChange({ month: next })} />

      <div className={S.chips} role="group" aria-label="Tipo">
        {types.map((item) => (
          <button
            key={item.label}
            type="button"
            className={(item.value ?? undefined) === type ? `${S.chip} ${S.on}` : S.chip}
            aria-pressed={(item.value ?? undefined) === type}
            onClick={() => onChange({ type: item.value })}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className={activeFilters > 0 ? `${S.chip} ${S.on}` : S.chip} onClick={() => setOpen(true)}>
          Filtros{activeFilters > 0 && ` (${activeFilters})`}
        </button>
        {/* no celular o botão flutuante ＋ faz esse papel */}
        <div className={S.newButton}>
          <Button onClick={onNew}>＋ Novo lançamento</Button>
        </div>
      </div>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Filtros"
        footer={
          <div className={S.footer}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onChange({ category: null, account: null, member: null });
                setOpen(false);
              }}
            >
              Limpar
            </Button>
            <Button type="submit" form={FORM_ID}>Aplicar</Button>
          </div>
        }
      >
        <FiltersForm {...props} onDone={() => setOpen(false)} />
      </Sheet>
    </div>
  );
}

function FiltersForm({ id_category, id_account, id_user, categories, accounts, members, onChange, onDone }: Props & { onDone: () => void }) {
  const [category, setCategory] = useState(id_category ?? '');
  const [account, setAccount] = useState(id_account ?? '');
  const [member, setMember] = useState(id_user ?? '');

  return (
    <form
      id={FORM_ID}
      onSubmit={(event) => {
        event.preventDefault();
        onChange({ category: category || null, account: account || null, member: member || null });
        onDone();
      }}
    >
      <Select label="Categoria" value={category} onChange={(event) => setCategory(event.target.value)}>
        <option value="">Todas</option>
        {categories.map((item) => (
          <option key={item.id} value={item.id}>
            {item.icon} {item.name}{!item.isActive && ' (desativada)'}
          </option>
        ))}
      </Select>

      <Select label="Conta ou cartão" value={account} onChange={(event) => setAccount(event.target.value)}>
        <option value="">Todas</option>
        {accounts.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}{!item.isActive && ' (desativada)'}
          </option>
        ))}
      </Select>

      <Select label="Quem gastou" value={member} onChange={(event) => setMember(event.target.value)}>
        <option value="">Todos</option>
        <option value="shared">Família (compartilhado)</option>
        {members.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </Select>
    </form>
  );
}
