import type { ObjetivoPrograma } from '@prisma/client'

/** Rótulos amigáveis do objetivo de programa — usados em e-mails, relatórios e UI
 *  (evita expor o valor cru do enum, ex.: "HIGH_SCHOOL", para famílias). */
export const PROGRAMA_LABEL: Record<ObjetivoPrograma, string> = {
  HIGH_SCHOOL: 'High School',
  BOARDING_SCHOOL: 'Boarding School',
  SUMMER: 'Summer',
  IDIOMA: 'Idioma',
  COLLEGE: 'College',
  EXPERIENCIA_CURTA: 'Experiência Curta',
}

export function labelObjetivoPrograma(value: string | null | undefined): string {
  if (!value) return ''
  return PROGRAMA_LABEL[value as ObjetivoPrograma] ?? value
}
