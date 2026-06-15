import type { ObjetivoPrograma } from '@prisma/client'

export type ChecklistTemplateDoc = { nome: string; obrigatorio: boolean }

/**
 * Documentos padrão por objetivo de programa. Fonte ÚNICA usada por:
 *  - createAplicacao (fallback quando não há template no banco)
 *  - prisma/seed.ts (popula a tabela checklist_templates)
 * O status inicial (sempre 'PENDENTE') é adicionado por quem consome.
 */
export const DEFAULT_CHECKLIST_TEMPLATES: Record<ObjetivoPrograma, ChecklistTemplateDoc[]> = {
  HIGH_SCHOOL: [
    { nome: 'Passaporte', obrigatorio: true },
    { nome: 'Transcrição escolar (2 últimos anos)', obrigatorio: true },
    { nome: 'Atestado de matrícula', obrigatorio: true },
    { nome: 'Histórico escolar', obrigatorio: true },
    { nome: 'Carta de recomendação — Professor', obrigatorio: true },
    { nome: 'Carta de recomendação — Diretor', obrigatorio: false },
    { nome: 'Redação motivacional (essay)', obrigatorio: false },
    { nome: 'Foto 3×4 (padrão passaporte)', obrigatorio: true },
    { nome: 'Certidão de nascimento', obrigatorio: false },
    { nome: 'Atestado médico', obrigatorio: false },
    { nome: 'Comprovante de renda familiar', obrigatorio: true },
  ],
  BOARDING_SCHOOL: [
    { nome: 'Passaporte', obrigatorio: true },
    { nome: 'Transcrição escolar (2 últimos anos)', obrigatorio: true },
    { nome: 'Atestado de matrícula', obrigatorio: true },
    { nome: 'Histórico escolar', obrigatorio: true },
    { nome: 'Carta de recomendação — Professor', obrigatorio: true },
    { nome: 'Carta de recomendação — Diretor', obrigatorio: true },
    { nome: 'Redação motivacional (essay)', obrigatorio: true },
    { nome: 'Foto 3×4 (padrão passaporte)', obrigatorio: true },
    { nome: 'Certidão de nascimento', obrigatorio: false },
    { nome: 'Atestado médico / Vacinas', obrigatorio: true },
    { nome: 'Comprovante de renda familiar', obrigatorio: true },
    { nome: 'Formulário médico da escola', obrigatorio: false },
  ],
  SUMMER: [
    { nome: 'Passaporte', obrigatorio: true },
    { nome: 'Formulário de inscrição', obrigatorio: true },
    { nome: 'Foto 3×4 (padrão passaporte)', obrigatorio: true },
    { nome: 'Comprovante de renda familiar', obrigatorio: false },
    { nome: 'Atestado médico', obrigatorio: false },
  ],
  IDIOMA: [
    { nome: 'Passaporte', obrigatorio: true },
    { nome: 'Formulário de inscrição', obrigatorio: true },
    { nome: 'Comprovante de renda familiar', obrigatorio: false },
  ],
  COLLEGE: [
    { nome: 'Passaporte', obrigatorio: true },
    { nome: 'Histórico escolar (Ensino Médio)', obrigatorio: true },
    { nome: 'Diploma Ensino Médio', obrigatorio: true },
    { nome: 'Transcrição com notas', obrigatorio: true },
    { nome: 'Carta de recomendação (1)', obrigatorio: true },
    { nome: 'Carta de recomendação (2)', obrigatorio: false },
    { nome: 'Redações motivacionais (essays)', obrigatorio: true },
    { nome: 'SAT / ACT (se exigido)', obrigatorio: false },
    { nome: 'Comprovante de renda familiar', obrigatorio: true },
    { nome: 'Atestado médico / Vacinas', obrigatorio: false },
  ],
  EXPERIENCIA_CURTA: [
    { nome: 'Passaporte', obrigatorio: true },
    { nome: 'Formulário de inscrição', obrigatorio: true },
    { nome: 'Comprovante de renda familiar', obrigatorio: false },
  ],
}
