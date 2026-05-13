-- Add new enum values (idempotent)
ALTER TYPE "JornadaStatus" ADD VALUE IF NOT EXISTS 'FECHAMENTO_MATRICULA';
ALTER TYPE "JornadaStatus" ADD VALUE IF NOT EXISTS 'PREPARACAO_VIAGEM';
ALTER TYPE "JornadaStatus" ADD VALUE IF NOT EXISTS 'VIAJANDO';
ALTER TYPE "JornadaStatus" ADD VALUE IF NOT EXISTS 'RETORNOU';

-- Migrate existing data
UPDATE "estudante_jornadas" SET "status" = 'FECHAMENTO_MATRICULA' WHERE "status" IN ('EM_ANDAMENTO', 'PRONTO_EMBARQUE');
UPDATE "estudante_jornadas" SET "status" = 'RETORNOU' WHERE "status" = 'CONCLUIDO';

-- Must drop the column default before dropping the enum type (default references the type)
ALTER TABLE "estudante_jornadas" ALTER COLUMN "status" DROP DEFAULT;

-- Convert column to text so we can recreate the enum
ALTER TABLE "estudante_jornadas" ALTER COLUMN "status" TYPE text;

-- Recreate enum with only new values
DROP TYPE "JornadaStatus";
CREATE TYPE "JornadaStatus" AS ENUM ('FECHAMENTO_MATRICULA', 'PREPARACAO_VIAGEM', 'VIAJANDO', 'RETORNOU');

-- Convert column back and restore default
ALTER TABLE "estudante_jornadas" ALTER COLUMN "status" TYPE "JornadaStatus" USING "status"::"JornadaStatus";
ALTER TABLE "estudante_jornadas" ALTER COLUMN "status" SET DEFAULT 'FECHAMENTO_MATRICULA';
