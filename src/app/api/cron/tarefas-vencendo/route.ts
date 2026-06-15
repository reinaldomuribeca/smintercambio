import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

// Endpoint de cron (NÃO é mutation do app — é um webhook de operação).
// Agende 1x/dia no Coolify chamando esta rota com o header de segredo:
//   curl -H "x-cron-secret: $CRON_SECRET" https://<host>/api/cron/tarefas-vencendo
// Envia a cada responsável um digest das tarefas vencidas ou vencendo em 24h.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  const headerSecret = request.headers.get('x-cron-secret')
  if (!secret || (auth !== `Bearer ${secret}` && headerSecret !== secret)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const now = new Date()
  const limite = new Date(now)
  limite.setDate(limite.getDate() + 1) // vencidas + próximas 24h

  const tarefas = await prisma.tarefa.findMany({
    where: { status: 'PENDENTE', prazo: { lte: limite } },
    select: {
      titulo: true,
      prazo: true,
      responsavel: { select: { id: true, nome: true, email: true, ativo: true } },
      lead: { select: { nome: true } },
    },
    orderBy: { prazo: 'asc' },
  })

  // Agrupa por responsável ativo com e-mail.
  const grupos = new Map<
    string,
    { nome: string; email: string; itens: { titulo: string; prazo: Date | null; lead: string }[] }
  >()
  for (const t of tarefas) {
    const r = t.responsavel
    if (!r.ativo || !r.email) continue
    const g = grupos.get(r.id) ?? { nome: r.nome, email: r.email, itens: [] }
    g.itens.push({ titulo: t.titulo, prazo: t.prazo, lead: t.lead.nome })
    grupos.set(r.id, g)
  }

  let enviados = 0
  const falhas: string[] = []
  for (const g of grupos.values()) {
    const linhas = g.itens.map((i) => {
      const venc = i.prazo ? new Date(i.prazo) : null
      const atrasada = venc ? venc < now : false
      const data = venc ? venc.toLocaleDateString('pt-BR') : 'sem prazo'
      return `• ${i.titulo} — ${i.lead} (${atrasada ? 'ATRASADA, venceu em' : 'vence'} ${data})`
    })
    const text = `Olá, ${g.nome}!\n\nVocê tem ${g.itens.length} tarefa(s) vencidas ou vencendo nas próximas 24h:\n\n${linhas.join(
      '\n',
    )}\n\nAcesse o CRM da SM Intercâmbio para concluí-las.`
    const { error } = await sendEmail({
      to: g.email,
      subject: `SM CRM — ${g.itens.length} tarefa(s) precisam de atenção`,
      text,
    })
    if (error) falhas.push(g.email)
    else enviados++
  }

  return NextResponse.json({
    ok: true,
    tarefas: tarefas.length,
    responsaveis: grupos.size,
    enviados,
    falhas,
  })
}
