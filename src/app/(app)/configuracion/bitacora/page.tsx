import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { formatDateTime } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/modules/access/session";
import {
  ACTION_LABELS,
  ENTITY_LABELS,
  MODULE_LABELS,
  describeChanges,
  label,
} from "@/modules/audit/labels";
import { dateRangeToUtc, parseAuditFilters } from "@/modules/audit/search";

export const metadata: Metadata = { title: "Bitácora de acciones" };

const PAGE_SIZE = 50;

export default async function AuditLogPage(props: PageProps<"/configuracion/bitacora">) {
  if (!(await requirePermission("audit.read"))) return <NoPermission />;
  const filters = parseAuditFilters(await props.searchParams);
  const { from, to } = dateRangeToUtc(filters.desde, filters.hasta);

  const supabase = await createSupabaseServerClient();
  const [{ data: rows, error }, { data: people }] = await Promise.all([
    supabase.rpc("audit_log_search", {
      p_from: from,
      p_to: to,
      p_only_critical: filters.criticas,
      p_module: filters.modulo,
      p_action: filters.accion,
      p_actor: filters.usuario,
      p_before_id: filters.antes,
      p_limit: PAGE_SIZE,
    }),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
  ]);

  const lastId = rows && rows.length === PAGE_SIZE ? rows[rows.length - 1]?.id : undefined;
  const nextParams = new URLSearchParams(
    Object.entries({ ...filters, criticas: filters.criticas ? "1" : undefined, antes: lastId })
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  );

  return (
    <>
      <BackLink href="/configuracion" label="Configuración" />
      <PageHeader
        title="Bitácora de acciones"
        description="Registro inmutable de todo lo que se hace en el sistema."
      />

      <Card className="no-print mb-4">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-muted flex flex-col gap-1.5 text-sm font-medium">
            Desde
            <Input type="date" name="desde" defaultValue={filters.desde} />
          </label>
          <label className="text-muted flex flex-col gap-1.5 text-sm font-medium">
            Hasta
            <Input type="date" name="hasta" defaultValue={filters.hasta} />
          </label>
          <label className="text-muted flex flex-col gap-1.5 text-sm font-medium">
            Usuario
            <Select name="usuario" defaultValue={filters.usuario ?? ""}>
              <option value="">Todos</option>
              {(people ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-muted flex flex-col gap-1.5 text-sm font-medium">
            Módulo
            <Select name="modulo" defaultValue={filters.modulo ?? ""}>
              <option value="">Todos</option>
              {Object.entries(MODULE_LABELS).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-muted flex flex-col gap-1.5 text-sm font-medium">
            Acción
            <Select name="accion" defaultValue={filters.accion ?? ""}>
              <option value="">Todas</option>
              {Object.entries(ACTION_LABELS).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex min-h-11 items-center gap-3 self-end">
            <input
              type="checkbox"
              name="criticas"
              value="1"
              defaultChecked={filters.criticas}
              className="size-5 accent-[var(--primary)]"
            />
            <span>Solo acciones críticas</span>
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="submit">Filtrar</Button>
            <Link
              href="/configuracion/bitacora"
              className="text-muted hover:bg-surface-muted inline-flex min-h-11 items-center rounded-lg px-4 font-semibold"
            >
              Limpiar
            </Link>
          </div>
        </form>
      </Card>

      {error ? (
        <ErrorState description="No se pudo consultar la bitácora." />
      ) : !rows?.length ? (
        <EmptyState title="Sin acciones para estos filtros" />
      ) : (
        <ol className="flex flex-col gap-2" aria-label="Acciones registradas">
          {rows.map((r) => {
            const changes = describeChanges(
              r.changed_fields,
              r.old_data as Record<string, unknown> | null,
              r.new_data as Record<string, unknown> | null,
            );
            return (
              <li key={r.id} className="border-border bg-surface rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={r.severity === "critical" ? "danger" : "neutral"}>
                    {label(ACTION_LABELS, r.action)}
                  </Badge>
                  <span className="font-semibold">{label(ENTITY_LABELS, r.entity)}</span>
                  <span className="text-muted text-sm">· {label(MODULE_LABELS, r.module)}</span>
                  <span className="text-muted ml-auto text-sm tabular-nums">
                    {formatDateTime(r.occurred_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  <span className="text-muted">Por </span>
                  {r.actor_name}
                  {r.reason && (
                    <>
                      <span className="text-muted"> · Motivo: </span>
                      {r.reason}
                    </>
                  )}
                </p>
                {changes.length > 0 && (
                  <details className="mt-2 text-sm">
                    <summary className="text-muted cursor-pointer">
                      {changes.length === 1 ? "1 cambio" : `${changes.length} cambios`}
                    </summary>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {changes.map((c) => (
                        <li key={c.field}>
                          <span className="text-muted">{c.field}:</span>{" "}
                          <s className="text-muted">{c.before}</s> → {c.after}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {lastId && (
        <div className="mt-4">
          <Link
            href={`/configuracion/bitacora?${nextParams}`}
            className="border-border hover:bg-surface-muted inline-flex min-h-11 items-center rounded-lg border px-4 font-semibold"
          >
            Ver acciones anteriores
          </Link>
        </div>
      )}
    </>
  );
}
