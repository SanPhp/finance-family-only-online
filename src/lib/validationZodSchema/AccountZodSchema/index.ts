import { z } from 'zod';
import { parseSignedMoneyToCents } from '@/lib/money';

const name = z.string().trim().min(2, 'Mínimo 2 caracteres.').max(40, 'Máximo 40 caracteres.');
const day = z.number().int().min(1, 'Dia inválido.').max(31, 'Dia inválido.');
// limite do Int do banco (~R$ 21 milhões)
const cents = z.number('Informe o valor.').int().min(-2_000_000_000).max(2_000_000_000);
const accountType = z.enum(['CHECKING', 'CASH', 'CREDIT_CARD', 'SAVINGS']);

// API ---------------------------------------------------------------------

export const CreateAccountZodSchema = z
  .object({
    name,
    type: accountType,
    opening_balance_cents: cents.default(0),
    closing_day: day.optional(),
    due_day: day.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'CREDIT_CARD') {
      if (data.closing_day === undefined) ctx.addIssue({ code: 'custom', path: ['closing_day'], message: 'Informe o dia de fechamento.' });
      if (data.due_day === undefined) ctx.addIssue({ code: 'custom', path: ['due_day'], message: 'Informe o dia de vencimento.' });
      if (data.opening_balance_cents !== 0) {
        ctx.addIssue({ code: 'custom', path: ['opening_balance_cents'], message: 'Cartão não tem saldo inicial.' });
      }
    } else if (data.closing_day !== undefined || data.due_day !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['closing_day'], message: 'Fechamento e vencimento são só do cartão.' });
    }
  });

// O tipo não muda depois de criada. As regras de cartão são conferidas no servidor, com o tipo da conta.
export const UpdateAccountZodSchema = z
  .object({ name, opening_balance_cents: cents, closing_day: day, due_day: day, isActive: z.boolean() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nada para atualizar.' });

export type CreateAccountProps = z.infer<typeof CreateAccountZodSchema>;
export type UpdateAccountProps = z.infer<typeof UpdateAccountZodSchema>;

// Formulário (tudo texto, como vem dos campos) ------------------------------

export const AccountFormZodSchema = z
  .object({ name, type: accountType, balance: z.string(), closing_day: z.string(), due_day: z.string() })
  .superRefine((data, ctx) => {
    if (data.type === 'CREDIT_CARD') {
      if (!data.closing_day) ctx.addIssue({ code: 'custom', path: ['closing_day'], message: 'Informe o dia de fechamento.' });
      if (!data.due_day) ctx.addIssue({ code: 'custom', path: ['due_day'], message: 'Informe o dia de vencimento.' });
    } else if (parseSignedMoneyToCents(data.balance) === null) {
      ctx.addIssue({ code: 'custom', path: ['balance'], message: 'Valor inválido. Ex.: 1500,00' });
    }
  });

export type AccountFormProps = z.infer<typeof AccountFormZodSchema>;
