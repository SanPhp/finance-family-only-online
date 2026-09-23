import S from './layout.module.scss';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className={S.center}>{children}</main>;
}
