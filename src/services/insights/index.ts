import { api } from '@/lib/axios';
import { todayISO } from '@/lib/date';
import type { InsightsResponse } from '@/types/insight';

/** Manda o "hoje" do aparelho: o cálculo do ritmo do mês não depende do fuso do servidor. */
export async function getInsights(month: string) {
  return (await api.get<InsightsResponse>('/insights', { params: { month, today: todayISO() } })).data;
}
