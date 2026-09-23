import { api } from '@/lib/axios';
import type { CreateAccountProps, UpdateAccountProps } from '@/lib/validationZodSchema/AccountZodSchema';
import type { Account, AccountWithBalance } from '@/types/account';

export async function getAccounts() {
  return (await api.get<AccountWithBalance[]>('/accounts')).data;
}

export async function createAccount(data: CreateAccountProps) {
  return (await api.post<Account>('/accounts', data)).data;
}

export async function updateAccount(id: string, data: UpdateAccountProps) {
  return (await api.patch<Account>(`/accounts/${id}`, data)).data;
}
