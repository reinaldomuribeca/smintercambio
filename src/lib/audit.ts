import { prisma } from '@/lib/prisma'

type AuditInput = {
  entidade: string // ex.: 'Financeiro', 'Lead'
  entidadeId: string
  acao: string // ex.: 'upsert', 'mover_funil', 'reatribuir'
  autorId: string
  diff?: Record<string, unknown> // deve ser JSON-serializável (sem Date/Decimal crus)
}

/**
 * Registra uma entrada na trilha de auditoria (tabela audit_logs).
 * Best-effort: NUNCA lança — uma falha ao auditar não pode derrubar a operação
 * de negócio. Apenas loga o erro no servidor.
 */
export async function logAudit(entry: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entidade: entry.entidade,
        entidadeId: entry.entidadeId,
        acao: entry.acao,
        autorId: entry.autorId,
        diff: (entry.diff ?? {}) as object,
      },
    })
  } catch (err) {
    console.error('[audit] falha ao registrar log:', err)
  }
}
