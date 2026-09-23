import { api } from '@/lib/axios';
import type { CreateTransactionProps, UpdateTransactionProps } from '@/lib/validationZodSchema/TransactionZodSchema';
import type { Transaction, TransactionsResponse } from '@/types/transaction';

export type TransactionFilters = {
  from: string;
  to: string;
  type?: 'INCOME' | 'EXPENSE';
  id_category?: string;
  id_account?: string;
  /** id de um membro, ou "shared" para os lançamentos da Família */
  id_user?: string;
  page: number;
  limit: number;
};

export async function getTransactions(filters: TransactionFilters) {
  return (await api.get<TransactionsResponse>('/transactions', { params: filters })).data;
}

export async function createTransaction(data: CreateTransactionProps) {
  return (await api.post<Transaction>('/transactions', data)).data;
}

export async function updateTransaction(id: string, data: UpdateTransactionProps) {
  return (await api.patch<Transaction>(`/transactions/${id}`, data)).data;
}

export async function deleteTransaction(id: string) {
  return (await api.delete<Transaction>(`/transactions/${id}`)).data;
}
