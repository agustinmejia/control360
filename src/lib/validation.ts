import { z } from "zod";

/** Mensajes de validación por defecto en español. Importar `z` siempre desde aquí. */
z.config(z.locales.es());

export { z };
