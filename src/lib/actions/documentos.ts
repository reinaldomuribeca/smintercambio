'use server'

import { getAuthUser, canAccessLead } from '@/lib/auth'
import { createSignedUploadUrl, createSignedDownloadUrl } from '@/lib/storage'

const SAFE_NAME = /[^a-zA-Z0-9._-]/g

/**
 * Gera uma URL assinada para o browser subir um documento de um lead direto ao
 * Supabase Storage (bucket privado). Checa sessão + ownership do lead.
 * O cliente faz o PUT no signedUrl e guarda o `path` retornado (ex.: no checklist
 * ou no HistoricoInteracao.arquivoUrl).
 */
export async function getDocumentoUploadUrl(
  leadId: string,
  filename: string,
): Promise<{ error?: string; path?: string; token?: string; signedUrl?: string }> {
  const user = await getAuthUser()
  if (!(await canAccessLead(leadId, user))) return { error: 'Sem permissão.' }

  const safe = filename.replace(SAFE_NAME, '_').slice(-100) || 'arquivo'
  const path = `leads/${leadId}/${Date.now()}-${safe}`
  const { data, error } = await createSignedUploadUrl(path)
  if (error || !data) return { error: 'Não foi possível preparar o upload.' }
  return { path: data.path, token: data.token, signedUrl: data.signedUrl }
}

/**
 * Gera uma URL assinada temporária para visualizar/baixar um documento do lead.
 * Confere que o path pertence ao lead (evita ler arquivo de outro lead via path forjado).
 */
export async function getDocumentoDownloadUrl(
  leadId: string,
  path: string,
): Promise<{ error?: string; url?: string }> {
  const user = await getAuthUser()
  if (!(await canAccessLead(leadId, user))) return { error: 'Sem permissão.' }
  if (!path.startsWith(`leads/${leadId}/`)) return { error: 'Documento inválido.' }

  const { data, error } = await createSignedDownloadUrl(path)
  if (error || !data) return { error: 'Não foi possível gerar o link.' }
  return { url: data.signedUrl }
}
