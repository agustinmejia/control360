import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DemoForm } from "./demo-form";
import { Showcase } from "./showcase";

export const metadata: Metadata = { title: "Componentes", robots: { index: false } };

/** Catálogo de componentes. No disponible en producción. */
export default function DevUiPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-16 lg:p-8">
      <PageHeader
        title="Sistema de diseño"
        description="Componentes base de Control360"
        actions={<ThemeToggle withLabel />}
      />
      <Card>
        <CardTitle>Formulario con validación compartida (Zod) y Server Action</CardTitle>
        <DemoForm />
      </Card>
      <Showcase />
    </main>
  );
}
