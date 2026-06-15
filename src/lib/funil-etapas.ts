export type FunilEtapaSeed = {
  slug: string
  nome: string
  cor: string
  macroetapa: string
  ordem: number
  perdido: boolean
}

/**
 * Etapas padrão do funil comercial. Fonte única usada pelo seed (prisma/seed.ts).
 * Espelha a migration de criação da tabela funil_etapas. Sem isso o board do
 * funil sobe vazio em um ambiente novo.
 */
export const DEFAULT_FUNIL_ETAPAS: FunilEtapaSeed[] = [
  { slug: 'NOVO_LEAD', nome: 'Novo Lead', cor: '#94a3b8', macroetapa: 'Lead', ordem: 1, perdido: false },
  { slug: 'REUNIAO_AGENDADA', nome: 'Reunião Agendada', cor: '#eab308', macroetapa: 'Qualificação', ordem: 2, perdido: false },
  { slug: 'REUNIAO_REALIZADA', nome: 'Reunião Realizada', cor: '#eab308', macroetapa: 'Qualificação', ordem: 3, perdido: false },
  { slug: 'DIAGNOSTICO_CONCLUIDO', nome: 'Diagnóstico Concluído', cor: '#eab308', macroetapa: 'Qualificação', ordem: 4, perdido: false },
  { slug: 'PROPOSTA_ENVIADA', nome: 'Proposta Enviada', cor: '#f97316', macroetapa: 'Proposta', ordem: 5, perdido: false },
  { slug: 'FOLLOWUP_ESTRATEGICO', nome: 'Follow-up Estratégico', cor: '#f97316', macroetapa: 'Proposta', ordem: 6, perdido: false },
  { slug: 'EM_DECISAO', nome: 'Em Decisão', cor: '#f97316', macroetapa: 'Proposta', ordem: 7, perdido: false },
  { slug: 'EM_APLICACAO', nome: 'Em Aplicação', cor: '#0ea5e9', macroetapa: 'Aplicação', ordem: 8, perdido: false },
  { slug: 'DOCUMENTACAO_PENDENTE', nome: 'Documentação Pendente', cor: '#0ea5e9', macroetapa: 'Aplicação', ordem: 9, perdido: false },
  { slug: 'APPLICATION_ENVIADA', nome: 'Application Enviada', cor: '#0ea5e9', macroetapa: 'Aplicação', ordem: 10, perdido: false },
  { slug: 'ENTREVISTA_TESTE', nome: 'Entrevista / Teste', cor: '#8b5cf6', macroetapa: 'Admissão', ordem: 11, perdido: false },
  { slug: 'ACEITO_PELA_ESCOLA', nome: 'Aceito pela Escola', cor: '#8b5cf6', macroetapa: 'Admissão', ordem: 12, perdido: false },
  { slug: 'OFFER_ENVIADA', nome: 'Offer Enviada', cor: '#8b5cf6', macroetapa: 'Admissão', ordem: 13, perdido: false },
  { slug: 'DEPOSIT_PAGO', nome: 'Depósito Pago', cor: '#10b981', macroetapa: 'Financeiro', ordem: 14, perdido: false },
  { slug: 'TUITION_PARCIAL', nome: 'Tuition Parcial', cor: '#10b981', macroetapa: 'Financeiro', ordem: 15, perdido: false },
  { slug: 'TUITION_QUITADA', nome: 'Tuition Quitada', cor: '#10b981', macroetapa: 'Financeiro', ordem: 16, perdido: false },
  { slug: 'MATRICULADO', nome: 'Matriculado', cor: '#16a34a', macroetapa: 'Matrícula', ordem: 17, perdido: false },
  { slug: 'VISTO', nome: 'Visto', cor: '#16a34a', macroetapa: 'Matrícula', ordem: 18, perdido: false },
  { slug: 'EMBARQUE', nome: 'Embarque', cor: '#16a34a', macroetapa: 'Matrícula', ordem: 19, perdido: false },
  { slug: 'EM_PROGRAMA', nome: 'Em Programa', cor: '#16a34a', macroetapa: 'Matrícula', ordem: 20, perdido: false },
  { slug: 'SEM_RETORNO', nome: 'Sem Retorno', cor: '#ef4444', macroetapa: 'Perdido', ordem: 21, perdido: true },
  { slug: 'SEM_BUDGET', nome: 'Sem Budget', cor: '#ef4444', macroetapa: 'Perdido', ordem: 22, perdido: true },
  { slug: 'FECHOU_CONCORRENTE', nome: 'Fechou com Concorrente', cor: '#ef4444', macroetapa: 'Perdido', ordem: 23, perdido: true },
  { slug: 'DESISTIU', nome: 'Desistiu', cor: '#ef4444', macroetapa: 'Perdido', ordem: 24, perdido: true },
]
