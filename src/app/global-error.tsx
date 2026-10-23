"use client";

// Captura errores del layout raíz. Debe declarar sus propias etiquetas <html> y <body>.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="es-BO">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center" }}>
        <h1>La aplicación tuvo un problema</h1>
        <p>Recarga la página. Si persiste, comunica este código: {error.digest ?? "sin código"}.</p>
        <button
          type="button"
          onClick={() => retry()}
          style={{ padding: "12px 16px", marginTop: 12 }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
