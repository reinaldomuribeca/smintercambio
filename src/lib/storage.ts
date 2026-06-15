import { supabaseAdmin } from '@/lib/supabase/admin'

// Bucket PRIVADO para documentos de leads. Crie no Supabase (Storage → New bucket,
// "documentos", privado) — acesso só via URLs assinadas geradas no servidor.
export const DOCS_BUCKET = 'documentos'

/** URL assinada para UPLOAD direto do browser (válida por poucos minutos). */
export async function createSignedUploadUrl(path: string) {
  return supabaseAdmin.storage.from(DOCS_BUCKET).createSignedUploadUrl(path)
}

/** URL assinada para DOWNLOAD/visualização temporária de um arquivo privado. */
export async function createSignedDownloadUrl(path: string, expiresIn = 60 * 60) {
  return supabaseAdmin.storage.from(DOCS_BUCKET).createSignedUrl(path, expiresIn)
}
