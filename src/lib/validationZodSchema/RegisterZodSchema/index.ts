import { z } from 'zod';

// bcrypt só considera os primeiros 72 bytes da senha.
export const RegisterZodSchema = z.object({
  familyName: z.string().trim().min(2, 'Mínimo 2 caracteres.'),
  name: z.string().trim().min(2, 'Mínimo 2 caracteres.'),
  email: z.string().trim().pipe(z.email('E-mail inválido.')),
  password: z.string().min(8, 'Mínimo 8 caracteres.').max(72, 'Máximo 72 caracteres.'),
});

export const RegisterFormZodSchema = RegisterZodSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'As senhas não conferem.',
});

export type RegisterProps = z.infer<typeof RegisterZodSchema>;
export type RegisterFormProps = z.infer<typeof RegisterFormZodSchema>;
