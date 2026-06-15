-- =============================================================================
-- Dinheiro: double precision (Float) -> numeric (Decimal). Evita erro de
-- arredondamento de centavos em valores/comissões. + tabela de auditoria.
-- =============================================================================

-- ─── Financeiro ───────────────────────────────────────────────────────────────
ALTER TABLE "financeiros" ALTER COLUMN "cambioUsado"        TYPE DECIMAL(12, 6) USING "cambioUsado"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "tuitionValor"       TYPE DECIMAL(14, 2) USING "tuitionValor"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "valorBoarding"      TYPE DECIMAL(14, 2) USING "valorBoarding"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "valorSeguro"        TYPE DECIMAL(14, 2) USING "valorSeguro"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "taxasExtras"        TYPE DECIMAL(14, 2) USING "taxasExtras"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "applicationFee"     TYPE DECIMAL(14, 2) USING "applicationFee"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "registrationFee"    TYPE DECIMAL(14, 2) USING "registrationFee"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "acceptanceDeposit"  TYPE DECIMAL(14, 2) USING "acceptanceDeposit"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "taxaAdministrativa" TYPE DECIMAL(14, 2) USING "taxaAdministrativa"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "consultoriaSM"      TYPE DECIMAL(14, 2) USING "consultoriaSM"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "comissaoPrevista"   TYPE DECIMAL(14, 2) USING "comissaoPrevista"::numeric;
ALTER TABLE "financeiros" ALTER COLUMN "comissaoRecebida"   TYPE DECIMAL(14, 2) USING "comissaoRecebida"::numeric;

-- ─── Diagnostico / Aplicacao ────────────────────────────────────────────────
ALTER TABLE "diagnosticos" ALTER COLUMN "budgetBRL"          TYPE DECIMAL(14, 2) USING "budgetBRL"::numeric;
ALTER TABLE "aplicacoes"   ALTER COLUMN "offerValorDeposito" TYPE DECIMAL(14, 2) USING "offerValorDeposito"::numeric;

-- ─── Trilha de auditoria ──────────────────────────────────────────────────────
CREATE TABLE "audit_logs" (
    "id"          TEXT         NOT NULL,
    "entidade"    TEXT         NOT NULL,
    "entidade_id" TEXT         NOT NULL,
    "acao"        TEXT         NOT NULL,
    "autor_id"    UUID         NOT NULL,
    "diff"        JSONB        NOT NULL DEFAULT '{}',
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_entidade_entidade_id_idx" ON "audit_logs"("entidade", "entidade_id");
CREATE INDEX "audit_logs_autor_id_idx" ON "audit_logs"("autor_id");
