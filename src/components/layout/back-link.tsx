import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="no-print text-muted hover:text-foreground mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
