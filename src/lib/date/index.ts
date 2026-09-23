/**
 * Datas de negócio (`occurred_on`) são só dia, guardadas como meia-noite UTC.
 * Por isso a formatação usa UTC: evita mostrar o dia anterior em fusos negativos.
 */
const dateFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

const pad = (value: number) => String(value).padStart(2, '0');
const DAY_MS = 24 * 60 * 60 * 1000;

/** Dia de hoje no fuso do aparelho, como "AAAA-MM-DD". */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Mês de hoje no fuso do aparelho, como "AAAA-MM". */
export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

/** "2026-09" -> primeiro e último dia do mês. */
export function monthRange(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${pad(lastDay)}` };
}

/** Quanto do mês já passou, em % (0 a 100): mês futuro = 0, mês passado = 100, mês atual = dia de hoje / dias do mês. */
export function monthElapsedPercent(month: string): number {
  const current = currentMonth();
  if (month > current) return 0;
  if (month < current) return 100;
  const totalDays = Number(monthRange(month).to.slice(8));
  return Math.round((Number(todayISO().slice(8)) * 100) / totalDays);
}

/** shiftMonth("2026-12", 1) -> "2027-01" */
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

/** "2026-09" -> "Setembro de 2026" */
export function formatMonthLabel(month: string): string {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-01T00:00:00Z`),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "2026-09" -> "Set" (para rótulos curtos de gráfico) */
export function formatMonthShort(month: string): string {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(new Date(`${month}-01T00:00:00Z`))
    .replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Título do grupo da lista: "Hoje", "Ontem" ou "18 set". */
export function formatDayHeading(date: string, today: string): string {
  if (date === today) return 'Hoje';
  const yesterday = new Date(new Date(`${today}T00:00:00Z`).getTime() - DAY_MS).toISOString().slice(0, 10);
  if (date === yesterday) return 'Ontem';
  const parts = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).formatToParts(
    new Date(`${date}T00:00:00Z`),
  );
  const day = parts.find((part) => part.type === 'day')?.value;
  const monthName = parts.find((part) => part.type === 'month')?.value.replace('.', '');
  return `${day} ${monthName}`;
}

/** "2026-09-20" ou Date -> "20/09/2026" */
export function formatDate(value: string | Date): string {
  return dateFormat.format(new Date(value));
}
