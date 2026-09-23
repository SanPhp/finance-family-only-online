import { formatDayHeading, todayISO } from '@/lib/date';
import { formatCurrency } from '@/lib/money';
import type { Account } from '@/types/account';
import type { Category } from '@/types/category';
import type { Member } from '@/types/family';
import type { Transaction } from '@/types/transaction';
import S from './style.module.scss';

type Props = {
  items: Transaction[];
  categories: Category[];
  accounts: Account[];
  members: Member[];
  /** só as linhas que a pessoa pode alterar viram botão */
  canEdit: (item: Transaction) => boolean;
  onSelect: (item: Transaction) => void;
};

/** Lista agrupada por dia. Os nomes vêm das listas já carregadas (a API só devolve ids). */
export function TransactionList({ items, categories, accounts, members, canEdit, onSelect }: Props) {
  const today = todayISO();
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const memberById = new Map(members.map((member) => [member.id, member]));

  const days: { date: string; items: Transaction[] }[] = [];
  for (const item of items) {
    const last = days[days.length - 1];
    if (last && last.date === item.occurred_on) last.items.push(item);
    else days.push({ date: item.occurred_on, items: [item] });
  }

  return (
    <div>
      {days.map((day) => (
        <section key={day.date}>
          <h2 className={S.day}>{formatDayHeading(day.date, today)}</h2>
          {day.items.map((item) => {
            const category = categoryById.get(item.id_category);
            const who = item.id_user ? memberById.get(item.id_user)?.name : 'Família';
            const details = [category?.name, accountById.get(item.id_account)?.name, who].filter(Boolean).join(' · ');
            const isIncome = item.type === 'INCOME';

            const content = (
              <>
                <span className={S.icon} aria-hidden>{category?.icon ?? '❔'}</span>
                <span className={S.text}>
                  <b>{item.description}</b>
                  <small>{details}</small>
                </span>
                <span className={isIncome ? S.income : S.expense}>
                  {isIncome ? '+' : '−'} {formatCurrency(item.amount_cents)}
                </span>
              </>
            );

            return canEdit(item) ? (
              <button key={item.id} type="button" className={`${S.row} ${S.clickable}`} onClick={() => onSelect(item)}>
                {content}
              </button>
            ) : (
              <div key={item.id} className={S.row}>{content}</div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
