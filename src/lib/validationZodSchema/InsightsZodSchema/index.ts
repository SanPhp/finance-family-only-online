import { z } from 'zod';

export const InsightsQueryZodSchema = z.object({
  /** AAAA-MM; sem ele vale o mês atual */
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mês inválido.').optional(),
  /** dia de hoje no fuso de quem consulta (AAAA-MM-DD); sem ele vale a data do servidor (UTC) */
  today: z.iso.date('Data inválida.').optional(),
});

export type InsightsQueryProps = z.infer<typeof InsightsQueryZodSchema>;
