import { z } from 'zod';

export const CreateCategoryZodSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres.').max(40, 'Máximo 40 caracteres.'),
  icon: z.string().trim().max(16, 'Escolha um emoji.').regex(/\p{Extended_Pictographic}/u, 'Escolha um emoji.'),
  type: z.enum(['INCOME', 'EXPENSE']),
});

// O tipo (entrada/saída) não muda depois de criada: os lançamentos antigos dependem dele.
export const UpdateCategoryZodSchema = CreateCategoryZodSchema.omit({ type: true })
  .extend({ isActive: z.boolean() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nada para atualizar.' });

export type CreateCategoryProps = z.infer<typeof CreateCategoryZodSchema>;
export type UpdateCategoryProps = z.infer<typeof UpdateCategoryZodSchema>;
