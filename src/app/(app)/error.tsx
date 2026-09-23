'use client';

import { useEffect } from 'react';
import { ErrorMessage } from '@/components/ErrorMessage';

// Erro inesperado ao desenhar uma tela: a pessoa vê uma mensagem simples e pode tentar de novo.
// O detalhe técnico fica só no console, nunca na tela.
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorMessage message="Algo deu errado ao abrir esta tela. Tente de novo." onRetry={retry} />;
}
