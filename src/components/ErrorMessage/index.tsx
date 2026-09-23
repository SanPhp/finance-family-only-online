'use client';

import { Button } from '@/components/Button';
import S from './style.module.scss';

type Props = {
  /** já em linguagem simples (a API e o Axios só entregam mensagens legíveis) */
  message: string;
  onRetry?: () => void;
};

/** Erro de carregamento de uma tela, com saída: "Tentar de novo". */
export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className={S.box} role="alert">
      <b>Não foi possível carregar</b>
      <p>{message}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
