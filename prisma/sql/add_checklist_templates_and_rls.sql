-- =============================================================================
-- Migration: add checklist_templates table + Supabase RLS policies
-- Run via: psql $DATABASE_URL -f prisma/sql/add_checklist_templates_and_rls.sql
-- Or via: Supabase dashboard → SQL Editor
-- =============================================================================

-- ─── ChecklistTemplate table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS checklist_templates (
  id                 TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  objetivo_programa  TEXT        NOT NULL UNIQUE,
  documentos         JSONB       NOT NULL DEFAULT '[]',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT checklist_templates_pkey PRIMARY KEY (id)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS checklist_templates_updated_at ON checklist_templates;
CREATE TRIGGER checklist_templates_updated_at
  BEFORE UPDATE ON checklist_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Supabase RLS Policies
-- NOTE: Prisma connects with service role (bypasses RLS).
--       These policies protect direct anon/user-role connections.
-- =============================================================================

-- ─── Enable RLS on all tables ─────────────────────────────────────────────────

ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE aplicacoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiros         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE historicos_interacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

-- ─── Users table ──────────────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read active users (for selects/dropdowns)
DROP POLICY IF EXISTS "users_read_authenticated" ON users;
CREATE POLICY "users_read_authenticated" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert/update/delete users
-- (user management is done via supabaseAdmin in Server Actions)

-- ─── Leads ────────────────────────────────────────────────────────────────────

-- DIRECAO/ADMINISTRATIVO/OPERACOES see all leads
-- CONSULTOR sees only own leads
DROP POLICY IF EXISTS "leads_select" ON leads;
CREATE POLICY "leads_select" ON leads
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (u.role IN ('DIRECAO', 'ADMINISTRATIVO', 'OPERACOES')
             OR (u.role = 'CONSULTOR' AND leads.consultor_id = auth.uid()))
    )
  );

-- Only service role can mutate leads (Server Actions handle all writes)
DROP POLICY IF EXISTS "leads_write_service" ON leads;
CREATE POLICY "leads_write_service" ON leads
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Financeiros ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "financeiros_select" ON financeiros;
CREATE POLICY "financeiros_select" ON financeiros
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('DIRECAO', 'ADMINISTRATIVO')
    )
  );

-- ─── ChecklistTemplates ───────────────────────────────────────────────────────

-- Only DIRECAO (via service role) can read/write templates
DROP POLICY IF EXISTS "checklist_templates_service" ON checklist_templates;
CREATE POLICY "checklist_templates_service" ON checklist_templates
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Default: service_role bypass for all remaining tables ────────────────────
-- Prisma uses service role → these just ensure direct connections are blocked.

DROP POLICY IF EXISTS "aplicacoes_service" ON aplicacoes;
CREATE POLICY "aplicacoes_service" ON aplicacoes
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "diagnosticos_service" ON diagnosticos;
CREATE POLICY "diagnosticos_service" ON diagnosticos
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "tarefas_service" ON tarefas;
CREATE POLICY "tarefas_service" ON tarefas
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "historicos_service" ON historicos_interacao;
CREATE POLICY "historicos_service" ON historicos_interacao
  FOR ALL USING (auth.role() = 'service_role');
