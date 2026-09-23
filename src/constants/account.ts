import type { AccountType } from '@/types/account';

export const accountTypes: { type: AccountType; label: string; icon: string }[] = [
  { type: 'CHECKING', label: 'Conta / cartão de débito', icon: '🏦' },
  { type: 'CASH', label: 'Dinheiro', icon: '💵' },
  { type: 'CREDIT_CARD', label: 'Cartão de crédito', icon: '💳' },
  { type: 'SAVINGS', label: 'Poupança', icon: '🐖' },
];

export const accountTypeInfo = Object.fromEntries(accountTypes.map((item) => [item.type, item])) as Record<
  AccountType,
  (typeof accountTypes)[number]
>;
