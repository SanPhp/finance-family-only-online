import { createHash, randomBytes } from 'node:crypto';

export const INVITE_TTL_DAYS = 7;

export function generateInviteToken() {
  return randomBytes(32).toString('base64url');
}

/** Só o hash do token vai para o banco; o token em si aparece uma única vez, para o administrador. */
export function hashInviteToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
