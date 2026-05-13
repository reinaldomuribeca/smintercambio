'use client'

import { useState, useActionState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Plus, Pencil, Trash2, GripVertical, X, Globe, Building2, MapPin, Map } from 'lucide-react'
import {
  createPais, updatePais, deletePais,
  createEstado, updateEstado, deleteEstado,
  createCidade, updateCidade, deleteCidade,
  createEscola, updateEscola, deleteEscola,
  createEtapaTemplate, updateEtapaTemplate, deleteEtapaTemplate,
  reorderEtapaTemplates,
  type PaisData, type EstadoData, type CidadeData, type EscolaData,
  type EtapaTemplateData, type DocumentoItem, type ContatoItem, type CampoItem,
  type DestinoFormState,
} from '@/lib/actions/destinos'
import { EscolaTipo, CampoTipo } from '@prisma/client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESCOLA_TIPO_LABEL: Record<EscolaTipo, string> = {
  PUBLICA: 'Pública', PRIVADA: 'Privada', UNIVERSIDADE: 'Universidade', IDIOMAS: 'Idiomas', OUTRO: 'Outro',
}

const CAMPO_TIPO_LABEL: Record<CampoTipo, string> = {
  TEXTO: 'Texto', DATA: 'Data', BOOLEAN: 'Sim/Não', ARQUIVO: 'Upload', LINK: 'Link', SELECT: 'Seleção', NUMERO: 'Número', TEXTO_LONGO: 'Texto longo',
}

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-800 disabled:opacity-60">
      {pending ? 'Salvando…' : label}
    </button>
  )
}

const INPUT = 'w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
const LABEL = 'mb-1 block text-xs font-medium text-stone-600'

// ─── Shared sub-components ────────────────────────────────────────────────────

function DocumentoEditor({ value, onChange }: { value: DocumentoItem[]; onChange: (v: DocumentoItem[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((doc, i) => (
        <div key={i} className="flex gap-2 rounded-lg border border-cream-200 p-2">
          <input className={INPUT + ' flex-1'} placeholder="Nome do documento" value={doc.nome} onChange={(e) => { const n = [...value]; n[i] = { ...doc, nome: e.target.value }; onChange(n) }} />
          <input className={INPUT + ' flex-1'} placeholder="Descrição" value={doc.descricao} onChange={(e) => { const n = [...value]; n[i] = { ...doc, descricao: e.target.value }; onChange(n) }} />
          <label className="flex items-center gap-1 text-xs text-stone-500">
            <input type="checkbox" checked={doc.obrigatorio} onChange={(e) => { const n = [...value]; n[i] = { ...doc, obrigatorio: e.target.checked }; onChange(n) }} />
            Obrig.
          </label>
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}><X className="size-4 text-stone-400 hover:text-red-500" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { nome: '', descricao: '', obrigatorio: false }])}
        className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700">
        <Plus className="size-3.5" /> Adicionar documento
      </button>
    </div>
  )
}

function ContatoEditor({ value, onChange }: { value: ContatoItem[]; onChange: (v: ContatoItem[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((c, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-cream-200 p-2">
          <input className={INPUT} placeholder="Nome" value={c.nome} onChange={(e) => { const n = [...value]; n[i] = { ...c, nome: e.target.value }; onChange(n) }} />
          <input className={INPUT} placeholder="Cargo" value={c.cargo} onChange={(e) => { const n = [...value]; n[i] = { ...c, cargo: e.target.value }; onChange(n) }} />
          <input className={INPUT} placeholder="E-mail" value={c.email} onChange={(e) => { const n = [...value]; n[i] = { ...c, email: e.target.value }; onChange(n) }} />
          <div className="flex gap-1">
            <input className={INPUT + ' flex-1'} placeholder="Telefone/WhatsApp" value={c.telefone} onChange={(e) => { const n = [...value]; n[i] = { ...c, telefone: e.target.value }; onChange(n) }} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}><X className="size-4 text-stone-400 hover:text-red-500" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { nome: '', cargo: '', email: '', telefone: '' }])}
        className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700">
        <Plus className="size-3.5" /> Adicionar contato
      </button>
    </div>
  )
}

function CampoEditor({ value, onChange }: { value: CampoItem[]; onChange: (v: CampoItem[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((c, i) => (
        <div key={i} className="rounded-lg border border-cream-200 p-2 space-y-2">
          <div className="flex gap-2">
            <input className={INPUT + ' flex-1'} placeholder="Nome do campo" value={c.nome} onChange={(e) => { const n = [...value]; n[i] = { ...c, nome: e.target.value }; onChange(n) }} />
            <select className={INPUT} value={c.tipo} onChange={(e) => { const n = [...value]; n[i] = { ...c, tipo: e.target.value as CampoTipo }; onChange(n) }}>
              {Object.entries(CAMPO_TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <label className="flex items-center gap-1 text-xs text-stone-500 whitespace-nowrap">
              <input type="checkbox" checked={c.obrigatorio} onChange={(e) => { const n = [...value]; n[i] = { ...c, obrigatorio: e.target.checked }; onChange(n) }} />
              Obrig.
            </label>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}><X className="size-4 text-stone-400 hover:text-red-500" /></button>
          </div>
          <input className={INPUT} placeholder="Placeholder / instrução" value={c.placeholder} onChange={(e) => { const n = [...value]; n[i] = { ...c, placeholder: e.target.value }; onChange(n) }} />
          {c.tipo === 'SELECT' && (
            <input className={INPUT} placeholder="Opções separadas por vírgula" value={c.opcoes} onChange={(e) => { const n = [...value]; n[i] = { ...c, opcoes: e.target.value }; onChange(n) }} />
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { nome: '', tipo: CampoTipo.TEXTO, obrigatorio: false, placeholder: '', opcoes: '', ordem: value.length }])}
        className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700">
        <Plus className="size-3.5" /> Adicionar campo
      </button>
    </div>
  )
}

// ─── PaisDialog ───────────────────────────────────────────────────────────────

function PaisDialog({ pais, onClose }: { pais: PaisData | null; onClose: () => void }) {
  const isEdit = !!pais
  const action = isEdit ? updatePais : createPais
  const [state, formAction] = useActionState(action, null)
  const [documentos, setDocumentos] = useState<DocumentoItem[]>(pais?.documentos ?? [])
  const hasSubmitted = useRef(false)

  useEffect(() => {
    if (hasSubmitted.current && state?.success) { hasSubmitted.current = false; onClose() }
  }, [state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">{isEdit ? 'Editar País' : 'Novo País'}</h2>
          <button onClick={onClose}><X className="size-5 text-stone-400" /></button>
        </div>
        <form action={formAction} onSubmit={() => { hasSubmitted.current = true }} className="space-y-4 p-5">
          {isEdit && <input type="hidden" name="id" value={pais.id} />}
          {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={LABEL}>Nome do país *</label>
              <input name="nome" defaultValue={pais?.nome} required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Bandeira (emoji ou URL)</label>
              <input name="bandeira" defaultValue={pais?.bandeira ?? ''} placeholder="🇺🇸 ou https://…" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Moeda</label>
              <input name="moeda" defaultValue={pais?.moeda ?? ''} placeholder="USD" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Idioma principal</label>
              <input name="idioma" defaultValue={pais?.idioma ?? ''} placeholder="Inglês" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select name="ativo" defaultValue={pais?.ativo !== false ? 'true' : 'false'} className={INPUT}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Regras de imigração</label>
              <textarea name="regrasImigracao" defaultValue={pais?.regrasImigracao ?? ''} rows={3} className={INPUT + ' resize-none'} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Observações gerais</label>
              <textarea name="observacoes" defaultValue={pais?.observacoes ?? ''} rows={2} className={INPUT + ' resize-none'} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Documentos obrigatórios do país</label>
            <DocumentoEditor value={documentos} onChange={setDocumentos} />
            <input type="hidden" name="documentos" value={JSON.stringify(documentos)} />
          </div>
          <div className="flex justify-end gap-2 border-t border-cream-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-cream-200 px-4 py-2 text-sm text-stone-600 hover:bg-cream-50">Cancelar</button>
            <SubmitBtn label={isEdit ? 'Salvar' : 'Criar País'} />
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── EstadoDialog ─────────────────────────────────────────────────────────────

function EstadoDialog({ estado, paises, defaultPaisId, onClose }: { estado: EstadoData | null; paises: PaisData[]; defaultPaisId?: string; onClose: () => void }) {
  const isEdit = !!estado
  const action = isEdit ? updateEstado : createEstado
  const [state, formAction] = useActionState(action, null)
  const hasSubmitted = useRef(false)

  useEffect(() => {
    if (hasSubmitted.current && state?.success) { hasSubmitted.current = false; onClose() }
  }, [state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-y-auto max-h-[90vh] rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">{isEdit ? 'Editar Estado' : 'Novo Estado'}</h2>
          <button onClick={onClose}><X className="size-5 text-stone-400" /></button>
        </div>
        <form action={formAction} onSubmit={() => { hasSubmitted.current = true }} className="space-y-4 p-5">
          {isEdit && <input type="hidden" name="id" value={estado.id} />}
          {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
          {!isEdit && (
            <div>
              <label className={LABEL}>País *</label>
              <select name="paisId" defaultValue={defaultPaisId ?? ''} required className={INPUT}>
                <option value="">Selecione…</option>
                {paises.map((p) => <option key={p.id} value={p.id}>{p.bandeira && p.bandeira.length <= 4 ? p.bandeira + ' ' : ''}{p.nome}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={LABEL}>Nome do estado *</label>
              <input name="nome" defaultValue={estado?.nome} required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Sigla</label>
              <input name="sigla" defaultValue={estado?.sigla ?? ''} placeholder="CA" maxLength={5} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select name="ativo" defaultValue={estado?.ativo !== false ? 'true' : 'false'} className={INPUT}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-cream-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-cream-200 px-4 py-2 text-sm text-stone-600 hover:bg-cream-50">Cancelar</button>
            <SubmitBtn label={isEdit ? 'Salvar' : 'Criar Estado'} />
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── CidadeDialog ─────────────────────────────────────────────────────────────

function CidadeDialog({ cidade, paises, defaultEstadoId, onClose }: { cidade: CidadeData | null; paises: PaisData[]; defaultEstadoId?: string; onClose: () => void }) {
  const isEdit = !!cidade
  const action = isEdit ? updateCidade : createCidade
  const [state, formAction] = useActionState(action, null)
  const hasSubmitted = useRef(false)
  const [selectedPaisId, setSelectedPaisId] = useState(() => {
    if (defaultEstadoId) {
      for (const p of paises) {
        if (p.estados.some((e) => e.id === defaultEstadoId)) return p.id
      }
    }
    return ''
  })
  const [selectedEstadoId, setSelectedEstadoId] = useState(defaultEstadoId ?? '')

  const estadosDoPais = paises.find((p) => p.id === selectedPaisId)?.estados ?? []

  useEffect(() => {
    if (hasSubmitted.current && state?.success) { hasSubmitted.current = false; onClose() }
  }, [state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-y-auto max-h-[90vh] rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">{isEdit ? 'Editar Cidade' : 'Nova Cidade'}</h2>
          <button onClick={onClose}><X className="size-5 text-stone-400" /></button>
        </div>
        <form action={formAction} onSubmit={() => { hasSubmitted.current = true }} className="space-y-4 p-5">
          {isEdit && <input type="hidden" name="id" value={cidade.id} />}
          {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
          {!isEdit && (
            <>
              <div>
                <label className={LABEL}>País *</label>
                <select value={selectedPaisId} onChange={(e) => { setSelectedPaisId(e.target.value); setSelectedEstadoId('') }} required className={INPUT}>
                  <option value="">Selecione…</option>
                  {paises.map((p) => <option key={p.id} value={p.id}>{p.bandeira && p.bandeira.length <= 4 ? p.bandeira + ' ' : ''}{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Estado *</label>
                <select name="estadoId" value={selectedEstadoId} onChange={(e) => setSelectedEstadoId(e.target.value)} required disabled={!selectedPaisId} className={INPUT + (!selectedPaisId ? ' opacity-50 cursor-not-allowed' : '')}>
                  <option value="">{selectedPaisId ? 'Selecione…' : 'Selecione o país primeiro'}</option>
                  {estadosDoPais.map((e) => <option key={e.id} value={e.id}>{e.nome}{e.sigla ? ` (${e.sigla})` : ''}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={LABEL}>Nome da cidade *</label>
              <input name="nome" defaultValue={cidade?.nome} required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select name="ativo" defaultValue={cidade?.ativo !== false ? 'true' : 'false'} className={INPUT}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-cream-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-cream-200 px-4 py-2 text-sm text-stone-600 hover:bg-cream-50">Cancelar</button>
            <SubmitBtn label={isEdit ? 'Salvar' : 'Criar Cidade'} />
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── EtapaDialog ─────────────────────────────────────────────────────────────

function EtapaDialog({ etapa, escolaId, onClose }: { etapa: EtapaTemplateData | null; escolaId: string; onClose: () => void }) {
  const isEdit = !!etapa
  const action = isEdit ? updateEtapaTemplate : createEtapaTemplate
  const [state, formAction] = useActionState(action, null)
  const [campos, setCampos] = useState<CampoItem[]>(etapa?.campos ?? [])
  const hasSubmitted = useRef(false)

  useEffect(() => {
    if (hasSubmitted.current && state?.success) { hasSubmitted.current = false; onClose() }
  }, [state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">{isEdit ? `Editar ${etapa.nome}` : 'Nova Etapa'}</h2>
          <button onClick={onClose}><X className="size-5 text-stone-400" /></button>
        </div>
        <form action={formAction} onSubmit={() => { hasSubmitted.current = true }} className="space-y-4 p-5">
          {isEdit ? <input type="hidden" name="id" value={etapa.id} /> : <input type="hidden" name="escolaId" value={escolaId} />}
          {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={LABEL}>Nome da etapa *</label>
              <input name="nome" defaultValue={etapa?.nome} required className={INPUT} placeholder="Ex: Step 1 – Processo de Visto" />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Jornada *</label>
              <div className="flex gap-4">
                {[
                  { value: 'FECHAMENTO_MATRICULA', label: 'Fechamento e Matrícula' },
                  { value: 'PREPARACAO_VIAGEM',    label: 'Preparação da Viagem' },
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                    <input type="radio" name="fase" value={value}
                      defaultChecked={(etapa?.fase ?? 'FECHAMENTO_MATRICULA') === value}
                      className="accent-amber-500" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Prazo (dias antes do embarque)</label>
              <input name="prazoDiasAntes" type="number" defaultValue={etapa?.prazoDiasAntes ?? ''} className={INPUT} placeholder="60" />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Descrição / instruções para o consultor</label>
              <textarea name="descricao" defaultValue={etapa?.descricao ?? ''} rows={3} className={INPUT + ' resize-none'} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Observações internas</label>
              <textarea name="observacoes" defaultValue={etapa?.observacoes ?? ''} rows={2} className={INPUT + ' resize-none'} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Campos da etapa</label>
            <CampoEditor value={campos} onChange={setCampos} />
            <input type="hidden" name="campos" value={JSON.stringify(campos)} />
          </div>
          <div className="flex justify-end gap-2 border-t border-cream-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-cream-200 px-4 py-2 text-sm text-stone-600 hover:bg-cream-50">Cancelar</button>
            <SubmitBtn label={isEdit ? 'Salvar Etapa' : 'Criar Etapa'} />
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── EscolaDialog ────────────────────────────────────────────────────────────

function EscolaDialog({ escola, paises, onClose, onManageEtapas }: { escola: EscolaData | null; paises: PaisData[]; onClose: () => void; onManageEtapas?: (e: EscolaData) => void }) {
  const isEdit = !!escola
  const action = isEdit ? updateEscola : createEscola
  const [state, formAction] = useActionState(action, null)
  const [documentos, setDocumentos] = useState<DocumentoItem[]>(escola?.documentos ?? [])
  const [contatos, setContatos] = useState<ContatoItem[]>(escola?.contatos ?? [])
  const hasSubmitted = useRef(false)

  const [selectedPaisId, setSelectedPaisId] = useState(() => {
    if (!escola) return ''
    for (const p of paises) {
      for (const e of p.estados) {
        if (e.cidades.some((c) => c.id === escola.cidadeId)) return p.id
      }
    }
    return ''
  })
  const [selectedEstadoId, setSelectedEstadoId] = useState(() => {
    if (!escola) return ''
    for (const p of paises) {
      for (const e of p.estados) {
        if (e.cidades.some((c) => c.id === escola.cidadeId)) return e.id
      }
    }
    return ''
  })
  const [selectedCidadeId, setSelectedCidadeId] = useState(escola?.cidadeId ?? '')

  const estadosDoPais = paises.find((p) => p.id === selectedPaisId)?.estados ?? []
  const cidadesDoEstado = estadosDoPais.find((e) => e.id === selectedEstadoId)?.cidades ?? []

  useEffect(() => {
    if (hasSubmitted.current && state?.success) { hasSubmitted.current = false; onClose() }
  }, [state, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">{isEdit ? `Editar ${escola.nome}` : 'Nova Escola'}</h2>
          <div className="flex items-center gap-2">
            {isEdit && onManageEtapas && (
              <button type="button" onClick={() => { onClose(); onManageEtapas(escola) }}
                className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">
                Configurar Etapas
              </button>
            )}
            <button onClick={onClose}><X className="size-5 text-stone-400" /></button>
          </div>
        </div>
        <form action={formAction} onSubmit={() => { hasSubmitted.current = true }} className="space-y-4 p-5">
          {isEdit && <input type="hidden" name="id" value={escola.id} />}
          {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>País *</label>
              <select value={selectedPaisId} onChange={(e) => { setSelectedPaisId(e.target.value); setSelectedEstadoId(''); setSelectedCidadeId('') }} required className={INPUT}>
                <option value="">Selecione…</option>
                {paises.map((p) => <option key={p.id} value={p.id}>{p.bandeira && p.bandeira.length <= 4 ? p.bandeira + ' ' : ''}{p.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Estado *</label>
              <select value={selectedEstadoId} onChange={(e) => { setSelectedEstadoId(e.target.value); setSelectedCidadeId('') }} required disabled={!selectedPaisId} className={INPUT + (!selectedPaisId ? ' opacity-50 cursor-not-allowed' : '')}>
                <option value="">{selectedPaisId ? 'Selecione…' : 'Selecione o país primeiro'}</option>
                {estadosDoPais.map((e) => <option key={e.id} value={e.id}>{e.nome}{e.sigla ? ` (${e.sigla})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Cidade *</label>
              <select name="cidadeId" value={selectedCidadeId} onChange={(e) => setSelectedCidadeId(e.target.value)} required disabled={!selectedEstadoId} className={INPUT + (!selectedEstadoId ? ' opacity-50 cursor-not-allowed' : '')}>
                <option value="">{selectedEstadoId ? 'Selecione…' : 'Selecione o estado primeiro'}</option>
                {cidadesDoEstado.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Tipo</label>
              <select name="tipo" defaultValue={escola?.tipo ?? EscolaTipo.OUTRO} className={INPUT}>
                {Object.entries(ESCOLA_TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Nome da escola *</label>
              <input name="nome" defaultValue={escola?.nome} required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select name="ativo" defaultValue={escola?.ativo !== false ? 'true' : 'false'} className={INPUT}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Endereço</label>
              <input name="endereco" defaultValue={escola?.endereco ?? ''} className={INPUT} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Website</label>
              <input name="website" type="url" defaultValue={escola?.website ?? ''} placeholder="https://…" className={INPUT} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Regras da escola (curfew, dress code, celular, etc.)</label>
              <textarea name="regras" defaultValue={escola?.regras ?? ''} rows={4} className={INPUT + ' resize-none'} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Contatos da escola</label>
            <ContatoEditor value={contatos} onChange={setContatos} />
            <input type="hidden" name="contatos" value={JSON.stringify(contatos)} />
          </div>
          <div>
            <label className={LABEL}>Documentos obrigatórios</label>
            <DocumentoEditor value={documentos} onChange={setDocumentos} />
            <input type="hidden" name="documentos" value={JSON.stringify(documentos)} />
          </div>
          <div className="flex justify-end gap-2 border-t border-cream-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-cream-200 px-4 py-2 text-sm text-stone-600 hover:bg-cream-50">Cancelar</button>
            <SubmitBtn label={isEdit ? 'Salvar' : 'Criar Escola'} />
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── EtapasManagerDialog ──────────────────────────────────────────────────────

function EtapasManagerDialog({ escola, onClose }: { escola: EscolaData; onClose: () => void }) {
  const [editingEtapa, setEditingEtapa] = useState<EtapaTemplateData | null | 'new'>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  async function handleDelete(id: string) {
    setDeleteError('')
    const result = await deleteEtapaTemplate(id)
    if (result.error) { setDeleteError(result.error); return }
    setDeletingId(null)
  }

  if (editingEtapa !== undefined) {
    return (
      <EtapaDialog
        etapa={editingEtapa === 'new' ? null : editingEtapa}
        escolaId={escola.id}
        onClose={() => setEditingEtapa(undefined)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-y-auto max-h-[90vh] rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-semibold text-stone-900">Etapas da Jornada — {escola.nome}</h2>
          <button onClick={onClose}><X className="size-5 text-stone-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          {deleteError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>}
          {escola.etapaTemplates.length === 0 && (
            <p className="py-8 text-center text-sm text-stone-400">Nenhuma etapa configurada.</p>
          )}
          {escola.etapaTemplates.map((etapa) => (
            <div key={etapa.id} className="flex items-center gap-3 rounded-xl border border-cream-200 bg-white p-3">
              <GripVertical className="size-4 shrink-0 text-stone-300" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-stone-800">
                  <span className="mr-2 text-xs font-normal text-stone-400">#{etapa.numero}</span>
                  {etapa.nome}
                </p>
                <p className="text-xs text-stone-400">
                  <span className={`mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${etapa.fase === 'PREPARACAO_VIAGEM' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                    {etapa.fase === 'PREPARACAO_VIAGEM' ? 'Prep. Viagem' : 'Fechamento'}
                  </span>
                  {etapa.campos.length} campo(s){etapa.prazoDiasAntes ? ` · ${etapa.prazoDiasAntes} dias antes` : ''}
                </p>
              </div>
              {deletingId === etapa.id ? (
                <div className="flex gap-1">
                  <button onClick={() => handleDelete(etapa.id)} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Confirmar</button>
                  <button onClick={() => setDeletingId(null)} className="rounded px-2 py-1 text-xs text-stone-500 hover:bg-cream-50">Cancelar</button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <button onClick={() => setEditingEtapa(etapa)} className="rounded-lg p-1.5 hover:bg-cream-50"><Pencil className="size-3.5 text-stone-400" /></button>
                  <button onClick={() => setDeletingId(etapa.id)} className="rounded-lg p-1.5 hover:bg-red-50"><Trash2 className="size-3.5 text-stone-400 hover:text-red-500" /></button>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setEditingEtapa('new')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-300 py-3 text-sm font-medium text-stone-500 hover:border-amber-300 hover:text-amber-600">
            <Plus className="size-4" /> Nova Etapa
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TabPaises ────────────────────────────────────────────────────────────────

function TabPaises({ paises }: { paises: PaisData[] }) {
  const [dialog, setDialog] = useState<PaisData | null | 'new'>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  async function handleDelete(id: string) {
    setDeleteError('')
    const result = await deletePais(id)
    if (result.error) { setDeleteError(result.error); return }
    setDeletingId(null)
  }

  const totalEstados = paises.reduce((acc, p) => acc + p.estados.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{paises.length} país(es) · {totalEstados} estado(s) cadastrado(s)</p>
        <button onClick={() => setDialog('new')}
          className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800">
          <Plus className="size-4" /> Novo País
        </button>
      </div>

      {deleteError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>}

      <div className="space-y-2">
        {paises.map((pais) => {
          const totalCidades = pais.estados.reduce((a, e) => a + e.cidades.length, 0)
          return (
            <div key={pais.id} className="rounded-xl border border-cream-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl leading-none">{pais.bandeira && pais.bandeira.length <= 4 ? pais.bandeira : '🌐'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-stone-900">{pais.nome}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${pais.ativo ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                      {pais.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {[pais.idioma, pais.moeda].filter(Boolean).join(' · ')}
                    {pais.estados.length > 0 && ` · ${pais.estados.length} estado(s) · ${totalCidades} cidade(s)`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setDialog(pais)} className="rounded-lg p-1.5 hover:bg-cream-50"><Pencil className="size-4 text-stone-400" /></button>
                  {deletingId === pais.id ? (
                    <>
                      <button onClick={() => handleDelete(pais.id)} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Confirmar</button>
                      <button onClick={() => setDeletingId(null)} className="rounded px-2 py-1 text-xs text-stone-500 hover:bg-cream-50">Cancelar</button>
                    </>
                  ) : (
                    <button onClick={() => setDeletingId(pais.id)} className="rounded-lg p-1.5 hover:bg-red-50"><Trash2 className="size-4 text-stone-400 hover:text-red-500" /></button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {paises.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">Nenhum país cadastrado ainda.</p>
        )}
      </div>

      {dialog !== undefined && (
        <PaisDialog pais={dialog === 'new' ? null : dialog} onClose={() => setDialog(undefined)} />
      )}
    </div>
  )
}

// ─── TabEstados ───────────────────────────────────────────────────────────────

function TabEstados({ paises }: { paises: PaisData[] }) {
  const [filterPaisId, setFilterPaisId] = useState('')
  const [dialog, setDialog] = useState<{ estado: EstadoData | null; paisId?: string } | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const allEstados = paises.flatMap((p) => p.estados.map((e) => ({ ...e, paisNome: p.nome, paisBandeira: p.bandeira })))
  const filtered = filterPaisId ? allEstados.filter((e) => e.paisId === filterPaisId) : allEstados

  async function handleDelete(id: string) {
    setDeleteError('')
    const result = await deleteEstado(id)
    if (result.error) { setDeleteError(result.error); return }
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={filterPaisId} onChange={(e) => setFilterPaisId(e.target.value)} className="h-8 rounded-lg border border-cream-200 bg-white px-2.5 text-sm text-stone-700 outline-none focus:border-amber-500">
          <option value="">Todos os países</option>
          {paises.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <button onClick={() => setDialog({ estado: null, paisId: filterPaisId || undefined })}
          className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800">
          <Plus className="size-4" /> Novo Estado
        </button>
      </div>

      {deleteError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>}

      <div className="space-y-2">
        {filtered.map((estado) => (
          <div key={estado.id} className="rounded-xl border border-cream-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <Map className="mt-0.5 size-5 shrink-0 text-stone-300" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-stone-900">{estado.nome}{estado.sigla ? ` (${estado.sigla})` : ''}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${estado.ativo ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                    {estado.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {estado.paisBandeira && estado.paisBandeira.length <= 4 ? estado.paisBandeira + ' ' : ''}{estado.paisNome} · {estado.cidades.length} cidade(s)
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setDialog({ estado })} className="rounded-lg p-1.5 hover:bg-cream-50"><Pencil className="size-4 text-stone-400" /></button>
                {deletingId === estado.id ? (
                  <>
                    <button onClick={() => handleDelete(estado.id)} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Confirmar</button>
                    <button onClick={() => setDeletingId(null)} className="rounded px-2 py-1 text-xs text-stone-500 hover:bg-cream-50">Cancelar</button>
                  </>
                ) : (
                  <button onClick={() => setDeletingId(estado.id)} className="rounded-lg p-1.5 hover:bg-red-50"><Trash2 className="size-4 text-stone-400 hover:text-red-500" /></button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">Nenhum estado encontrado.</p>
        )}
      </div>

      {dialog !== undefined && (
        <EstadoDialog
          estado={dialog.estado}
          paises={paises}
          defaultPaisId={dialog.paisId}
          onClose={() => setDialog(undefined)}
        />
      )}
    </div>
  )
}

// ─── TabCidades ───────────────────────────────────────────────────────────────

function TabCidades({ paises }: { paises: PaisData[] }) {
  const [filterEstadoId, setFilterEstadoId] = useState('')
  const [filterPaisId, setFilterPaisId] = useState('')
  const [dialog, setDialog] = useState<{ cidade: CidadeData | null; estadoId?: string } | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const allCidades = paises.flatMap((p) =>
    p.estados.flatMap((e) =>
      e.cidades.map((c) => ({ ...c, estadoNome: e.nome, estadoSigla: e.sigla, paisNome: p.nome, paisBandeira: p.bandeira, paisId: p.id }))
    )
  )

  const estadosFiltrados = filterPaisId ? paises.find((p) => p.id === filterPaisId)?.estados ?? [] : paises.flatMap((p) => p.estados)

  const filtered = allCidades.filter((c) => {
    if (filterPaisId && c.paisId !== filterPaisId) return false
    if (filterEstadoId && c.estadoId !== filterEstadoId) return false
    return true
  })

  async function handleDelete(id: string) {
    setDeleteError('')
    const result = await deleteCidade(id)
    if (result.error) { setDeleteError(result.error); return }
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <select value={filterPaisId} onChange={(e) => { setFilterPaisId(e.target.value); setFilterEstadoId('') }} className="h-8 rounded-lg border border-cream-200 bg-white px-2.5 text-sm text-stone-700 outline-none focus:border-amber-500">
            <option value="">Todos os países</option>
            {paises.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <select value={filterEstadoId} onChange={(e) => setFilterEstadoId(e.target.value)} className="h-8 rounded-lg border border-cream-200 bg-white px-2.5 text-sm text-stone-700 outline-none focus:border-amber-500">
            <option value="">Todos os estados</option>
            {estadosFiltrados.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>
        <button onClick={() => setDialog({ cidade: null, estadoId: filterEstadoId || undefined })}
          className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800">
          <Plus className="size-4" /> Nova Cidade
        </button>
      </div>

      {deleteError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>}

      <div className="space-y-2">
        {filtered.map((cidade) => (
          <div key={cidade.id} className="rounded-xl border border-cream-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-stone-300" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-stone-900">{cidade.nome}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cidade.ativo ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                    {cidade.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {cidade.paisBandeira && cidade.paisBandeira.length <= 4 ? cidade.paisBandeira + ' ' : ''}{cidade.paisNome} · {cidade.estadoNome}{cidade.estadoSigla ? ` (${cidade.estadoSigla})` : ''} · {cidade.escolas.length} escola(s)
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setDialog({ cidade })} className="rounded-lg p-1.5 hover:bg-cream-50"><Pencil className="size-4 text-stone-400" /></button>
                {deletingId === cidade.id ? (
                  <>
                    <button onClick={() => handleDelete(cidade.id)} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Confirmar</button>
                    <button onClick={() => setDeletingId(null)} className="rounded px-2 py-1 text-xs text-stone-500 hover:bg-cream-50">Cancelar</button>
                  </>
                ) : (
                  <button onClick={() => setDeletingId(cidade.id)} className="rounded-lg p-1.5 hover:bg-red-50"><Trash2 className="size-4 text-stone-400 hover:text-red-500" /></button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">Nenhuma cidade encontrada.</p>
        )}
      </div>

      {dialog !== undefined && (
        <CidadeDialog
          cidade={dialog.cidade}
          paises={paises}
          defaultEstadoId={dialog.estadoId}
          onClose={() => setDialog(undefined)}
        />
      )}
    </div>
  )
}

// ─── TabEscolas ───────────────────────────────────────────────────────────────

function TabEscolas({ escolas, paises }: { escolas: EscolaData[]; paises: PaisData[] }) {
  const [filterPaisId, setFilterPaisId] = useState('')
  const [dialog, setDialog] = useState<EscolaData | null | 'new'>()
  const [etapasDialog, setEtapasDialog] = useState<EscolaData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const filtered = filterPaisId ? escolas.filter((e) => {
    for (const p of paises) {
      if (p.id !== filterPaisId) continue
      for (const est of p.estados) {
        if (est.cidades.some((c) => c.id === e.cidadeId)) return true
      }
    }
    return false
  }) : escolas

  async function handleDelete(id: string) {
    setDeleteError('')
    const result = await deleteEscola(id)
    if (result.error) { setDeleteError(result.error); return }
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={filterPaisId} onChange={(e) => setFilterPaisId(e.target.value)} className="h-8 rounded-lg border border-cream-200 bg-white px-2.5 text-sm text-stone-700 outline-none focus:border-amber-500">
          <option value="">Todos os países</option>
          {paises.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <button onClick={() => setDialog('new')}
          className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800">
          <Plus className="size-4" /> Nova Escola
        </button>
      </div>

      {deleteError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>}

      <div className="space-y-2">
        {filtered.map((escola) => (
          <div key={escola.id} className="rounded-xl border border-cream-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-5 shrink-0 text-stone-300" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-stone-900">{escola.nome}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${escola.ativo ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                    {escola.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">{ESCOLA_TIPO_LABEL[escola.tipo]}</span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {escola.paisBandeira && escola.paisBandeira.length <= 4 ? escola.paisBandeira + ' ' : ''}{escola.paisNome} · {escola.estadoNome} · {escola.cidadeNome} · {escola.etapaTemplates.length} etapa(s)
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEtapasDialog(escola)} className="rounded-lg px-2 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50">Etapas</button>
                <button onClick={() => setDialog(escola)} className="rounded-lg p-1.5 hover:bg-cream-50"><Pencil className="size-4 text-stone-400" /></button>
                {deletingId === escola.id ? (
                  <>
                    <button onClick={() => handleDelete(escola.id)} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Confirmar</button>
                    <button onClick={() => setDeletingId(null)} className="rounded px-2 py-1 text-xs text-stone-500">Cancelar</button>
                  </>
                ) : (
                  <button onClick={() => setDeletingId(escola.id)} className="rounded-lg p-1.5 hover:bg-red-50"><Trash2 className="size-4 text-stone-400 hover:text-red-500" /></button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">Nenhuma escola encontrada.</p>
        )}
      </div>

      {dialog !== undefined && (
        <EscolaDialog
          escola={dialog === 'new' ? null : dialog}
          paises={paises}
          onClose={() => setDialog(undefined)}
          onManageEtapas={(e) => setEtapasDialog(e)}
        />
      )}

      {etapasDialog && (
        <EtapasManagerDialog escola={etapasDialog} onClose={() => setEtapasDialog(null)} />
      )}
    </div>
  )
}

// ─── TabDestinos (main export) ────────────────────────────────────────────────

type SubTab = 'paises' | 'estados' | 'cidades' | 'escolas'

type Props = {
  paises: PaisData[]
  escolas: EscolaData[]
}

export function TabDestinos({ paises, escolas }: Props) {
  const [sub, setSub] = useState<SubTab>('paises')

  const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'paises',  label: 'Países',  icon: <Globe className="size-4" /> },
    { id: 'estados', label: 'Estados', icon: <Map className="size-4" /> },
    { id: 'cidades', label: 'Cidades', icon: <MapPin className="size-4" /> },
    { id: 'escolas', label: 'Escolas', icon: <Building2 className="size-4" /> },
  ]

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-lg bg-cream-100 p-1">
        {SUB_TABS.map((tab) => (
          <button key={tab.id} onClick={() => setSub(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${sub === tab.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      {sub === 'paises'  && <TabPaises  paises={paises} />}
      {sub === 'estados' && <TabEstados paises={paises} />}
      {sub === 'cidades' && <TabCidades paises={paises} />}
      {sub === 'escolas' && <TabEscolas escolas={escolas} paises={paises} />}
    </div>
  )
}

export type { PaisData, EscolaData }
