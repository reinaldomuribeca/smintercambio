import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { LeadDetalhe, type LeadDetalheData } from '@/components/leads/lead-detalhe'
import type { AplicacaoProps } from '@/components/aplicacao/aba-aplicacao'
import type { FinanceiroProps } from '@/components/financeiro/aba-financeiro'
import type { ChecklistItem } from '@/lib/actions/aplicacao'
import type { PagamentoItem } from '@/lib/actions/financeiro'
import { decToNum } from '@/lib/utils/financeiro'
import { decryptSecret } from '@/lib/crypto'
import { getLeadTarefas, getUsuariosAtivos } from '@/lib/actions/tarefas'
import { getLeadHistorico } from '@/lib/actions/historico'
import { getJornadaSummaryByLead } from '@/lib/actions/jornada'
import { listPaises } from '@/lib/actions/destinos'
import { getConsultores } from '@/lib/actions/leads'

export const dynamic = 'force-dynamic'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true },
    })
    return { id: user.id, role: dbUser?.role ?? Role.CONSULTOR }
  } catch {
    return { id: user.id, role: Role.CONSULTOR }
  }
}

type Params = Promise<{ id: string }>

export default async function LeadDetalhePage({ params }: { params: Params }) {
  const { id } = await params
  const currentUser = await getCurrentUser()

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      funilStatus: true,
      cidade: true,
      estado: true,
      consultorId: true,
      origemLead: true,
      createdAt: true,
      consultor: { select: { id: true, nome: true } },
      diagnostico: { select: { objetivoPrograma: true } },
      aplicacao: {
        select: {
          id: true,
          portalNome: true,
          portalUrl: true,
          portalLogin: true,
          offerRecebidaEm: true,
          offerDeadline: true,
          offerValorDeposito: true,
          checklistDocs: true,
        },
      },
      financeiro: {
        select: {
          id: true,
          moeda: true,
          cambioUsado: true,
          tuitionValor: true,
          valorBoarding: true,
          valorSeguro: true,
          taxasExtras: true,
          applicationFee: true,
          registrationFee: true,
          acceptanceDeposit: true,
          taxaAdministrativa: true,
          consultoriaSM: true,
          comissaoPrevista: true,
          comissaoRecebida: true,
          comissaoDataPrevista: true,
          comissaoStatus: true,
          pagamentosFamilia: true,
        },
      },
    },
  })

  if (!lead) notFound()

  // CONSULTOR só vê seus próprios leads
  if (currentUser.role === Role.CONSULTOR && lead.consultorId !== currentUser.id) {
    notFound()
  }

  // FINANCEIRO só vê leads onde tem tarefa atribuída
  if (currentUser.role === Role.FINANCEIRO) {
    const tarefa = await prisma.tarefa.findFirst({
      where: { leadId: id, responsavelId: currentUser.id },
      select: { id: true },
    })
    if (!tarefa) notFound()
  }

  // Serializa Date → string para passar ao Client Component
  const aplicacao: AplicacaoProps | null = lead.aplicacao
    ? {
        id: lead.aplicacao.id,
        portalNome: lead.aplicacao.portalNome,
        portalUrl: lead.aplicacao.portalUrl,
        // Credencial: só decifra e serializa para quem pode vê-la (DIRECAO/OPERACOES);
        // para os demais nem trafega no payload RSC.
        portalLogin:
          currentUser.role === Role.DIRECAO || currentUser.role === Role.OPERACOES
            ? decryptSecret(lead.aplicacao.portalLogin)
            : null,
        offerRecebidaEm: lead.aplicacao.offerRecebidaEm?.toISOString() ?? null,
        offerDeadline: lead.aplicacao.offerDeadline?.toISOString() ?? null,
        offerValorDeposito: decToNum(lead.aplicacao.offerValorDeposito),
        checklistDocs: (lead.aplicacao.checklistDocs as unknown as ChecklistItem[]) ?? [],
      }
    : null

  // Fetch tarefas, historicos, usuarios and journey in parallel
  const [tarefas, historicos, usuarios, jornadaRaw, paises, consultores] = await Promise.all([
    getLeadTarefas(id).catch(() => []),
    getLeadHistorico(id).catch(() => []),
    getUsuariosAtivos().catch(() => []),
    getJornadaSummaryByLead(id).catch(() => null),
    listPaises().catch(() => []),
    currentUser.role === Role.DIRECAO ? getConsultores().catch(() => []) : Promise.resolve([]),
  ])

  const jornada = jornadaRaw
    ? {
        id: jornadaRaw.id,
        status: jornadaRaw.status,
        embarqueEm: jornadaRaw.embarqueEm?.toISOString() ?? null,
        retornoEm: jornadaRaw.retornoEm?.toISOString() ?? null,
        escolaId: jornadaRaw.escolaId,
        escola: {
          nome: jornadaRaw.escola.nome,
          pais: { nome: jornadaRaw.escola.cidade.estado.pais.nome, bandeira: jornadaRaw.escola.cidade.estado.pais.bandeira },
        },
        etapas: jornadaRaw.etapas,
      }
    : null

  const financeiro: FinanceiroProps | null = lead.financeiro
    ? {
        id: lead.financeiro.id,
        moeda: lead.financeiro.moeda,
        cambioUsado: decToNum(lead.financeiro.cambioUsado),
        tuitionValor: decToNum(lead.financeiro.tuitionValor),
        valorBoarding: decToNum(lead.financeiro.valorBoarding),
        valorSeguro: decToNum(lead.financeiro.valorSeguro),
        taxasExtras: decToNum(lead.financeiro.taxasExtras),
        applicationFee: decToNum(lead.financeiro.applicationFee),
        registrationFee: decToNum(lead.financeiro.registrationFee),
        acceptanceDeposit: decToNum(lead.financeiro.acceptanceDeposit),
        taxaAdministrativa: decToNum(lead.financeiro.taxaAdministrativa),
        consultoriaSM: decToNum(lead.financeiro.consultoriaSM),
        comissaoPrevista: decToNum(lead.financeiro.comissaoPrevista),
        comissaoRecebida: decToNum(lead.financeiro.comissaoRecebida),
        comissaoDataPrevista: lead.financeiro.comissaoDataPrevista?.toISOString() ?? null,
        comissaoStatus: lead.financeiro.comissaoStatus,
        pagamentosFamilia: (lead.financeiro.pagamentosFamilia as unknown as PagamentoItem[]) ?? [],
      }
    : null

  const leadData: LeadDetalheData = {
    id: lead.id,
    nome: lead.nome,
    funilStatus: lead.funilStatus,
    cidade: lead.cidade,
    estado: lead.estado,
    consultorId: lead.consultorId,
    origemLead: lead.origemLead ?? null,
    createdAt: lead.createdAt.toISOString(),
    consultor: lead.consultor,
    consultores: consultores as { id: string; nome: string }[],
    diagnostico: lead.diagnostico
      ? { objetivoPrograma: lead.diagnostico.objetivoPrograma ?? null }
      : null,
    aplicacao,
    financeiro,
    tarefas,
    historicos,
    usuarios,
    currentUserId: currentUser.id,
    jornada,
    paises,
  }

  return <LeadDetalhe lead={leadData} role={currentUser.role} />
}
