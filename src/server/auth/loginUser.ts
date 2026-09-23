import bcrypt from 'bcrypt';
import { AppError } from '@/lib/apiError';
import { prisma } from '@/lib/prisma';
import type { LoginProps } from '@/lib/validationZodSchema/LoginZodSchema';

const INVALID_CREDENTIALS = 'E-mail ou senha incorretos.';

// Hash de uma senha qualquer: quando o e-mail não existe, ainda gastamos o mesmo tempo do bcrypt.
const DUMMY_HASH = bcrypt.hashSync('senha-inexistente', 12);

export async function loginUser(input: LoginProps) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: { id: true, id_family: true, role: true, isActive: true, password_hash: true },
  });

  const passwordOk = await bcrypt.compare(input.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !user.isActive || !passwordOk) throw new AppError('UNAUTHENTICATED', INVALID_CREDENTIALS);

  return { id_user: user.id, id_family: user.id_family, role: user.role };
}
