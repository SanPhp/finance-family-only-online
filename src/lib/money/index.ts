const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 8750 -> "R$ 87,50". Todo valor em dinheiro do sistema é Int em centavos. */
export function formatCurrency(cents: number): string {
  return currency.format(cents / 100);
}

/** Igual a parseMoneyToCents, mas aceita sinal negativo ("-50,00"). Texto vazio vale 0. */
export function parseSignedMoneyToCents(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return 0;
  const negative = trimmed.startsWith('-');
  const cents = parseMoneyToCents(negative ? trimmed.slice(1) : trimmed);
  if (cents === null) return null;
  return negative ? -cents : cents;
}

const MASK_MAX_DIGITS = 11; // cabe no limite do Int do banco (~R$ 21 milhões)

/**
 * Máscara de dinheiro estilo "caixa eletrônico": a pessoa digita só números e o valor cresce da direita.
 * "8" -> "0,08", "875" -> "8,75", "123456" -> "1.234,56". Colar "R$ 1.234,56" também funciona.
 * Com `allowNegative`, um "-" em qualquer lugar deixa o valor negativo. Sem dígitos devolve "" (ou "-").
 */
export function maskMoney(raw: string, allowNegative = false): string {
  const negative = allowNegative && raw.includes('-');
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, MASK_MAX_DIGITS);
  if (digits === '') return negative ? '-' : '';

  const padded = digits.padStart(3, '0');
  const integer = padded.slice(0, -2).replace(/^0+(?=\d)/, '');
  const cents = padded.slice(-2);
  return `${negative ? '-' : ''}${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${cents}`;
}

/** 123450 -> "1.234,50" (já com a máscara), para preencher um campo de dinheiro ao editar. */
export function centsToInputValue(cents: number): string {
  return cents === 0 ? '0,00' : maskMoney(String(cents), true);
}

/** "87,50" ou "R$ 1.234,5" -> centavos. Retorna null se o texto não for um valor válido. */
export function parseMoneyToCents(input: string): number | null {
  const normalized = input.replace(/R\$|\s|\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [integer, fraction = ''] = normalized.split('.');
  return Number(integer) * 100 + Number(fraction.padEnd(2, '0'));
}
