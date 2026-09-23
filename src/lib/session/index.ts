import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias: a família não precisa entrar de novo toda hora

export type SessionPayload = {
  id_user: string;
  id_family: string;
  role: 'ADMIN' | 'MEMBER';
};

function getKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET ausente ou curto demais (mínimo 32 caracteres).');
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ id_family: payload.id_family, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.id_user)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getKey());
}

/** Retorna o contexto da sessão, ou null se o token for inválido ou estiver expirado. */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ['HS256'] });
    if (!payload.sub || typeof payload.id_family !== 'string') return null;
    if (payload.role !== 'ADMIN' && payload.role !== 'MEMBER') return null;
    return { id_user: payload.sub, id_family: payload.id_family, role: payload.role };
  } catch {
    return null;
  }
}
