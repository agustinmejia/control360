import type { UseFormRegisterReturn } from "react-hook-form";

/** Selección de sucursales permitidas. Ninguna marcada = acceso a todas. */
export function BranchCheckboxes({
  branches,
  register,
}: {
  branches: { id: string; name: string; is_active: boolean }[];
  register: UseFormRegisterReturn;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-muted mb-1 text-sm font-medium">Sucursales permitidas</legend>
      {branches.map((b) => (
        <label key={b.id} className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            value={b.id}
            {...register}
            className="size-5 accent-[var(--primary)]"
          />
          <span>
            {b.name}
            {!b.is_active && <span className="text-muted text-sm"> (desactivada)</span>}
          </span>
        </label>
      ))}
      <p className="text-muted text-sm">
        Sin marcar ninguna: acceso a todas. Propietarios y administradores siempre ven todas.
      </p>
    </fieldset>
  );
}
