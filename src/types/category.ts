export type CategoryType = 'INCOME' | 'EXPENSE';

export type Category = {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
  isActive: boolean;
};
