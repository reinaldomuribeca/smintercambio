CREATE TABLE "email_templates" (
  "id"        TEXT         NOT NULL,
  "nome"      TEXT         NOT NULL,
  "assunto"   TEXT         NOT NULL,
  "corpo"     TEXT         NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);
