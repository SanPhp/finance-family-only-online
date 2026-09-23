export type Budget = {
  id: string;
  id_category: string;
  /** limite mensal, em centavos */
  amount_cents: number;
  /** quanto já foi gasto na categoria no mês consultado */
  spent_cents: number;
  /** limite - gasto; negativo = estourou */
  remaining_cents: number;
  /** gasto / limite, em %; passa de 100 quando estoura */
  percent: number;
};

export type BudgetsResponse = {
  month: string;
  items: Budget[];
  totals: { planned_cents: number; spent_cents: number };
};
