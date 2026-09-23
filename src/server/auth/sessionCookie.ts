import { cookies } from 'next/headers';
import { AppError } from '@/lib/apiError';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
  type SessionPayload,
} from '@/lib/session';

export async function setSessionCookie(payload: SessionPayload) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Para ações só de administrador (convites, categorias, orçamentos). */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== 'ADMIN') throw new AppError('FORBIDDEN', 'Apenas administradores podem fazer isso.');
  return session;
}

/** Usar no início de toda rota da API que exige login. O id_family vem daqui, nunca do cliente. */
export async function requireSession(): Promise<SessionPayload> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) throw new AppError('UNAUTHENTICATED', 'Sua sessão expirou. Entre novamente.');
  return session;
}
