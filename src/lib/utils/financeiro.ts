/**
 * Converte um valor em moeda original (USD, GBP, …) para BRL usando o câmbio da
 * data de fechamento. Regra do projeto: BRL = valorOriginal * cambioUsado —
 * nunca armazenar BRL diretamente.
 *
 * Retorna null quando valor ou câmbio não estão definidos: nesse caso NÃO há
 * conversão possível, e somar moedas diferentes sem câmbio produziria um total
 * sem sentido (bug histórico nos relatórios).
 */
export function toBRL(
  valorOriginal: number | null | undefined,
  cambio: number | null | undefined,
): number | null {
  if (valorOriginal == null || cambio == null) return null
  return valorOriginal * cambio
}

/**
 * Converte um Prisma.Decimal (ou number) para number, preservando null/undefined.
 * Usar no limite Server→Client: Decimal não é serializável para Client Components.
 */
export function decToNum(
  value: { toNumber(): number } | number | null | undefined,
): number | null {
  if (value == null) return null
  return typeof value === 'number' ? value : value.toNumber()
}

/** Soma uma lista de pares (valor, câmbio) em BRL, ignorando os que não têm câmbio. */
export function sumBRL(
  itens: { valor: number | null | undefined; cambio: number | null | undefined }[],
): number {
  return itens.reduce((acc, it) => {
    const brl = toBRL(it.valor, it.cambio)
    return brl == null ? acc : acc + brl
  }, 0)
}
