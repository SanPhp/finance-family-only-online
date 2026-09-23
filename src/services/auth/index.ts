import { api } from '@/lib/axios';
import type { LoginProps } from '@/lib/validationZodSchema/LoginZodSchema';
import type { RegisterProps } from '@/lib/validationZodSchema/RegisterZodSchema';

export async function registerUser(data: RegisterProps) {
  const response = await api.post<{ id_family: string; id_user: string }>('/auth/register', data);
  return response.data;
}

export async function login(data: LoginProps) {
  await api.post('/auth/login', data);
}

export async function logout() {
  await api.post('/auth/logout');
}
