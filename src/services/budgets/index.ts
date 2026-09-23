import { api } from '@/lib/axios';
import type { CreateBudgetProps, UpdateBudgetProps } from '@/lib/validationZodSchema/BudgetZodSchema';
import type { BudgetsResponse } from '@/types/budget';

export async function getBudgets(month: string) {
  return (await api.get<BudgetsResponse>('/budgets', { params: { month } })).data;
}

export async function createBudget(data: CreateBudgetProps) {
  return (await api.post('/budgets', data)).data;
}

export async function updateBudget(id: string, data: UpdateBudgetProps) {
  return (await api.patch(`/budgets/${id}`, data)).data;
}

export async function deleteBudget(id: string) {
  await api.delete(`/budgets/${id}`);
}
