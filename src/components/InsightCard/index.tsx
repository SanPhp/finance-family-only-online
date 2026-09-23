import Link from 'next/link';
import type { Insight, InsightType } from '@/types/insight';
import S from './style.module.scss';

const icons: Record<InsightType, string> = {
  BUDGET_OVER: '🚨',
  BUDGET_PROJECTED: '⚠️',
  CATEGORY_GROWTH: '📈',
  CATEGORY_SAVING: '🎉',
};

type Props = {
  insight: Insight;
  /** AAAA-MM: o link abre os lançamentos da categoria neste mês */
  month: string;
};

export function InsightCard({ insight, month }: Props) {
  return (
    <article className={`${S.card} ${S[insight.level]}`}>
      <span className={S.icon} aria-hidden>{icons[insight.type]}</span>
      <div>
        <b className={S.title}>{insight.title}</b>
        <p className={S.message}>{insight.message}</p>
        <Link className={S.link} href={`/transactions?month=${month}&category=${insight.id_category}`}>
          Ver lançamentos →
        </Link>
      </div>
    </article>
  );
}
