import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

const tones = {
  neutral: "bg-surface-muted text-muted border-border",
  success: "bg-primary-soft text-primary border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
