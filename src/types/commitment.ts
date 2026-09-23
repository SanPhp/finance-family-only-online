export type CommitmentStatus = 'ACTIVE' | 'DONE';

export type Commitment = {
  id: string;
  id_category: string;
  name: string;
  amount_cents: number;
  total_installments: number;
  paid_installments: number;
  status: CommitmentStatus;
  due_day: number | null;
};
