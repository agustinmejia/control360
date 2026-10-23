#!/usr/bin/env node
/**
 * Falla si un secreto de servidor aparece en los archivos que se envían al navegador
 * (.next/static). Ejecutar después de `next build`.
 *
 * Busca: el valor de SUPABASE_SECRET_KEY (si está definido), claves "sb_secret_",
 * y JWT con rol "service_role".
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? ".next/static";

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const checks = [
  {
    name: "clave secreta de Supabase (sb_secret_)",
    test: (t) => /sb_secret_[A-Za-z0-9_-]{10,}/.test(t),
  },
  {
    name: "JWT con rol service_role",
    test: (t) =>
      [...t.matchAll(/eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g)].some(
        (m) => {
          try {
            return Buffer.from(m[1], "base64url").toString().includes('"service_role"');
          } catch {
            return false;
          }
        },
      ),
  },
];

const secret = process.env.SUPABASE_SECRET_KEY;
if (secret && secret.length >= 16) {
  checks.push({ name: "valor de SUPABASE_SECRET_KEY", test: (t) => t.includes(secret) });
}

let files = 0;
const findings = [];
try {
  for (const file of walk(root)) {
    if (!/\.(js|mjs|css|html|json|map)$/.test(file)) continue;
    files++;
    const text = readFileSync(file, "utf8");
    for (const check of checks) if (check.test(text)) findings.push(`${file}: ${check.name}`);
  }
} catch (error) {
  console.error(`No se pudo leer ${root}. ¿Ejecutaste "pnpm build"?`, error.message);
  process.exit(2);
}

if (findings.length) {
  console.error("✗ Se encontraron secretos en el bundle del cliente:\n" + findings.join("\n"));
  process.exit(1);
}
console.log(`✓ Sin secretos de servidor en ${files} archivos de ${root}`);
