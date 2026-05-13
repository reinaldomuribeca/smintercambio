-- CreateEnum
CREATE TYPE "EscolaTipo" AS ENUM ('PUBLICA', 'PRIVADA', 'UNIVERSIDADE', 'IDIOMAS', 'OUTRO');
CREATE TYPE "CampoTipo" AS ENUM ('TEXTO', 'DATA', 'BOOLEAN', 'ARQUIVO', 'LINK', 'SELECT', 'NUMERO', 'TEXTO_LONGO');
CREATE TYPE "JornadaEtapaStatus" AS ENUM ('NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'PENDENTE_DOC');
CREATE TYPE "JornadaStatus" AS ENUM ('EM_ANDAMENTO', 'PRONTO_EMBARQUE', 'CONCLUIDO');
CREATE TYPE "PreEmbarqueModalidade" AS ENUM ('PRESENCIAL', 'ONLINE');
CREATE TYPE "PreEmbarqueStatus" AS ENUM ('PENDENTE', 'REALIZADO');

-- CreateTable: paises
CREATE TABLE "paises" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "bandeira" TEXT,
    "moeda" TEXT,
    "idioma" TEXT,
    "regrasImigracao" TEXT,
    "documentos" JSONB NOT NULL DEFAULT '[]',
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "paises_pkey" PRIMARY KEY ("id")
);

-- CreateTable: escolas
CREATE TABLE "escolas" (
    "id" TEXT NOT NULL,
    "paisId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "EscolaTipo" NOT NULL DEFAULT 'OUTRO',
    "cidade" TEXT,
    "endereco" TEXT,
    "website" TEXT,
    "regras" TEXT,
    "documentos" JSONB NOT NULL DEFAULT '[]',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "escolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable: escola_contatos
CREATE TABLE "escola_contatos" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    CONSTRAINT "escola_contatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable: jornada_etapa_templates
CREATE TABLE "jornada_etapa_templates" (
    "id" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "prazoDiasAntes" INTEGER,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "jornada_etapa_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: jornada_campo_templates
CREATE TABLE "jornada_campo_templates" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "CampoTipo" NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "opcoes" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "jornada_campo_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: estudante_jornadas
CREATE TABLE "estudante_jornadas" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "escolaId" TEXT NOT NULL,
    "embarqueEm" TIMESTAMP(3),
    "retornoEm" TIMESTAMP(3),
    "status" "JornadaStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "estudante_jornadas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "estudante_jornadas_leadId_key" ON "estudante_jornadas"("leadId");

-- CreateTable: estudante_jornada_etapas
CREATE TABLE "estudante_jornada_etapas" (
    "id" TEXT NOT NULL,
    "jornadaId" TEXT NOT NULL,
    "etapaTemplateId" TEXT NOT NULL,
    "status" "JornadaEtapaStatus" NOT NULL DEFAULT 'NAO_INICIADO',
    "concluidaEm" TIMESTAMP(3),
    "notasConsultor" TEXT,
    "updatedBy" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "estudante_jornada_etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable: estudante_etapa_valores
CREATE TABLE "estudante_etapa_valores" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "campoId" TEXT NOT NULL,
    "valor" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updatedBy" UUID,
    CONSTRAINT "estudante_etapa_valores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "estudante_etapa_valores_etapaId_campoId_key" ON "estudante_etapa_valores"("etapaId", "campoId");

-- CreateTable: estudante_etapa_documentos
CREATE TABLE "estudante_etapa_documentos" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" UUID NOT NULL,
    CONSTRAINT "estudante_etapa_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pre_embarques
CREATE TABLE "pre_embarques" (
    "id" TEXT NOT NULL,
    "jornadaId" TEXT NOT NULL,
    "dataReuniao" TIMESTAMP(3),
    "modalidade" "PreEmbarqueModalidade" NOT NULL DEFAULT 'PRESENCIAL',
    "linkReuniao" TEXT,
    "consultorId" UUID,
    "estudantePresente" TEXT,
    "responsavel1Nome" TEXT,
    "responsavel1Presente" TEXT,
    "responsavel2Nome" TEXT,
    "responsavel2Presente" TEXT,
    "observacoes" TEXT,
    "status" "PreEmbarqueStatus" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pre_embarques_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pre_embarques_jornadaId_key" ON "pre_embarques"("jornadaId");

-- CreateTable: pre_embarque_itens
CREATE TABLE "pre_embarque_itens" (
    "id" TEXT NOT NULL,
    "preEmbarqueId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "marcado" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "pre_embarque_itens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "escolas" ADD CONSTRAINT "escolas_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "paises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "escola_contatos" ADD CONSTRAINT "escola_contatos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jornada_etapa_templates" ADD CONSTRAINT "jornada_etapa_templates_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jornada_campo_templates" ADD CONSTRAINT "jornada_campo_templates_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "jornada_etapa_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "estudante_jornadas" ADD CONSTRAINT "estudante_jornadas_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "estudante_jornadas" ADD CONSTRAINT "estudante_jornadas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "estudante_jornada_etapas" ADD CONSTRAINT "estudante_jornada_etapas_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "estudante_jornadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "estudante_jornada_etapas" ADD CONSTRAINT "estudante_jornada_etapas_etapaTemplateId_fkey" FOREIGN KEY ("etapaTemplateId") REFERENCES "jornada_etapa_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "estudante_etapa_valores" ADD CONSTRAINT "estudante_etapa_valores_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "estudante_jornada_etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "estudante_etapa_valores" ADD CONSTRAINT "estudante_etapa_valores_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "jornada_campo_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "estudante_etapa_documentos" ADD CONSTRAINT "estudante_etapa_documentos_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "estudante_jornada_etapas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pre_embarques" ADD CONSTRAINT "pre_embarques_jornadaId_fkey" FOREIGN KEY ("jornadaId") REFERENCES "estudante_jornadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pre_embarques" ADD CONSTRAINT "pre_embarques_consultorId_fkey" FOREIGN KEY ("consultorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pre_embarque_itens" ADD CONSTRAINT "pre_embarque_itens_preEmbarqueId_fkey" FOREIGN KEY ("preEmbarqueId") REFERENCES "pre_embarques"("id") ON DELETE CASCADE ON UPDATE CASCADE;
