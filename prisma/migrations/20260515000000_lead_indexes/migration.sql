-- Índices em colunas filtradas com frequência na tabela leads.
-- consultorId: filtro por responsável (getLeads / getFunilLeads para CONSULTOR)
-- funilStatus: filtro por etapa do funil (getLeads / boards)
CREATE INDEX IF NOT EXISTS "leads_consultorId_idx" ON "leads"("consultorId");
CREATE INDEX IF NOT EXISTS "leads_funilStatus_idx" ON "leads"("funilStatus");
