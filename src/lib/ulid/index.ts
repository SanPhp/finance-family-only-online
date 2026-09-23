// Alfabeto Crockford (sem I, L, O, U), o mesmo que o Prisma usa nos ULIDs do banco.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Gera um ULID no aparelho: 10 caracteres de tempo + 16 aleatórios.
 * O lançamento nasce com o id definitivo, então reenviar a mesma requisição não duplica nada.
 */
export function newUlid(now: number = Date.now()): string {
  let time = '';
  let remaining = now;
  for (let i = 0; i < 10; i++) {
    time = ALPHABET[remaining % 32] + time;
    remaining = Math.floor(remaining / 32);
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const random = Array.from(bytes, (byte) => ALPHABET[byte % 32]).join('');
  return time + random;
}
