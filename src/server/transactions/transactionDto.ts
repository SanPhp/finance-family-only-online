import type { Transaction } from '@/types/transaction';

export const transactionSelect = {
  id: true,
  id_family: true,
  id_account: true,
  id_category: true,
  id_user: true,
  id_created_by: true,
  id_commitment: true,
  type: true,
  amount_cents: true,
  description: true,
  occurred_on: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
} as const;

type Row = {
  id: string;
  id_account: string;
  id_category: string;
  id_user: string | null;
  id_created_by: string;
  id_commitment: string | null;
  type: 'INCOME' | 'EXPENSE';
  amount_cents: number;
  description: string;
  occurred_on: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

/** Formato entregue pela API: sem id_family, e datas como texto. */
export function toTransactionDto(row: Row): Transaction {
  return {
    id: row.id,
    id_account: row.id_account,
    id_category: row.id_category,
    id_user: row.id_user,
    id_created_by: row.id_created_by,
    id_commitment: row.id_commitment,
    type: row.type,
    amount_cents: row.amount_cents,
    description: row.description,
    occurred_on: row.occurred_on.toISOString().slice(0, 10),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    deleted_at: row.deleted_at?.toISOString() ?? null,
  };
}

/** AAAA-MM-DD -> meia-noite UTC, que é como o dia é guardado. */
export function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
