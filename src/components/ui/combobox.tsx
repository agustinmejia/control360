"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { matchesQuery } from "@/lib/text";
import { controlClass } from "./input";

export type ComboboxOption = { value: string; label: string; hint?: string; disabled?: boolean };

/**
 * Selector con búsqueda (patrón ARIA combobox + listbox). Filtra sin distinguir tildes ni
 * mayúsculas y se maneja con teclado (↑ ↓ Enter Esc) o con el dedo.
 */
export function Combobox({
  id,
  options,
  value,
  onChange,
  placeholder = "Buscar…",
  emptyText = "Sin resultados",
  invalid,
  describedBy,
  maxResults = 50,
}: {
  id?: string;
  options: ComboboxOption[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  invalid?: boolean;
  describedBy?: string;
  maxResults?: number;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-list`;
  const selected = options.find((o) => o.value === value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      options.filter((o) => matchesQuery(`${o.label} ${o.hint ?? ""}`, query)).slice(0, maxResults),
    [options, query, maxResults],
  );

  function choose(option: ComboboxOption | undefined) {
    if (!option || option.disabled) return;
    onChange(option.value);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder={selected ? selected.label : placeholder}
        value={open ? query : (selected?.label ?? "")}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        className={cn(controlClass, "pr-10", selected && open && "placeholder:text-foreground/70")}
      />
      <ChevronsUpDown
        className="text-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="border-border bg-surface absolute z-40 mt-1 max-h-72 w-full overflow-auto rounded-lg border py-1 shadow-lg"
        >
          {filtered.length === 0 && <li className="text-muted px-3 py-2 text-sm">{emptyText}</li>}
          {filtered.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(option)}
              onMouseEnter={() => setActive(index)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 px-3 py-1.5",
                index === active && "bg-surface-muted",
                option.disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <Check
                className={cn(
                  "text-primary size-4 shrink-0",
                  option.value !== value && "invisible",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block break-words">{option.label}</span>
                {option.hint && (
                  <span className="text-muted block truncate text-xs">{option.hint}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
