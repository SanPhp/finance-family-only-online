import { api } from '@/lib/axios';
import type { DashboardResponse } from '@/types/dashboard';

export async function getDashboard(month: string) {
  return (await api.get<DashboardResponse>('/dashboard', { params: { month } })).data;
}
