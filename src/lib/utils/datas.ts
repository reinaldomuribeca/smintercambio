/**
 * Adiciona N dias ÚTEIS (pula sábados e domingos) a partir de uma data.
 * NOTA: não considera feriados nacionais — evoluir com um calendário de feriados
 * caso o negócio precise (público é uma agência brasileira).
 */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

/** Adiciona N dias corridos a partir de uma data (não muta a original). */
export function addDays(from: Date, days: number): Date {
  const result = new Date(from)
  result.setDate(result.getDate() + days)
  return result
}
