import type { BudgetsResponse } from '@/types/budget';
import type { Transaction } from '@/types/transaction';

export type MonthTotals = { income_cents: number; expense_cents: number };

export type DashboardResponse = {
  month: string;
  /** saldo de todas as contas, de todo o período: não depende do mês consultado */
  total_balance_cents: number;
  totals: MonthTotals;
  /** mês anterior, para mostrar a comparação */
  previous_totals: MonthTotals;
  /** saídas do mês por categoria, da maior para a menor */
  expense_by_category: { id_category: string; amount_cents: number }[];
  budgets: BudgetsResponse;
  /** os últimos lançamentos da família, de qualquer mês */
  recent: Transaction[];
};
