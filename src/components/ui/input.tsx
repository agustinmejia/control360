import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/ui/cn";

export const controlClass =
  "w-full min-h-11 rounded-lg border border-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-muted/70 disabled:opacity-60 aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlClass, className)} {...props} />;
  },
);

/**
 * Campo para dinero o cantidades. Usa teclado decimal en móviles y acepta coma o punto.
 * El valor se envía como texto; se normaliza con `parseDecimalInput` en el esquema Zod.
 */
export const DecimalInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { prefix?: string; suffix?: string }
>(function DecimalInput({ className, prefix, suffix, ...props }, ref) {
  return (
    <div className="relative flex items-center">
      {prefix && <span className="text-muted pointer-events-none absolute left-3">{prefix}</span>}
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={cn(
          controlClass,
          "text-right tabular-nums",
          prefix && "pl-10",
          suffix && "pr-12",
          className,
        )}
        {...props}
      />
      {suffix && <span className="text-muted pointer-events-none absolute right-3">{suffix}</span>}
    </div>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(controlClass, "appearance-auto", className)} {...props}>
        {children}
      </select>
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlClass, "min-h-24", className)} {...props} />;
});
