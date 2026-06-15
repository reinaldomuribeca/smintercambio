import crypto from 'node:crypto'

// Criptografia simétrica para credenciais sensíveis (ex.: portalLogin de portais
// de escolas). AES-256-GCM (autenticado). Chave em ENCRYPTION_KEY (base64 de 32
// bytes, ou hex de 64 chars). Gere com: openssl rand -base64 32

const ALGO = 'aes-256-gcm'
const PREFIX = 'enc:v1:'

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) return null
  const b64 = Buffer.from(raw, 'base64')
  if (b64.length === 32) return b64
  const hex = Buffer.from(raw, 'hex')
  if (hex.length === 32) return hex
  return null
}

/**
 * Cifra um texto. Retorna "enc:v1:<iv>:<tag>:<ciphertext>" (base64).
 * Sem ENCRYPTION_KEY configurada, retorna o texto original (degradação em dev) —
 * o decryptSecret é tolerante a valores em texto puro (dados legados).
 */
export function encryptSecret(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === '') return null
  const key = getKey()
  if (!key) return plaintext
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`
}

/**
 * Decifra um valor de encryptSecret. Tolerante: valores sem o prefixo são
 * tratados como texto puro legado (retornados como estão); falhas retornam null.
 */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (stored == null || stored === '') return null
  if (!stored.startsWith(PREFIX)) return stored // legado em texto puro
  const key = getKey()
  if (!key) return null
  try {
    const [, , ivB64, tagB64, ctB64] = stored.split(':')
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()])
    return pt.toString('utf8')
  } catch {
    return null
  }
}
