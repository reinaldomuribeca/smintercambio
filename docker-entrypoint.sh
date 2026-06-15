#!/bin/sh
set -e

# Aplica migrations pendentes antes de iniciar (idempotente — no-op se já aplicadas).
# Usa DIRECT_URL (conexão direta) quando disponível: o pooler do Supabase pode
# rejeitar DDL. Se a migration falhar, o container NÃO sobe — o deploy anterior
# continua servindo (fail-safe) e o erro fica visível nos logs.
echo "→ Aplicando migrations (prisma migrate deploy)..."
DATABASE_URL="${DIRECT_URL:-$DATABASE_URL}" node node_modules/prisma/build/index.js migrate deploy

echo "→ Iniciando Next.js..."
exec node server.js
