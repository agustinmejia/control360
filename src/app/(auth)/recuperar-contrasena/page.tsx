import type { Metadata } from "next";
import { ResetRequestForm } from "./reset-request-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ResetRequestPage() {
  return <ResetRequestForm />;
}
