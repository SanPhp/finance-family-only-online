import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, type ApiErrorBody } from '@/lib/apiError';

/** Converte qualquer erro lançado numa rota em resposta padronizada, sem vazar detalhes técnicos. */
export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    const body: ApiErrorBody = { error: { code: error.code, message: error.message, fields: error.fields } };
    return NextResponse.json(body, { status: error.status });
  }

  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) fields[issue.path.join('.')] ??= issue.message;
    const body: ApiErrorBody = {
      error: { code: 'VALIDATION_ERROR', message: 'Confira os dados informados.', fields },
    };
    return NextResponse.json(body, { status: 400 });
  }

  console.error(error);
  const body: ApiErrorBody = {
    error: { code: 'INTERNAL', message: 'Não foi possível concluir a operação. Tente novamente.' },
  };
  return NextResponse.json(body, { status: 500 });
}
