'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '../navItems';
import S from './style.module.scss';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={S.sidebar}>
      <div className={S.logo}>
        <i className={S.logoIcon}>₢</i>Família$
      </div>
      <nav className={S.nav} aria-label="Principal">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname.startsWith(item.href) ? `${S.link} ${S.active}` : S.link}
            aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
