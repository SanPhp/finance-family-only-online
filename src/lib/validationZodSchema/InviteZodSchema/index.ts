import { z } from 'zod';

export const CreateInviteZodSchema = z.object({
  email: z.string().trim().pipe(z.email('E-mail inválido.')),
  role: z.enum(['ADMIN', 'MEMBER']),
});

export const AcceptInviteZodSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(2, 'Mínimo 2 caracteres.'),
  password: z.string().min(8, 'Mínimo 8 caracteres.').max(72, 'Máximo 72 caracteres.'),
});

export const AcceptInviteFormZodSchema = AcceptInviteZodSchema.omit({ token: true })
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  });

export type CreateInviteProps = z.infer<typeof CreateInviteZodSchema>;
export type AcceptInviteProps = z.infer<typeof AcceptInviteZodSchema>;
export type AcceptInviteFormProps = z.infer<typeof AcceptInviteFormZodSchema>;
