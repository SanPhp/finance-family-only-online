import { currentMonth, formatMonthLabel, shiftMonth } from '@/lib/date';
import S from './style.module.scss';

type Props = {
  /** AAAA-MM */
  month: string;
  onChange: (month: string) => void;
};

export function MonthSwitcher({ month, onChange }: Props) {
  return (
    <div className={S.month}>
      <button type="button" className={S.arrow} onClick={() => onChange(shiftMonth(month, -1))} aria-label="Mês anterior">
        ‹
      </button>
      <strong className={S.label}>{formatMonthLabel(month)}</strong>
      <button type="button" className={S.arrow} onClick={() => onChange(shiftMonth(month, 1))} aria-label="Próximo mês">
        ›
      </button>
      {month !== currentMonth() && (
        <button type="button" className={S.today} onClick={() => onChange(currentMonth())}>
          Este mês
        </button>
      )}
    </div>
  );
}
