'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { Role, EscolaTipo, CampoTipo } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DestinoFormState = { error?: string; success?: boolean } | null

export type DocumentoItem = { nome: string; descricao: string; obrigatorio: boolean }

export type ContatoItem = { id?: string; nome: string; cargo: string; email: string; telefone: string }

export type CampoItem = {
  id?: string
  nome: string
  tipo: CampoTipo
  obrigatorio: boolean
  placeholder: string
  opcoes: string
  ordem: number
}

export type EtapaTemplateData = {
  id: string
  numero: number
  nome: string
  descricao: string | null
  prazoDiasAntes: number | null
  observacoes: string | null
  fase: 'FECHAMENTO_MATRICULA' | 'PREPARACAO_VIAGEM'
  campos: CampoItem[]
}

export type CidadeData = {
  id: string
  estadoId: string
  nome: string
  ativo: boolean
  escolas: { id: string; nome: string; ativo: boolean }[]
}

export type EstadoData = {
  id: string
  paisId: string
  nome: string
  sigla: string | null
  ativo: boolean
  cidades: CidadeData[]
}

export type PaisData = {
  id: string
  nome: string
  bandeira: string | null
  moeda: string | null
  idioma: string | null
  regrasImigracao: string | null
  documentos: DocumentoItem[]
  observacoes: string | null
  ativo: boolean
  estados: EstadoData[]
}

export type EscolaData = {
  id: string
  cidadeId: string
  cidadeNome: string
  estadoNome: string
  paisNome: string
  paisBandeira: string | null
  nome: string
  tipo: EscolaTipo
  endereco: string | null
  website: string | null
  regras: string | null
  documentos: DocumentoItem[]
  ativo: boolean
  contatos: ContatoItem[]
  etapaTemplates: EtapaTemplateData[]
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function requireDirecao(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect('/login'); return null }
  try {
    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { role: true } })
    if (dbUser.role !== Role.DIRECAO) return 'Acesso negado.'
    return null
  } catch {
    return 'Erro de autenticação.'
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listPaises(): Promise<PaisData[]> {
  await getAuthUser() // exige sessão (antes era endpoint RPC sem nenhuma checagem)
  const paises = await prisma.pais.findMany({
    include: {
      estados: {
        include: {
          cidades: {
            include: { escolas: { select: { id: true, nome: true, ativo: true }, orderBy: { nome: 'asc' } } },
            orderBy: { nome: 'asc' },
          },
        },
        orderBy: { nome: 'asc' },
      },
    },
    orderBy: { nome: 'asc' },
  })
  return paises.map((p) => ({
    id: p.id,
    nome: p.nome,
    bandeira: p.bandeira,
    moeda: p.moeda,
    idioma: p.idioma,
    regrasImigracao: p.regrasImigracao,
    documentos: (p.documentos as unknown as DocumentoItem[]) ?? [],
    observacoes: p.observacoes,
    ativo: p.ativo,
    estados: p.estados.map((e) => ({
      id: e.id,
      paisId: e.paisId,
      nome: e.nome,
      sigla: e.sigla,
      ativo: e.ativo,
      cidades: e.cidades.map((c) => ({
        id: c.id,
        estadoId: c.estadoId,
        nome: c.nome,
        ativo: c.ativo,
        escolas: c.escolas,
      })),
    })),
  }))
}

export async function listEscolas(): Promise<EscolaData[]> {
  // Expõe contatos de parceiros (e-mail/telefone) — restrito a DIRECAO (usado só em /configuracoes).
  if (await requireDirecao()) return []
  const escolas = await prisma.escola.findMany({
    include: {
      cidade: { select: { nome: true, estado: { select: { nome: true, pais: { select: { nome: true, bandeira: true } } } } } },
      contatos: true,
      etapaTemplates: {
        include: { campos: { orderBy: { ordem: 'asc' } } },
        orderBy: { numero: 'asc' },
      },
    },
    orderBy: { nome: 'asc' },
  })
  return escolas.map((e) => ({
    id: e.id,
    cidadeId: e.cidadeId,
    cidadeNome: e.cidade.nome,
    estadoNome: e.cidade.estado.nome,
    paisNome: e.cidade.estado.pais.nome,
    paisBandeira: e.cidade.estado.pais.bandeira,
    nome: e.nome,
    tipo: e.tipo,
    endereco: e.endereco,
    website: e.website,
    regras: e.regras,
    documentos: (e.documentos as unknown as DocumentoItem[]) ?? [],
    ativo: e.ativo,
    contatos: e.contatos.map((c) => ({ id: c.id, nome: c.nome, cargo: c.cargo ?? '', email: c.email ?? '', telefone: c.telefone ?? '' })),
    etapaTemplates: e.etapaTemplates.map((et) => ({
      id: et.id,
      numero: et.numero,
      nome: et.nome,
      descricao: et.descricao,
      prazoDiasAntes: et.prazoDiasAntes,
      observacoes: et.observacoes,
      fase: et.fase,
      campos: et.campos.map((c) => ({
        id: c.id,
        nome: c.nome,
        tipo: c.tipo,
        obrigatorio: c.obrigatorio,
        placeholder: c.placeholder ?? '',
        opcoes: c.opcoes ?? '',
        ordem: c.ordem,
      })),
    })),
  }))
}

// ─── Pais CRUD ────────────────────────────────────────────────────────────────

export async function createPais(_prev: DestinoFormState, formData: FormData): Promise<DestinoFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const nome = (formData.get('nome') as string).trim()
  if (!nome) return { error: 'Nome é obrigatório.' }

  const bandeira = (formData.get('bandeira') as string)?.trim() || null
  const moeda = (formData.get('moeda') as string)?.trim() || null
  const idioma = (formData.get('idioma') as string)?.trim() || null
  const regrasImigracao = (formData.get('regrasImigracao') as string)?.trim() || null
  const observacoes = (formData.get('observacoes') as string)?.trim() || null
  const ativo = formData.get('ativo') !== 'false'

  let documentos: DocumentoItem[] = []
  try {
    const raw = formData.get('documentos') as string
    if (raw) documentos = JSON.parse(raw)
  } catch { /* empty array */ }

  await prisma.pais.create({ data: { nome, bandeira, moeda, idioma, regrasImigracao, documentos: documentos as object[], observacoes, ativo } })
  revalidatePath('/configuracoes')
  return { success: true }
}

export async function updatePais(_prev: DestinoFormState, formData: FormData): Promise<DestinoFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const id = formData.get('id') as string
  const nome = (formData.get('nome') as string).trim()
  if (!nome) return { error: 'Nome é obrigatório.' }

  const bandeira = (formData.get('bandeira') as string)?.trim() || null
  const moeda = (formData.get('moeda') as string)?.trim() || null
  const idioma = (formData.get('idioma') as string)?.trim() || null
  const regrasImigracao = (formData.get('regrasImigracao') as string)?.trim() || null
  const observacoes = (formData.get('observacoes') as string)?.trim() || null
  const ativo = formData.get('ativo') !== 'false'

  let documentos: DocumentoItem[] = []
  try {
    const raw = formData.get('documentos') as string
    if (raw) documentos = JSON.parse(raw)
  } catch { /* empty array */ }

  await prisma.pais.update({ where: { id }, data: { nome, bandeira, moeda, idioma, regrasImigracao, documentos: documentos as object[], observacoes, ativo } })
  revalidatePath('/configuracoes')
  return { success: true }
}

export async function deletePais(id: string): Promise<{ error?: string }> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const estadoCount = await prisma.estado.count({ where: { paisId: id } })
  if (estadoCount > 0) return { error: `Não é possível excluir: ${estadoCount} estado(s) vinculado(s).` }

  await prisma.pais.delete({ where: { id } })
  revalidatePath('/configuracoes')
  return {}
}

// ─── Estado CRUD ──────────────────────────────────────────────────────────────

export async function createEstado(_prev: DestinoFormState, formData: FormData): Promise<DestinoFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const paisId = formData.get('paisId') as string
  const nome = (formData.get('nome') as string).trim()
  if (!paisId) return { error: 'País é obrigatório.' }
  if (!nome) return { error: 'Nome é obrigatório.' }

  const sigla = (formData.get('sigla') as string)?.trim() || null
  const ativo = formData.get('ativo') !== 'false'

  await prisma.estado.create({ data: { paisId, nome, sigla, ativo } })
  revalidatePath('/configuracoes')
  return { success: true }
}

export async function updateEstado(_prev: DestinoFormState, formData: FormData): Promise<DestinoFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const id = formData.get('id') as string
  const nome = (formData.get('nome') as string).trim()
  if (!nome) return { error: 'Nome é obrigatório.' }

  const sigla = (formData.get('sigla') as string)?.trim() || null
  const ativo = formData.get('ativo') !== 'false'

  await prisma.estado.update({ where: { id }, data: { nome, sigla, ativo } })
  revalidatePath('/configuracoes')
  return { success: true }
}

export async function deleteEstado(id: string): Promise<{ error?: string }> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const cidadeCount = await prisma.cidade.count({ where: { estadoId: id } })
  if (cidadeCount > 0) return { error: `Não é possível excluir: ${cidadeCount} cidade(s) vinculada(s).` }

  await prisma.estado.delete({ where: { id } })
  revalidatePath('/configuracoes')
  return {}
}

// ─── Cidade CRUD ──────────────────────────────────────────────────────────────

export async function createCidade(_prev: DestinoFormState, formData: FormData): Promise<DestinoFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const estadoId = formData.get('estadoId') as string
  const nome = (formData.get('nome') as string).trim()
  if (!estadoId) return { error: 'Estado é obrigatório.' }
  if (!nome) return { error: 'Nome é obrigatório.' }

  const ativo = formData.get('ativo') !== 'false'

  await prisma.cidade.create({ data: { estadoId, nome, ativo } })
  revalidatePath('/configuracoes')
  return { success: true }
}

export async function updateCidade(_prev: DestinoFormState, formData: FormData): Promise<DestinoFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const id = formData.get('id') as string
  const nome = (formData.get('nome') as string).trim()
  if (!nome) return { error: 'Nome é obrigatório.' }

  const ativo = formData.get('ativo') !== 'false'

  await prisma.cidade.update({ where: { id }, data: { nome, ativo } })
  revalidatePath('/configuracoes')
  return { success: true }
}

export async function deleteCidade(id: string): Promise<{ error?: string }> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const escolaCount = await prisma.escola.count({ where: { cidadeId: id } })
  if (escolaCount > 0) return { error: `Não é possível excluir: ${escolaCount} escola(s) vinculada(s).` }

  await prisma.cidade.delete({ where: { id } })
  revalidatePath('/configuracoes')
  return {}
}

// ─── Escola CRUD ──────────────────────────────────────────────────────────────

export async function createEscola(_prev: DestinoFormState, formData: FormData): Promise<DestinoFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const cidadeId = formData.get('cidadeId') as string
  const nome = (formData.get('nome') as string).trim()
  if (!cidadeId) return { error: 'Cidade é obrigatória.' }
  if (!nome) return { error: 'Nome é obrigatório.' }

  const tipo = (formData.get('tipo') as EscolaTipo) || EscolaTipo.OUTRO
  const endereco = (formData.get('endereco') as string)?.trim() || null
  const website = (formData.get('website') as string)?.trim() || null
  const regras = (formData.get('regras') as string)?.trim() || null
  const ativo = formData.get('ativo') !== 'false'

  let documentos: DocumentoItem[] = []
  try {
    const raw = formData.get('documentos') as string
    if (raw) documentos = JSON.parse(raw)
  } catch { /* empty */ }

  let contatos: ContatoItem[] = []
  try {
    const raw = formData.get('contatos') as string
    if (raw) contatos = JSON.parse(raw)
  } catch { /* empty */ }

  const escola = await prisma.escola.create({
    data: { cidadeId, nome, tipo, endereco, website, regras, documentos: documentos as object[], ativo },
  })

  if (contatos.length > 0) {
    await prisma.escolaContato.createMany({
      data: contatos.filter((c) => c.nome).map((c) => ({ escolaId: escola.id, nome: c.nome, cargo: c.cargo || null, email: c.email || null, telefone: c.telefone || null })),
    })
  }

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function updateEscola(_prev: DestinoFormState, formData: FormData): Promise<DestinoFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const id = formData.get('id') as string
  const cidadeId = formData.get('cidadeId') as string
  const nome = (formData.get('nome') as string).trim()
  if (!nome) return { error: 'Nome é obrigatório.' }

  const tipo = (formData.get('tipo') as EscolaTipo) || EscolaTipo.OUTRO
  const endereco = (formData.get('endereco') as string)?.trim() || null
  const website = (formData.get('website') as string)?.trim() || null
  const regras = (formData.get('regras') as string)?.trim() || null
  const ativo = formData.get('ativo') !== 'false'

  let documentos: DocumentoItem[] = []
  try {
    const raw = formData.get('documentos') as string
    if (raw) documentos = JSON.parse(raw)
  } catch { /* empty */ }

  let contatos: ContatoItem[] = []
  try {
    const raw = formData.get('contatos') as string
    if (raw) contatos = JSON.parse(raw)
  } catch { /* empty */ }

  await prisma.$transaction([
    prisma.escola.update({ where: { id }, data: { cidadeId, nome, tipo, endereco, website, regras, documentos: documentos as object[], ativo } }),
    prisma.escolaContato.deleteMany({ where: { escolaId: id } }),
  ])

  if (contatos.length > 0) {
    await prisma.escolaContato.createMany({
      data: contatos.filter((c) => c.nome).map((c) => ({ escolaId: id, nome: c.nome, cargo: c.cargo || null, email: c.email || null, telefone: c.telefone || null })),
    })
  }

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function deleteEscola(id: string): Promise<{ error?: string }> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const count = await prisma.estudanteJornada.count({ where: { escolaId: id } })
  if (count > 0) return { error: `Não é possível excluir: ${count} jornada(s) vinculada(s).` }

  await prisma.escola.delete({ where: { id } })
  revalidatePath('/configuracoes')
  return {}
}

// ─── Etapa Template CRUD ──────────────────────────────────────────────────────

export async function createEtapaTemplate(_prev: DestinoFormState, formData: FormData): Promise<DestinoFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const escolaId = formData.get('escolaId') as string
  const nome = (formData.get('nome') as string).trim()
  if (!nome) return { error: 'Nome é obrigatório.' }

  const last = await prisma.jornadaEtapaTemplate.findFirst({ where: { escolaId }, orderBy: { numero: 'desc' }, select: { numero: true } })
  const numero = (last?.numero ?? 0) + 1
  const descricao = (formData.get('descricao') as string)?.trim() || null
  const prazoDiasAntesRaw = formData.get('prazoDiasAntes') as string
  const prazoDiasAntes = prazoDiasAntesRaw ? parseInt(prazoDiasAntesRaw) : null
  const observacoes = (formData.get('observacoes') as string)?.trim() || null
  const faseRaw = formData.get('fase') as string
  const fase = faseRaw === 'PREPARACAO_VIAGEM' ? 'PREPARACAO_VIAGEM' as const : 'FECHAMENTO_MATRICULA' as const

  let campos: CampoItem[] = []
  try {
    const raw = formData.get('campos') as string
    if (raw) campos = JSON.parse(raw)
  } catch { /* empty */ }

  const etapa = await prisma.jornadaEtapaTemplate.create({ data: { escolaId, numero, nome, descricao, prazoDiasAntes, observacoes, fase } })

  if (campos.length > 0) {
    await prisma.jornadaCampoTemplate.createMany({
      data: campos.map((c, i) => ({ etapaId: etapa.id, nome: c.nome, tipo: c.tipo, obrigatorio: c.obrigatorio, placeholder: c.placeholder || null, opcoes: c.opcoes || null, ordem: i })),
    })
  }

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function updateEtapaTemplate(_prev: DestinoFormState, formData: FormData): Promise<DestinoFormState> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const id = formData.get('id') as string
  const nome = (formData.get('nome') as string).trim()
  if (!nome) return { error: 'Nome é obrigatório.' }

  const descricao = (formData.get('descricao') as string)?.trim() || null
  const prazoDiasAntesRaw = formData.get('prazoDiasAntes') as string
  const prazoDiasAntes = prazoDiasAntesRaw ? parseInt(prazoDiasAntesRaw) : null
  const observacoes = (formData.get('observacoes') as string)?.trim() || null
  const faseRaw = formData.get('fase') as string
  const fase = faseRaw === 'PREPARACAO_VIAGEM' ? 'PREPARACAO_VIAGEM' as const : 'FECHAMENTO_MATRICULA' as const

  let campos: CampoItem[] = []
  try {
    const raw = formData.get('campos') as string
    if (raw) campos = JSON.parse(raw)
  } catch { /* empty */ }

  await prisma.$transaction([
    prisma.jornadaEtapaTemplate.update({ where: { id }, data: { nome, descricao, prazoDiasAntes, observacoes, fase } }),
    prisma.jornadaCampoTemplate.deleteMany({ where: { etapaId: id } }),
  ])

  if (campos.length > 0) {
    await prisma.jornadaCampoTemplate.createMany({
      data: campos.map((c, i) => ({ etapaId: id, nome: c.nome, tipo: c.tipo, obrigatorio: c.obrigatorio, placeholder: c.placeholder || null, opcoes: c.opcoes || null, ordem: i })),
    })
  }

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function deleteEtapaTemplate(id: string): Promise<{ error?: string }> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  const count = await prisma.estudanteJornadaEtapa.count({ where: { etapaTemplateId: id } })
  if (count > 0) return { error: `Não é possível excluir: ${count} etapa(s) de estudante vinculada(s).` }

  await prisma.jornadaEtapaTemplate.delete({ where: { id } })
  revalidatePath('/configuracoes')
  return {}
}

export async function reorderEtapaTemplates(ids: string[]): Promise<{ error?: string }> {
  const authErr = await requireDirecao()
  if (authErr) return { error: authErr }

  await prisma.$transaction(ids.map((id, index) => prisma.jornadaEtapaTemplate.update({ where: { id }, data: { numero: index + 1 } })))
  revalidatePath('/configuracoes')
  return {}
}
