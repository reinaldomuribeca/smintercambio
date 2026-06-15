import { describe, it, expect } from 'vitest'
import { addBusinessDays, addDays } from '../src/lib/utils/datas'

// Localiza datas por dia da semana sem depender do calendário absoluto.
function proximo(diaDaSemana: number): Date {
  const d = new Date('2026-06-01T12:00:00')
  while (d.getDay() !== diaDaSemana) d.setDate(d.getDate() + 1)
  return d
}

describe('addBusinessDays', () => {
  it('0 dias úteis retorna a mesma data', () => {
    const d = proximo(3) // quarta
    expect(addBusinessDays(d, 0).getTime()).toBe(d.getTime())
  })

  it('sexta + 1 dia útil cai na segunda', () => {
    const sexta = proximo(5)
    expect(addBusinessDays(sexta, 1).getDay()).toBe(1)
  })

  it('sexta + 3 dias úteis cai na quarta seguinte', () => {
    const sexta = proximo(5)
    const r = addBusinessDays(sexta, 3)
    expect(r.getDay()).toBe(3)
    // sex -> seg(1) -> ter(2) -> qua(3): 5 dias corridos depois
    expect(r.getDate()).toBe(sexta.getDate() + 5)
  })

  it('nunca cai em fim de semana', () => {
    for (let inicio = 0; inicio < 7; inicio++) {
      const base = proximo(inicio)
      for (let n = 1; n <= 10; n++) {
        const dow = addBusinessDays(base, n).getDay()
        expect(dow === 0 || dow === 6).toBe(false)
      }
    }
  })

  it('não muta a data original', () => {
    const d = proximo(2)
    const antes = d.getTime()
    addBusinessDays(d, 5)
    expect(d.getTime()).toBe(antes)
  })
})

describe('addDays', () => {
  it('soma dias corridos', () => {
    const d = proximo(1)
    expect(addDays(d, 3).getDate()).toBe(d.getDate() + 3)
  })
})
