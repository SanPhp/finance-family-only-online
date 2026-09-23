import { z } from 'zod';

const amount = z.number('Informe o valor.').int('Valor inválido.').min(1, 'Informe um valor maior que zero.').max(2_000_000_000, 'Valor alto demais.');
const installments = z.number('Informe a quantidade.').int('Quantidade inválida.').min(1, 'Mínimo 1 parcela.').max(999, 'Máximo 999 parcelas.');
const day = z.number().int().min(1, 'Dia inválido.').max(31, 'Dia inválido.');

export const CreateCommitmentZodSchema = z.object({
  id_category: z.string().min(1, 'Escolha a categoria.'),
  name: z.string().trim().min(2, 'Mínimo 2 caracteres.').max(60, 'Máximo 60 caracteres.'),
  amount_cents: amount,
  total_installments: installments,
  // parcelas já pagas antes de cadastrar no sistema (contador manual, sem gerar lançamento)
  paid_installments: z.number().int().min(0).default(0),
  due_day: day.optional(),
});

// A categoria e o total de parcelas não mudam depois de criado, para não embaralhar o progresso já contado.
export const UpdateCommitmentZodSchema = z
  .object({
    name: z.string().trim().min(2, 'Mínimo 2 caracteres.').max(60, 'Máximo 60 caracteres.'),
    amount_cents: amount,
    paid_installments: z.number().int().min(0),
    due_day: day.nullable(),
    status: z.enum(['ACTIVE', 'DONE']),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nada para atualizar.' });

export type CreateCommitmentProps = z.infer<typeof CreateCommitmentZodSchema>;
export type UpdateCommitmentProps = z.infer<typeof UpdateCommitmentZodSchema>;

// Formulário (tudo texto, como vem dos campos) ------------------------------

export const CommitmentFormZodSchema = z.object({
  id_category: z.string().min(1, 'Escolha a categoria.'),
  name: z.string().trim().min(2, 'Mínimo 2 caracteres.').max(60, 'Máximo 60 caracteres.'),
  amount: z.string(),
  total_installments: z.string(),
  paid_installments: z.string(),
  due_day: z.string(),
});

export type CommitmentFormProps = z.infer<typeof CommitmentFormZodSchema>;
