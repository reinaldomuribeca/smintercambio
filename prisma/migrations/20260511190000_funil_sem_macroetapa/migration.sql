-- Make macroetapa optional (no longer required for kanban columns)
ALTER TABLE "funil_etapas" ALTER COLUMN "macroetapa" SET DEFAULT '';
