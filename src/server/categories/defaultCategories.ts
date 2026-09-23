// Categorias que toda família recebe ao ser criada. Depois cada uma pode ser editada ou desativada.
export const DEFAULT_CATEGORIES = [
  { type: 'EXPENSE', icon: '🏠', name: 'Moradia' },
  { type: 'EXPENSE', icon: '🛒', name: 'Mercado' },
  { type: 'EXPENSE', icon: '🍔', name: 'Restaurantes' },
  { type: 'EXPENSE', icon: '🚗', name: 'Transporte' },
  { type: 'EXPENSE', icon: '💊', name: 'Saúde' },
  { type: 'EXPENSE', icon: '📚', name: 'Educação' },
  { type: 'EXPENSE', icon: '🎬', name: 'Lazer' },
  { type: 'EXPENSE', icon: '💡', name: 'Contas e serviços' },
  { type: 'EXPENSE', icon: '🛍️', name: 'Compras' },
  { type: 'EXPENSE', icon: '📦', name: 'Outros' },
  { type: 'INCOME', icon: '💼', name: 'Salário' },
  { type: 'INCOME', icon: '💰', name: 'Renda extra' },
  { type: 'INCOME', icon: '📥', name: 'Outras entradas' },
] as const;
