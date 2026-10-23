"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/states";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Algo salió mal"
      description={
        error.digest
          ? `Código de referencia: ${error.digest}`
          : "Inténtalo de nuevo en unos segundos."
      }
      onRetry={retry}
    />
  );
}
