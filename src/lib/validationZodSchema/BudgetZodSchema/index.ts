import { z } from 'zod';
import { parseMoneyToCents } from '@/lib/money';

// limite do Int do banco (~R$ 21 milhões)
const amount = z.number('Informe o valor.').int('Valor inválido.').min(1, 'Informe um valor maior que zero.').max(2_000_000_000, 'Valor alto demais.');

export const CreateBudgetZodSchema = z.object({
  id_category: z.string().min(1, 'Escolha a categoria.'),
  amount_cents: amount,
});

// A categoria de um orçamento não muda; para outra categoria, cria-se outro orçamento.
export const UpdateBudgetZodSchema = z.object({ amount_cents: amount });

export const BudgetQueryZodSchema = z.object({
  /** AAAA-MM; sem ele vale o mês atual */
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mês inválido.').optional(),
});

export type CreateBudgetProps = z.infer<typeof CreateBudgetZodSchema>;
export type UpdateBudgetProps = z.infer<typeof UpdateBudgetZodSchema>;
export type BudgetQueryProps = z.infer<typeof BudgetQueryZodSchema>;

// Formulário (tudo texto, como vem dos campos) ------------------------------

export const BudgetFormZodSchema = z
  .object({ id_category: z.string().min(1, 'Escolha a categoria.'), amount: z.string() })
  .superRefine((data, ctx) => {
    const cents = parseMoneyToCents(data.amount);
    if (cents === null || cents < 1) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Informe um valor válido. Ex.: 1300,00' });
    }
  });

export type BudgetFormProps = z.infer<typeof BudgetFormZodSchema>;
