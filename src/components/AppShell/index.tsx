import { NewTransactionButton } from './NewTransactionButton';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import S from './style.module.scss';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={S.app}>
      <a className={S.skip} href="#conteudo">Pular para o conteúdo</a>
      <Sidebar />
      <main id="conteudo" tabIndex={-1} className={S.main}>{children}</main>
      <NewTransactionButton />
      <TabBar />
    </div>
  );
}
