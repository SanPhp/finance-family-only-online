import { api } from '@/lib/axios';
import type { CreateCategoryProps, UpdateCategoryProps } from '@/lib/validationZodSchema/CategoryZodSchema';
import type { Category } from '@/types/category';

export async function getCategories() {
  return (await api.get<Category[]>('/categories')).data;
}

export async function createCategory(data: CreateCategoryProps) {
  return (await api.post<Category>('/categories', data)).data;
}

export async function updateCategory(id: string, data: UpdateCategoryProps) {
  return (await api.patch<Category>(`/categories/${id}`, data)).data;
}
