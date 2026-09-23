export type AccountType = 'CHECKING' | 'CASH' | 'CREDIT_CARD' | 'SAVINGS';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  opening_balance_cents: number;
  closing_day: number | null;
  due_day: number | null;
  isActive: boolean;
};

/** Conta com o saldo atual (saldo inicial + entradas - saídas, de todo o período). */
export type AccountWithBalance = Account & { balance_cents: number };
