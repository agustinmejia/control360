import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Se muestra como título de la tarjeta en móvil. */
  primary?: boolean;
  /** Oculta la columna en la vista de tarjetas. */
  hideOnMobile?: boolean;
};

/**
 * Tabla en pantallas medianas o mayores; tarjetas apiladas en móvil (sin scroll horizontal).
 */
export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  footer?: ReactNode;
}) {
  const primary = columns.find((c) => c.primary) ?? columns[0];
  return (
    <>
      <div className="border-border bg-surface hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-border text-muted border-b">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "px-3 py-2.5 font-medium",
                    c.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-border border-b last:border-0">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn("px-3 py-2.5", c.align === "right" && "text-right tabular-nums")}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && <tfoot className="border-foreground border-t-2 font-bold">{footer}</tfoot>}
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={rowKey(row)} className="border-border bg-surface rounded-lg border p-3">
            {primary && <div className="mb-2 font-semibold">{primary.cell(row)}</div>}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              {columns
                .filter((c) => c !== primary && !c.hideOnMobile)
                .map((c) => (
                  <div key={c.key} className="contents">
                    <dt className="text-muted">{c.header}</dt>
                    <dd className={cn(c.align === "right" && "text-right tabular-nums")}>
                      {c.cell(row)}
                    </dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
