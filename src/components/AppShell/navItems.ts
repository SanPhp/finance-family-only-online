// tabBar: false = aparece só no menu lateral (no celular, o acesso é por um link dentro da página Família).
export const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Visão geral', shortLabel: 'Início', tabBar: true },
  { href: '/transactions', icon: '🧾', label: 'Lançamentos', shortLabel: 'Extrato', tabBar: true },
  { href: '/budgets', icon: '🎯', label: 'Orçamentos', shortLabel: 'Metas', tabBar: true },
  { href: '/insights', icon: '💡', label: 'Insights', shortLabel: 'Insights', tabBar: true },
  { href: '/commitments', icon: '📱', label: 'Compromissos', shortLabel: 'Compromissos', tabBar: false },
  { href: '/members', icon: '👨‍👩‍👧', label: 'Família', shortLabel: 'Família', tabBar: true },
  { href: '/accounts', icon: '🏦', label: 'Contas e cartões', shortLabel: 'Contas', tabBar: false },
  { href: '/categories', icon: '🏷️', label: 'Categorias', shortLabel: 'Categorias', tabBar: false },
];
