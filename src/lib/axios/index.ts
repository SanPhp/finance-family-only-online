import axios, { isAxiosError } from 'axios';
import type { ApiErrorBody, ApiErrorCode } from '@/lib/apiError';

/** Erro entregue à interface: sempre com mensagem legível, nunca o erro técnico do Axios. */
export class ApiError extends Error {
  readonly code: ApiErrorCode | 'NETWORK';
  readonly status?: number;
  readonly fields?: Record<string, string>;

  constructor(message: string, code: ApiErrorCode | 'NETWORK', status?: number, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 15_000 });

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError<ApiErrorBody>(error)) {
      const body = error.response?.data?.error;
      if (body) return Promise.reject(new ApiError(body.message, body.code, error.response?.status, body.fields));
      // sem resposta: sem internet, servidor fora ou tempo esgotado (15 s)
      if (!error.response) {
        return Promise.reject(new ApiError('Sem conexão com o servidor. Verifique a internet.', 'NETWORK'));
      }
    }
    return Promise.reject(new ApiError('Não foi possível concluir a operação. Tente novamente.', 'INTERNAL'));
  },
);
