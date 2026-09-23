import Link from 'next/link';
import S from './style.module.scss';

/** Botão flutuante ＋ do celular: abre o Sheet de novo lançamento a partir de qualquer tela. */
export function NewTransactionButton() {
  return (
    <Link href="/transactions?new=1" className={S.fab} aria-label="Novo lançamento">
      ＋
    </Link>
  );
}
