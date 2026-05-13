-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DIRECAO', 'CONSULTOR', 'ADMINISTRATIVO', 'OPERACOES');

-- CreateEnum
CREATE TYPE "FunilStatus" AS ENUM ('NOVO_LEAD', 'REUNIAO_AGENDADA', 'REUNIAO_REALIZADA', 'DIAGNOSTICO_CONCLUIDO', 'PROPOSTA_ENVIADA', 'FOLLOWUP_ESTRATEGICO', 'EM_DECISAO', 'EM_APLICACAO', 'DOCUMENTACAO_PENDENTE', 'APPLICATION_ENVIADA', 'ENTREVISTA_TESTE', 'ACEITO_PELA_ESCOLA', 'OFFER_ENVIADA', 'DEPOSIT_PAGO', 'TUITION_PARCIAL', 'TUITION_QUITADA', 'MATRICULADO', 'VISTO', 'EMBARQUE', 'EM_PROGRAMA', 'SEM_RETORNO', 'SEM_BUDGET', 'FECHOU_CONCORRENTE', 'DESISTIU');

-- CreateEnum
CREATE TYPE "ObjetivoPrograma" AS ENUM ('HIGH_SCHOOL', 'BOARDING_SCHOOL', 'SUMMER', 'IDIOMA', 'COLLEGE', 'EXPERIENCIA_CURTA');

-- CreateEnum
CREATE TYPE "TarefaTipo" AS ENUM ('FOLLOWUP', 'DOCUMENTO', 'REUNIAO', 'ALERTA', 'OUTRO');

-- CreateEnum
CREATE TYPE "TarefaStatus" AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "HistoricoTipo" AS ENUM ('REUNIAO', 'MENSAGEM', 'EMAIL', 'ARQUIVO', 'NOTA');

-- CreateEnum
CREATE TYPE "ComissaoStatus" AS ENUM ('PENDENTE', 'PARCIAL', 'RECEBIDA');

-- CreateEnum
CREATE TYPE "OrigemLead" AS ENUM ('INDICACAO', 'INSTAGRAM', 'FACEBOOK', 'GOOGLE', 'SITE', 'FEIRA', 'EVENTO', 'WHATSAPP', 'OUTRO');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "serieAtual" TEXT,
    "escolaAtual" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "nomeResponsaveis" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "origemLead" "OrigemLead",
    "observacoes" TEXT,
    "funilStatus" "FunilStatus" NOT NULL DEFAULT 'NOVO_LEAD',
    "motivoPerda" TEXT,
    "consultorId" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "nomeAluno" TEXT,
    "idadeAluno" INTEGER,
    "anoEscolar" TEXT,
    "notasEscolares" TEXT,
    "nivelIngles" TEXT,
    "objetivoPrograma" "ObjetivoPrograma",
    "destinosDesejados" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duracaoMeses" INTEGER,
    "anoPartidaPrevisto" INTEGER,
    "budgetBRL" DOUBLE PRECISION,
    "financiamento" BOOLEAN,
    "nomePai" TEXT,
    "nomeMae" TEXT,
    "emailResponsavel" TEXT,
    "telefoneResponsavel" TEXT,
    "riscos" TEXT,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnosticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aplicacoes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "nomeEscola" TEXT,
    "paisEscola" TEXT,
    "portalNome" TEXT,
    "portalUrl" TEXT,
    "portalLogin" TEXT,
    "offerRecebidaEm" TIMESTAMP(3),
    "offerEnviadaFamiliaEm" TIMESTAMP(3),
    "offerDeadline" TIMESTAMP(3),
    "offerValorDeposito" DOUBLE PRECISION,
    "offerDetalhes" TEXT,
    "checklistDocs" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aplicacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financeiros" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "moeda" TEXT,
    "cambioUsado" DOUBLE PRECISION,
    "dataFechamento" TIMESTAMP(3),
    "tuitionValor" DOUBLE PRECISION,
    "valorBoarding" DOUBLE PRECISION,
    "valorSeguro" DOUBLE PRECISION,
    "taxasExtras" DOUBLE PRECISION,
    "applicationFee" DOUBLE PRECISION,
    "registrationFee" DOUBLE PRECISION,
    "acceptanceDeposit" DOUBLE PRECISION,
    "taxaAdministrativa" DOUBLE PRECISION,
    "consultoriaSM" DOUBLE PRECISION,
    "comissaoPrevista" DOUBLE PRECISION,
    "comissaoRecebida" DOUBLE PRECISION,
    "comissaoDataPrevista" TIMESTAMP(3),
    "comissaoStatus" "ComissaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "pagamentosFamilia" JSONB NOT NULL DEFAULT '[]',
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "responsavelId" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TarefaTipo" NOT NULL,
    "status" "TarefaStatus" NOT NULL DEFAULT 'PENDENTE',
    "prazo" TIMESTAMP(3),
    "concluidaEm" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historicos_interacao" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "autorId" UUID NOT NULL,
    "tipo" "HistoricoTipo" NOT NULL,
    "titulo" TEXT,
    "conteudo" TEXT,
    "arquivoUrl" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historicos_interacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "objetivoPrograma" "ObjetivoPrograma" NOT NULL,
    "documentos" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosticos_leadId_key" ON "diagnosticos"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "aplicacoes_leadId_key" ON "aplicacoes"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "financeiros_leadId_key" ON "financeiros"("leadId");

-- CreateIndex
CREATE INDEX "tarefas_leadId_idx" ON "tarefas"("leadId");

-- CreateIndex
CREATE INDEX "tarefas_responsavelId_idx" ON "tarefas"("responsavelId");

-- CreateIndex
CREATE INDEX "tarefas_status_prazo_idx" ON "tarefas"("status", "prazo");

-- CreateIndex
CREATE INDEX "historicos_interacao_leadId_idx" ON "historicos_interacao"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_templates_objetivoPrograma_key" ON "checklist_templates"("objetivoPrograma");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_consultorId_fkey" FOREIGN KEY ("consultorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicacoes" ADD CONSTRAINT "aplicacoes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financeiros" ADD CONSTRAINT "financeiros_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historicos_interacao" ADD CONSTRAINT "historicos_interacao_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historicos_interacao" ADD CONSTRAINT "historicos_interacao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
