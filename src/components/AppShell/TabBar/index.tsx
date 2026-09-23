'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '../navItems';
import S from './style.module.scss';

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className={S.tabbar} aria-label="Principal">
      {navItems.filter((item) => item.tabBar).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname.startsWith(item.href) ? `${S.link} ${S.active}` : S.link}
          aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
        >
          <span className={S.icon} aria-hidden>{item.icon}</span>
          {item.shortLabel}
        </Link>
      ))}
    </nav>
  );
}
