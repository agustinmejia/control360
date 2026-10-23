import { z } from "@/lib/validation";
import { isIsoDate } from "@/lib/dates";

/** Filtros de la bitácora a partir de la URL (?desde=&hasta=&criticas=1&modulo=&accion=&usuario=&antes=). */
export const auditFiltersSchema = z.object({
  desde: z.string().refine(isIsoDate).optional().catch(undefined),
  hasta: z.string().refine(isIsoDate).optional().catch(undefined),
  criticas: z
    .string()
    .optional()
    .transform((v) => v === "1")
    .catch(false),
  modulo: z
    .string()
    .regex(/^[a-z_]+$/)
    .optional()
    .catch(undefined),
  accion: z
    .string()
    .regex(/^[a-z_]+$/)
    .optional()
    .catch(undefined),
  usuario: z.uuid().optional().catch(undefined),
  antes: z.coerce.number().int().positive().optional().catch(undefined),
});

export type AuditFilters = z.infer<typeof auditFiltersSchema>;

/**
 * Convierte fechas de negocio (La Paz, UTC-4 sin horario de verano) a límites
 * [desde 00:00, hasta+1 00:00) en UTC para la consulta.
 */
export function dateRangeToUtc(desde?: string, hasta?: string): { from?: string; to?: string } {
  const toUtc = (date: string, addDays = 0) => {
    const d = new Date(`${date}T00:00:00-04:00`);
    d.setUTCDate(d.getUTCDate() + addDays);
    return d.toISOString();
  };
  return { from: desde ? toUtc(desde) : undefined, to: hasta ? toUtc(hasta, 1) : undefined };
}

export function parseAuditFilters(
  params: Record<string, string | string[] | undefined>,
): AuditFilters {
  const flat = Object.fromEntries(
    Object.entries(params)
      .map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
      .filter(([, v]) => v !== "" && v !== undefined),
  );
  return auditFiltersSchema.parse(flat);
}
