'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { InsightCard } from '@/components/InsightCard';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { MemberBars } from '@/components/Pages/Insights/MemberBars';
import { MonthlyBars } from '@/components/Pages/Insights/MonthlyBars';
import { currentMonth } from '@/lib/date';
import { getMembers } from '@/services/family';
import { getInsights } from '@/services/insights';
import { LoadingMessage } from '@/components/LoadingMessage';
import { ErrorMessage } from '@/components/ErrorMessage';
import S from './style.module.scss';

const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

export function InsightsPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const monthParam = params.get('month');
  const month = monthParam && MONTH_FORMAT.test(monthParam) ? monthParam : currentMonth();

  const insights = useQuery({ queryKey: ['insights', month], queryFn: () => getInsights(month), placeholderData: keepPreviousData });
  const members = useQuery({ queryKey: ['members'], queryFn: getMembers });

  // erros primeiro: assim o TypeScript sabe que, depois disso, os dados existem
  if (insights.isError) return <ErrorMessage message={insights.error.message} onRetry={() => void insights.refetch()} />;
  if (members.isError) return <ErrorMessage message={members.error.message} onRetry={() => void members.refetch()} />;
  if (insights.isPending || members.isPending) return <LoadingMessage />;

  function changeMonth(next: string) {
    const query = new URLSearchParams(params.toString());
    query.set('month', next);
    router.replace(`${pathname}?${query.toString()}`);
  }

  const { insights: items, by_member, monthly } = insights.data;

  return (
    <>
      <div className={S.bar}>
        <MonthSwitcher month={month} onChange={changeMonth} />
      </div>

      <div className={S.grid}>
        <section className={S.list} aria-label="Alertas e destaques">
          {items.length === 0 ? (
            <Card>
              <div className={S.calm}>
                <span aria-hidden>✅</span>
                <b>Tudo tranquilo por aqui</b>
                <p>Nenhum alerta neste mês. Quando algo merecer atenção, aparece aqui.</p>
              </div>
            </Card>
          ) : (
            items.map((insight) => <InsightCard key={insight.id} insight={insight} month={month} />)
          )}
        </section>

        <div className={S.side}>
          <Card title="Saídas por mês">
            <MonthlyBars monthly={monthly} current={month} />
          </Card>
          <Card title="Quem gasta mais">
            <MemberBars byMember={by_member} members={members.data.members} />
          </Card>
        </div>
      </div>
    </>
  );
}
