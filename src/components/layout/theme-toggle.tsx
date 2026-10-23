"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY, type ThemePreference } from "@/lib/ui/theme";

const ORDER: ThemePreference[] = ["system", "light", "dark"];
const LABELS: Record<ThemePreference, string> = {
  system: "Tema: automático",
  light: "Tema: claro",
  dark: "Tema: oscuro",
};

const listeners = new Set<() => void>();

function read(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function write(theme: ThemePreference) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Almacenamiento no disponible: el cambio dura solo esta sesión.
  }
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  listeners.forEach((l) => l());
}

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "system" as ThemePreference,
  );
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? "system";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={() => write(next)}
      aria-label={`${LABELS[theme]}. Cambiar`}
      title={LABELS[theme]}
      className="text-muted hover:bg-surface-muted hover:text-foreground inline-flex min-h-11 items-center gap-2 rounded-lg px-3"
    >
      <Icon className="size-5" aria-hidden />
      {withLabel && <span className="text-sm">{LABELS[theme]}</span>}
    </button>
  );
}
