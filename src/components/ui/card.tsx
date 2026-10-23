import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-border bg-surface rounded-lg border p-4", className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("mb-3 text-lg font-semibold", className)} {...props} />;
}
