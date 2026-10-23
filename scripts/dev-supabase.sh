#!/usr/bin/env bash
# Inicia Supabase local solo con los servicios que usa Control360 hoy
# (base de datos, Auth, API y buzón de correo de prueba).
set -euo pipefail
exec pnpm exec supabase start -x realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor,studio,postgres-meta "$@"
