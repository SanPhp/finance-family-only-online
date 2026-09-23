import type { CategoryType } from '@/types/category';

export type Transaction = {
  id: string;
  id_account: string;
  id_category: string;
  /** quem gastou; null = compartilhado (Família) */
  id_user: string | null;
  id_created_by: string;
  /** presente quando este lançamento é o pagamento de uma parcela de um compromisso */
  id_commitment: string | null;
  type: CategoryType;
  amount_cents: number;
  description: string;
  /** só o dia, formato AAAA-MM-DD */
  occurred_on: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TransactionsResponse = {
  items: Transaction[];
  /** somas do filtro inteiro (todas as páginas), sem os excluídos */
  totals: { income_cents: number; expense_cents: number };
  total: number;
  page: number;
  limit: number;
};
