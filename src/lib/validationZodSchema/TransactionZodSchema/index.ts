import { z } from 'zod';
import { parseMoneyToCents } from '@/lib/money';

// ULID: 26 caracteres (Crockford base32). O aparelho gera o id: tocar duas vezes em "Salvar" não duplica o lançamento.
const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, 'Identificador inválido.');
const reference = z.string().min(1, 'Campo obrigatório.');
const type = z.enum(['INCOME', 'EXPENSE']);
// sempre positivo; o sinal vem do tipo. Limite do Int do banco (~R$ 21 milhões).
const amount = z.number('Informe o valor.').int('Valor inválido.').min(1, 'Informe um valor maior que zero.').max(2_000_000_000, 'Valor alto demais.');
const description = z.string().trim().min(1, 'Informe uma descrição.').max(120, 'Máximo 120 caracteres.');
const occurredOn = z.iso.date('Data inválida.');

export const CreateTransactionZodSchema = z.object({
  id: ulid.optional(),
  type,
  id_account: reference,
  id_category: reference,
  id_user: reference.nullable().optional(),
  id_commitment: reference.nullable().optional(),
  amount_cents: amount,
  description,
  occurred_on: occurredOn,
});

export const UpdateTransactionZodSchema = z
  .object({
    type,
    id_account: reference,
    id_category: reference,
    id_user: reference.nullable(),
    id_commitment: reference.nullable(),
    amount_cents: amount,
    description,
    occurred_on: occurredOn,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nada para atualizar.' });

export const TransactionQueryZodSchema = z.object({
  from: occurredOn.optional(),
  to: occurredOn.optional(),
  type: type.optional(),
  id_category: reference.optional(),
  id_account: reference.optional(),
  /** id de um membro, ou "shared" para os lançamentos da Família */
  id_user: reference.optional(),
  page: z.coerce.number().int('Página inválida.').min(1, 'Página inválida.').default(1),
  limit: z.coerce.number().int('Limite inválido.').min(1, 'Limite inválido.').max(200, 'Máximo 200 por página.').default(30),
});

export type CreateTransactionProps = z.infer<typeof CreateTransactionZodSchema>;
export type UpdateTransactionProps = z.infer<typeof UpdateTransactionZodSchema>;
export type TransactionQueryProps = z.infer<typeof TransactionQueryZodSchema>;

// Formulário (tudo texto, como vem dos campos) ------------------------------

export const TransactionFormZodSchema = z
  .object({
    type,
    id_account: z.string().min(1, 'Escolha a conta.'),
    id_category: z.string().min(1, 'Escolha a categoria.'),
    /** id de um membro, ou "shared" para a Família */
    id_user: z.string().min(1, 'Escolha quem gastou.'),
    /** id do compromisso vinculado, ou "" para nenhum */
    id_commitment: z.string(),
    amount: z.string(),
    description,
    occurred_on: z.iso.date('Informe a data.'),
  })
  .superRefine((data, ctx) => {
    const cents = parseMoneyToCents(data.amount);
    if (cents === null || cents < 1) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Informe um valor válido. Ex.: 87,50' });
    }
  });

export type TransactionFormProps = z.infer<typeof TransactionFormZodSchema>;
