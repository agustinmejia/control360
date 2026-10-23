import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-primary text-5xl font-extrabold">404</p>
      <h1 className="text-xl font-bold">No encontramos esta página</h1>
      <p className="text-muted">
        Puede que el enlace esté mal escrito o que la página ya no exista.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground mt-2 inline-flex min-h-11 items-center rounded-lg px-4 font-semibold"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
