"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { Button } from "./button";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <div className="text-muted" aria-hidden>
        {icon ?? <Inbox className="size-8" />}
      </div>
      <p className="font-semibold">{title}</p>
      {description && <p className="text-muted max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "No pudimos cargar esta información",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="border-danger/40 bg-danger-soft flex flex-col items-center gap-2 rounded-lg border p-8 text-center"
    >
      <AlertTriangle className="text-danger size-8" aria-hidden />
      <p className="font-semibold">{title}</p>
      {description && <p className="text-muted max-w-sm text-sm">{description}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-2" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

/** Marcador de carga con la forma aproximada del contenido. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("bg-surface-muted animate-pulse rounded-lg", className)} />;
}

export function LoadingState({ rows = 3, label = "Cargando…" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
