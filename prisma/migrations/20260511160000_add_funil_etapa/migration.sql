-- Convert funilStatus from enum to text (DB is fresh, no data loss)
ALTER TABLE "leads" ALTER COLUMN "funilStatus" TYPE TEXT USING "funilStatus"::TEXT;
ALTER TABLE "leads" ALTER COLUMN "funilStatus" SET DEFAULT 'NOVO_LEAD';

-- Drop the FunilStatus enum
DROP TYPE IF EXISTS "FunilStatus";

-- CreateTable funil_etapas
CREATE TABLE "funil_etapas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#94a3b8',
    "macroetapa" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "perdido" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funil_etapas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "funil_etapas_slug_key" ON "funil_etapas"("slug");

-- Seed: insert the 23 default stages
INSERT INTO "funil_etapas" (id, slug, nome, cor, macroetapa, ordem, ativa, perdido, created_at, updated_at) VALUES
  (gen_random_uuid()::text, 'NOVO_LEAD',             'Novo Lead',                  '#94a3b8', 'Lead',          1,  true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'REUNIAO_AGENDADA',       'Reunião Agendada',           '#eab308', 'Qualificação',  2,  true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'REUNIAO_REALIZADA',      'Reunião Realizada',          '#eab308', 'Qualificação',  3,  true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'DIAGNOSTICO_CONCLUIDO',  'Diagnóstico Concluído',      '#eab308', 'Qualificação',  4,  true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'PROPOSTA_ENVIADA',       'Proposta Enviada',           '#f97316', 'Proposta',      5,  true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'FOLLOWUP_ESTRATEGICO',   'Follow-up Estratégico',      '#f97316', 'Proposta',      6,  true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'EM_DECISAO',             'Em Decisão',                 '#f97316', 'Proposta',      7,  true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'EM_APLICACAO',           'Em Aplicação',               '#0ea5e9', 'Aplicação',     8,  true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'DOCUMENTACAO_PENDENTE',  'Documentação Pendente',      '#0ea5e9', 'Aplicação',     9,  true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'APPLICATION_ENVIADA',    'Application Enviada',        '#0ea5e9', 'Aplicação',     10, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'ENTREVISTA_TESTE',       'Entrevista / Teste',         '#8b5cf6', 'Admissão',      11, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'ACEITO_PELA_ESCOLA',     'Aceito pela Escola',         '#8b5cf6', 'Admissão',      12, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'OFFER_ENVIADA',          'Offer Enviada',              '#8b5cf6', 'Admissão',      13, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'DEPOSIT_PAGO',           'Depósito Pago',              '#10b981', 'Financeiro',    14, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'TUITION_PARCIAL',        'Tuition Parcial',            '#10b981', 'Financeiro',    15, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'TUITION_QUITADA',        'Tuition Quitada',            '#10b981', 'Financeiro',    16, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'MATRICULADO',            'Matriculado',                '#16a34a', 'Matrícula',     17, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'VISTO',                  'Visto',                      '#16a34a', 'Matrícula',     18, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'EMBARQUE',               'Embarque',                   '#16a34a', 'Matrícula',     19, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'EM_PROGRAMA',            'Em Programa',                '#16a34a', 'Matrícula',     20, true,  false, NOW(), NOW()),
  (gen_random_uuid()::text, 'SEM_RETORNO',            'Sem Retorno',                '#ef4444', 'Perdido',       21, true,  true,  NOW(), NOW()),
  (gen_random_uuid()::text, 'SEM_BUDGET',             'Sem Budget',                 '#ef4444', 'Perdido',       22, true,  true,  NOW(), NOW()),
  (gen_random_uuid()::text, 'FECHOU_CONCORRENTE',     'Fechou com Concorrente',     '#ef4444', 'Perdido',       23, true,  true,  NOW(), NOW()),
  (gen_random_uuid()::text, 'DESISTIU',               'Desistiu',                   '#ef4444', 'Perdido',       24, true,  true,  NOW(), NOW());
