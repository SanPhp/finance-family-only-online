import { LogoutButton } from '@/components/LogoutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import S from './style.module.scss';

type Props = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: Props) {
  return (
    <header className={S.header}>
      <div>
        <h1 className={S.title}>{title}</h1>
        {subtitle && <p className={S.subtitle}>{subtitle}</p>}
      </div>
      <div className={S.actions}>
        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}
