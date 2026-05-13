-- CreateTable: estados
CREATE TABLE "estados" (
    "id" TEXT NOT NULL,
    "paisId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "estados_pkey" PRIMARY KEY ("id")
);

-- CreateTable: cidades
CREATE TABLE "cidades" (
    "id" TEXT NOT NULL,
    "estadoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cidades_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey for new tables
ALTER TABLE "estados" ADD CONSTRAINT "estados_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "paises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cidades" ADD CONSTRAINT "cidades_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES "estados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add cidadeId to escolas (nullable first for data migration)
ALTER TABLE "escolas" ADD COLUMN "cidadeId" TEXT;

-- Data migration: create placeholder estado + cidade for each existing escola
DO $$
DECLARE
  r RECORD;
  v_estado_id TEXT;
  v_cidade_id TEXT;
BEGIN
  -- Create one placeholder estado per pais
  FOR r IN SELECT DISTINCT "paisId" FROM "escolas" WHERE "paisId" IS NOT NULL LOOP
    v_estado_id := 'st_' || md5(r."paisId");
    IF NOT EXISTS (SELECT 1 FROM "estados" WHERE id = v_estado_id) THEN
      INSERT INTO "estados" (id, "paisId", nome, ativo, created_at, updated_at)
      VALUES (v_estado_id, r."paisId", 'Estado Padrão', true, NOW(), NOW());
    END IF;
  END LOOP;

  -- Create one placeholder cidade per escola and set cidadeId
  FOR r IN SELECT id, "paisId", "cidade" FROM "escolas" LOOP
    v_estado_id := 'st_' || md5(r."paisId");
    v_cidade_id := 'ct_' || md5(r.id);
    INSERT INTO "cidades" (id, "estadoId", nome, ativo, created_at, updated_at)
    VALUES (v_cidade_id, v_estado_id, COALESCE(r."cidade", 'Cidade Padrão'), true, NOW(), NOW());
    UPDATE "escolas" SET "cidadeId" = v_cidade_id WHERE id = r.id;
  END LOOP;
END $$;

-- Make cidadeId NOT NULL
ALTER TABLE "escolas" ALTER COLUMN "cidadeId" SET NOT NULL;

-- AddForeignKey for escolas.cidadeId
ALTER TABLE "escolas" ADD CONSTRAINT "escolas_cidadeId_fkey" FOREIGN KEY ("cidadeId") REFERENCES "cidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old FK and columns from escolas
ALTER TABLE "escolas" DROP CONSTRAINT "escolas_paisId_fkey";
ALTER TABLE "escolas" DROP COLUMN "paisId";
ALTER TABLE "escolas" DROP COLUMN "cidade";
