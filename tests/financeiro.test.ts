import { describe, it, expect } from 'vitest'
import { toBRL, sumBRL } from '../src/lib/utils/financeiro'

describe('toBRL', () => {
  it('converte valor * câmbio', () => {
    expect(toBRL(100, 5)).toBe(500)
    expect(toBRL(1250.5, 5.2)).toBeCloseTo(6502.6, 5)
  })

  it('retorna null quando falta valor ou câmbio (não dá para converter)', () => {
    expect(toBRL(null, 5)).toBeNull()
    expect(toBRL(100, null)).toBeNull()
    expect(toBRL(undefined, undefined)).toBeNull()
  })

  it('zero é um valor válido (convertido para 0)', () => {
    expect(toBRL(0, 5)).toBe(0)
  })
})

describe('sumBRL', () => {
  it('soma só os itens com câmbio — nunca mistura moedas diferentes como R$', () => {
    const total = sumBRL([
      { valor: 100, cambio: 5 }, // 500 (ex.: USD)
      { valor: 200, cambio: null }, // ignorado (sem câmbio)
      { valor: 50, cambio: 6 }, // 300 (ex.: GBP)
    ])
    expect(total).toBe(800)
  })

  it('lista vazia retorna 0', () => {
    expect(sumBRL([])).toBe(0)
  })
})
