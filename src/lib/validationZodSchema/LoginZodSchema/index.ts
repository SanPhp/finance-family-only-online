import { z } from 'zod';

export const LoginZodSchema = z.object({
  email: z.string().trim().pipe(z.email('E-mail inválido.')),
  password: z.string().min(1, 'Informe a senha.'),
});

export type LoginProps = z.infer<typeof LoginZodSchema>;
