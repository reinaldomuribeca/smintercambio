CREATE TABLE "email_placeholders" (
  "id"            TEXT         NOT NULL,
  "tag"           TEXT         NOT NULL,
  "label"         TEXT         NOT NULL,
  "campo_sistema" TEXT         NOT NULL,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "email_placeholders_pkey"     PRIMARY KEY ("id"),
  CONSTRAINT "email_placeholders_tag_key"  UNIQUE ("tag")
);
