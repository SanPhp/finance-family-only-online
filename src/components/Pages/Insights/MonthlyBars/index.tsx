import { formatMonthShort } from '@/lib/date';
import { formatCurrency } from '@/lib/money';
import type { InsightsResponse } from '@/types/insight';
import S from './style.module.scss';

type Props = {
  monthly: InsightsResponse['monthly'];
  /** AAAA-MM do mês consultado, que fica destacado */
  current: string;
};

/** Saídas dos últimos meses. A altura é relativa ao maior mês da série. */
export function MonthlyBars({ monthly, current }: Props) {
  const max = Math.max(...monthly.map((entry) => entry.expense_cents), 1);

  return (
    <div className={S.bars}>
      {monthly.map((entry) => (
        <div key={entry.month} className={entry.month === current ? `${S.column} ${S.current}` : S.column}>
          <span className={S.value}>{formatCurrency(entry.expense_cents).replace(',00', '')}</span>
          <i
            className={S.bar}
            // mês sem saídas ainda mostra um risquinho, para a coluna não sumir
            style={{ height: `${Math.max((entry.expense_cents * 100) / max, 3)}%` }}
            role="img"
            aria-label={`${formatMonthShort(entry.month)}: ${formatCurrency(entry.expense_cents)} em saídas`}
          />
          <span>{formatMonthShort(entry.month)}</span>
        </div>
      ))}
    </div>
  );
}
