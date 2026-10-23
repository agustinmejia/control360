import { z } from "@/lib/validation";
import { ROLES } from "@/modules/access/roles";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => v || null);

const reason = z.string().trim();
const uuid = z.uuid("Identificador inválido");

export const companySchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre comercial").max(120, "Máximo 120 caracteres"),
  legalName: optionalText(200),
  taxId: optionalText(30),
  phone: optionalText(40),
  address: optionalText(300),
  backdateLimitDays: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "Escribe un número de días entre 0 y 365")
    .transform(Number)
    .refine((n) => n <= 365, "Escribe un número de días entre 0 y 365"),
});
export type CompanyInput = z.input<typeof companySchema>;

export const branchSchema = z.object({
  id: uuid.optional(),
  name: z
    .string()
    .trim()
    .min(2, "Escribe el nombre de la sucursal")
    .max(80, "Máximo 80 caracteres"),
  city: optionalText(80),
  address: optionalText(300),
  phone: optionalText(40),
});
export type BranchInput = z.input<typeof branchSchema>;

/** Desactivar exige motivo (borrado lógico); reactivar no. */
const reasonGiven = (v: { active: boolean; reason?: string }) =>
  v.active || (v.reason?.length ?? 0) >= 3;
const reasonIssue = { path: ["reason"], message: "Indica el motivo (mínimo 3 caracteres)" };

export const branchActiveSchema = z
  .object({ id: uuid, active: z.boolean(), reason: reason.optional() })
  .refine(reasonGiven, reasonIssue);

export const userActiveSchema = z
  .object({ userId: uuid, active: z.boolean(), reason: reason.optional() })
  .refine(reasonGiven, reasonIssue);

const role = z.enum(ROLES as [string, ...string[]], { message: "Elige un rol" });

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido")),
  fullName: z.string().trim().min(2, "Escribe el nombre").max(120, "Máximo 120 caracteres"),
  role,
  branchIds: z.array(uuid).default([]),
});
export type InviteInput = z.input<typeof inviteSchema>;

export const userRoleSchema = z.object({ userId: uuid, role, reason: reason.optional() });
export const userBranchesSchema = z.object({ userId: uuid, branchIds: z.array(uuid) });
