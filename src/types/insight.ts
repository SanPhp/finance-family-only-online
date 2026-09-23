export type InsightType = 'BUDGET_OVER' | 'BUDGET_PROJECTED' | 'CATEGORY_GROWTH' | 'CATEGORY_SAVING';

export type Insight = {
  /** estável entre consultas: tipo + categoria */
  id: string;
  type: InsightType;
  /** danger = precisa de atenção; warning = vale olhar; success = notícia boa */
  level: 'danger' | 'warning' | 'success';
  id_category: string;
  title: string;
  message: string;
  /** valor que dá o peso do insight (excesso, diferença ou economia), em centavos */
  impact_cents: number;
};

export type InsightsResponse = {
  month: string;
  insights: Insight[];
  /** saídas do mês por quem gastou; id_user null = Família (compartilhado). Da maior para a menor. */
  by_member: { id_user: string | null; amount_cents: number }[];
  /** os 6 meses até o consultado, do mais antigo ao mais novo */
  monthly: { month: string; income_cents: number; expense_cents: number }[];
};
