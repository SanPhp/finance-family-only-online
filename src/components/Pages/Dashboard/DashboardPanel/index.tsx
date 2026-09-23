'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InsightCard } from '@/components/InsightCard';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { ExpenseDonut } from '@/components/Pages/Dashboard/ExpenseDonut';
import { TransactionFormSheet } from '@/components/Pages/Transactions/TransactionFormSheet';
import { TransactionList } from '@/components/Pages/Transactions/TransactionList';
import { ProgressBar } from '@/components/ProgressBar';
import { currentMonth, formatMonthLabel, shiftMonth } from '@/lib/date';
import { formatCurrency } from '@/lib/money';
import { getAccounts } from '@/services/accounts';
import { getCategories } from '@/services/categories';
import { getCommitments } from '@/services/commitments';
import { getDashboard } from '@/services/dashboard';
import { getMembers } from '@/services/family';
import { getInsights } from '@/services/insights';
import { LoadingMessage } from '@/components/LoadingMessage';
import { ErrorMessage } from '@/components/ErrorMessage';
import S from './style.module.scss';

const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;
const WARNING_PERCENT = 85;
const HERO_CARD_STYLE: React.CSSProperties = { background: 'linear-gradient(135deg, #5b21b6, #7e22ce 60%, #86198f)', color: '#fff', border: 0 };
const HERO_NOTE_STYLE: React.CSSProperties = { color: '#f3e8ff' };
const TOP_BUDGETS = 4;
const TOP_COMMITMENTS = 3;

/** Variação em % contra o mês anterior. Sem base de comparação (mês anterior zerado), não há variação. */
function variation(current: number, previous: number) {
  if (previous <= 0) return null;
  return Math.round(((current - previous) * 100) / previous);
}

export function DashboardPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [newOpen, setNewOpen] = useState(false);

  const monthParam = params.get('month');
  const month = monthParam && MONTH_FORMAT.test(monthParam) ? monthParam : currentMonth();

  const dashboard = useQuery({ queryKey: ['dashboard', month], queryFn: () => getDashboard(month), placeholderData: keepPreviousData });
  const categories = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  // informativo: não trava a visão geral se falhar
  const commitments = useQuery({ queryKey: ['commitments'], queryFn: getCommitments });
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const members = useQuery({ queryKey: ['members'], queryFn: getMembers });
  // não bloqueia a tela: o insight do dia aparece quando chegar
  const insights = useQuery({ queryKey: ['insights', month], queryFn: () => getInsights(month), placeholderData: keepPreviousData });

  // erros primeiro: assim o TypeScript sabe que, depois disso, os dados existem
  if (dashboard.isError) return <ErrorMessage message={dashboard.error.message} onRetry={() => void dashboard.refetch()} />;
  if (categories.isError) return <ErrorMessage message={categories.error.message} onRetry={() => void categories.refetch()} />;
  if (accounts.isError) return <ErrorMessage message={accounts.error.message} onRetry={() => void accounts.refetch()} />;
  if (members.isError) return <ErrorMessage message={members.error.message} onRetry={() => void members.refetch()} />;
  if (dashboard.isPending || categories.isPending || accounts.isPending || members.isPending) {
    return <LoadingMessage />;
  }

  const { total_balance_cents, totals, previous_totals, budgets, expense_by_category, recent } = dashboard.data;
  const categoryById = new Map(categories.data.map((category) => [category.id, category]));

  const balance = totals.income_cents - totals.expense_cents;
  const previousLabel = formatMonthLabel(shiftMonth(month, -1)).split(' ')[0].toLowerCase();
  const incomeChange = variation(totals.income_cents, previous_totals.income_cents);
  const expenseChange = variation(totals.expense_cents, previous_totals.expense_cents);

  const hasBudgets = budgets.items.length > 0;
  const usedPercent = budgets.totals.planned_cents > 0 ? Math.round((budgets.totals.spent_cents * 100) / budgets.totals.planned_cents) : 0;
  const alerts = budgets.items.filter((item) => item.percent >= WARNING_PERCENT).length;
  // saídas do mês em categorias que não têm orçamento: ficam fora da porcentagem, então mostramos à parte
  const unbudgetedCents = Math.max(0, totals.expense_cents - budgets.totals.spent_cents);
  const topBudgets = [...budgets.items].sort((a, b) => b.percent - a.percent).slice(0, TOP_BUDGETS);

  const activeCommitments = (commitments.data ?? []).filter((commitment) => commitment.status === 'ACTIVE').slice(0, TOP_COMMITMENTS);

  const donutItems = expense_by_category.map((row) => ({
    id: row.id_category,
    label: categoryById.get(row.id_category)?.name ?? 'Categoria',
    icon: categoryById.get(row.id_category)?.icon ?? '❔',
    amount_cents: row.amount_cents,
  }));

  function changeMonth(next: string) {
    const query = new URLSearchParams(params.toString());
    query.set('month', next);
    router.replace(`${pathname}?${query.toString()}`);
  }

  return (
    <>
      <div className={S.bar}>
        <MonthSwitcher month={month} onChange={changeMonth} />
        {/* no celular o botão redondo ＋ (canto da tela) faz esse papel */}
        <div className={S.newButton}>
          <Button onClick={() => setNewOpen(true)}>＋ Novo lançamento</Button>
        </div>
      </div>

      <div className={S.kpis}>
        {/*
          Estilo em linha (não CSS) de propósito: um valor no atributo `style` sempre vence
          o que estiver em qualquer arquivo .css, não importa a ordem em que os arquivos
          carregam. Evita depender da ordem de carregamento do CSS (o que já causou bug).
        */}
        <Card className={`${S.kpi} ${S.hero}`} style={HERO_CARD_STYLE}>
          <span className={S.kpiLabel} style={HERO_NOTE_STYLE}>💰 Saldo total</span>
          <b className={S.kpiValue}>{formatCurrency(total_balance_cents)}</b>
          <small className={S.kpiNote} style={HERO_NOTE_STYLE}>Todas as contas, todo o período</small>
          <small className={`${S.kpiNote} ${S.noWrap}`} style={HERO_NOTE_STYLE}>
            Neste mês: {balance >= 0 ? '+' : '−'} {formatCurrency(Math.abs(balance))}
          </small>
        </Card>

        <Card className={S.kpi}>
          <span className={S.kpiLabel}>⬇️ Entradas</span>
          <b className={`${S.kpiValue} ${S.income}`}>{formatCurrency(totals.income_cents)}</b>
          {incomeChange !== null && (
            <small className={incomeChange >= 0 ? S.income : S.expense}>
              {incomeChange >= 0 ? '▲' : '▼'} {Math.abs(incomeChange)}% vs {previousLabel}
            </small>
          )}
        </Card>

        <Card className={S.kpi}>
          <span className={S.kpiLabel}>⬆️ Saídas</span>
          <b className={`${S.kpiValue} ${S.expense}`}>{formatCurrency(totals.expense_cents)}</b>
          {expenseChange !== null && (
            // gastar mais que no mês anterior é o lado ruim
            <small className={expenseChange > 0 ? S.expense : S.income}>
              {expenseChange >= 0 ? '▲' : '▼'} {Math.abs(expenseChange)}% vs {previousLabel}
            </small>
          )}
        </Card>

        <Card className={`${S.kpi} ${S.budgetKpi}`}>
          <span className={S.kpiLabel}>🎯 Orçamento usado</span>
          {hasBudgets ? (
            <>
              <div className={S.valueRow}>
                <b className={`${S.kpiValue} ${alerts > 0 ? S.warning : S.income}`}>{usedPercent}%</b>
                <span className={S.kpiAmount}>
                  {formatCurrency(budgets.totals.spent_cents)} de {formatCurrency(budgets.totals.planned_cents)}
                </span>
              </div>
              <small className={alerts > 0 ? S.warning : S.income}>
                {alerts > 0 ? `${alerts} ${alerts === 1 ? 'categoria em alerta' : 'categorias em alerta'}` : 'Tudo no plano'}
              </small>
              {unbudgetedCents > 0 && (
                <small className={S.kpiNote}>+ {formatCurrency(unbudgetedCents)} gastos em categorias sem orçamento</small>
              )}
            </>
          ) : (
            <>
              <b className={S.kpiValue}>—</b>
              <small className={S.kpiNote}><Link className={S.link} href="/budgets">Definir orçamentos</Link></small>
            </>
          )}
        </Card>
      </div>

      <div className={S.row}>
        <Card>
          <h2 className={S.cardTitle}>
            Orçamentos do mês
            <Link className={S.link} href={`/budgets?month=${month}`}>ver todos →</Link>
          </h2>
          {topBudgets.length === 0 && <p className={S.info}>Nenhum orçamento definido ainda.</p>}
          {topBudgets.map((budget) => {
            const category = categoryById.get(budget.id_category);
            const over = budget.remaining_cents < 0;
            return (
              <div key={budget.id} className={S.budget}>
                <div className={S.budgetHead}>
                  <span>{category?.icon} {category?.name}</span>
                  <span className={over ? S.expense : budget.percent >= WARNING_PERCENT ? S.warning : ''}>
                    {formatCurrency(budget.spent_cents)} / {formatCurrency(budget.amount_cents)}
                  </span>
                </div>
                <ProgressBar percent={budget.percent} label={`${category?.name}: ${budget.percent}% do orçamento`} />
                <small className={over ? S.expense : S.kpiNote}>
                  {over ? `Estourou ${formatCurrency(-budget.remaining_cents)}` : `Resta ${formatCurrency(budget.remaining_cents)}`}
                </small>
              </div>
            );
          })}
        </Card>

        <Card>
          <h2 className={S.cardTitle}>Para onde vai o dinheiro</h2>
          <ExpenseDonut items={donutItems} />
        </Card>
      </div>

      {activeCommitments.length > 0 && (
        <Card className={S.commitments}>
          <h2 className={S.cardTitle}>
            📱 Compromissos
            <Link className={S.link} href="/commitments">ver todos →</Link>
          </h2>
          <div className={S.commitmentsGrid}>
            {activeCommitments.map((commitment) => {
              const percent = Math.round((commitment.paid_installments * 100) / commitment.total_installments);
              const remaining = commitment.total_installments - commitment.paid_installments;
              return (
                <div key={commitment.id} className={S.commitment}>
                  <div className={S.budgetHead}>
                    <span>{commitment.name}</span>
                    <span>{commitment.paid_installments}/{commitment.total_installments}</span>
                  </div>
                  <ProgressBar percent={percent} label={`${commitment.name}: ${percent}% pago`} />
                  <small className={S.kpiNote}>
                    Parcela {formatCurrency(commitment.amount_cents)} · falta {formatCurrency(remaining * commitment.amount_cents)}
                  </small>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className={S.row}>
        <Card>
          <h2 className={S.cardTitle}>
            Últimos lançamentos
            <Link className={S.link} href="/transactions">ver extrato →</Link>
          </h2>
          {recent.length === 0 ? (
            <p className={S.info}>Nenhum lançamento ainda. Toque em ＋ para registrar o primeiro.</p>
          ) : (
            <TransactionList
              items={recent}
              categories={categories.data}
              accounts={accounts.data}
              members={members.data.members}
              canEdit={() => false}
              onSelect={() => {}}
            />
          )}
        </Card>

        <Card>
          <h2 className={S.cardTitle}>
            💡 Insight do dia
            <Link className={S.link} href={`/insights?month=${month}`}>ver todos →</Link>
          </h2>
          {insights.isPending && <p className={S.info}>Analisando...</p>}
          {insights.isError && <p className={S.info}>Não foi possível carregar os insights agora.</p>}
          {insights.data &&
            (insights.data.insights.length > 0 ? (
              <InsightCard insight={insights.data.insights[0]} month={month} />
            ) : (
              <p className={S.info}>✅ Tudo tranquilo: nenhum alerta neste mês.</p>
            ))}
        </Card>
      </div>

      <TransactionFormSheet
        open={newOpen}
        onOpenChange={setNewOpen}
        categories={categories.data}
        accounts={accounts.data}
        members={members.data.members}
        currentUserId={members.data.me.id_user}
      />
    </>
  );
}
