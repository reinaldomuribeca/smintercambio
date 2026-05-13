CREATE TYPE "FechamentoEtapaStatus" AS ENUM ('PENDENTE', 'CONCLUIDO', 'DEVOLVIDO');

CREATE TABLE "fechamento_matriculas" (
  "id" TEXT NOT NULL,
  "jornadaId" TEXT NOT NULL,
  "etapaAtual" INTEGER NOT NULL DEFAULT 1,
  "concluido" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fechamento_matriculas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fechamento_matriculas_jornadaId_key" ON "fechamento_matriculas"("jornadaId");

CREATE TABLE "fechamento_etapas" (
  "id" TEXT NOT NULL,
  "fechamentoId" TEXT NOT NULL,
  "numero" INTEGER NOT NULL,
  "status" "FechamentoEtapaStatus" NOT NULL DEFAULT 'PENDENTE',
  "dados" JSONB NOT NULL DEFAULT '{}',
  "concluidaEm" TIMESTAMP(3),
  "concluidaPor" UUID,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fechamento_etapas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fechamento_etapas_fechamentoId_numero_key" ON "fechamento_etapas"("fechamentoId", "numero");

ALTER TABLE "fechamento_matriculas" ADD CONSTRAINT "fechamento_matriculas_jornadaId_fkey"
  FOREIGN KEY ("jornadaId") REFERENCES "estudante_jornadas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fechamento_etapas" ADD CONSTRAINT "fechamento_etapas_fechamentoId_fkey"
  FOREIGN KEY ("fechamentoId") REFERENCES "fechamento_matriculas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
