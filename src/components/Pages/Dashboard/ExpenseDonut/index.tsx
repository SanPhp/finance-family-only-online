import { formatCurrency } from '@/lib/money';
import S from './style.module.scss';

export type DonutItem = { id: string; label: string; icon: string; amount_cents: number };

// cores fixas por posição; a última (cinza) é sempre "Outras"
const COLORS = ['#8b5cf6', '#f43f5e', '#f59e0b', '#10b981', '#38bdf8'];
const OTHERS_COLOR = '#94a3b8';
const MAX_SLICES = 5;

/** Rosca das saídas por categoria: as 5 maiores e o restante agrupado em "Outras". */
export function ExpenseDonut({ items }: { items: DonutItem[] }) {
  const total = items.reduce((sum, item) => sum + item.amount_cents, 0);

  if (total === 0) return <p className={S.empty}>Nenhuma saída neste mês.</p>;

  const top = items.slice(0, MAX_SLICES);
  const rest = items.slice(MAX_SLICES).reduce((sum, item) => sum + item.amount_cents, 0);
  const slices = [
    ...top.map((item, index) => ({ ...item, color: COLORS[index] })),
    ...(rest > 0 ? [{ id: 'others', label: 'Outras', icon: '📦', amount_cents: rest, color: OTHERS_COLOR }] : []),
  ];

  let cursor = 0;
  const stops = slices
    .map((slice) => {
      const start = cursor;
      cursor += (slice.amount_cents * 100) / total;
      return `${slice.color} ${start}% ${cursor}%`;
    })
    .join(', ');

  return (
    <div>
      <div
        className={S.donut}
        style={{ background: `conic-gradient(${stops})` }}
        role="img"
        aria-label={`Saídas do mês: ${formatCurrency(total)}`}
      >
        <span className={S.hole}>
          <b>{formatCurrency(total)}</b>
          saídas
        </span>
      </div>

      <ul className={S.legend}>
        {slices.map((slice) => (
          <li key={slice.id}>
            <span>
              <i className={S.dot} style={{ background: slice.color }} aria-hidden />
              {slice.icon} {slice.label}
            </span>
            <b>{Math.round((slice.amount_cents * 100) / total)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
