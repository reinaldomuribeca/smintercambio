import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const g = globalThis as unknown as { prisma?: PrismaClient }

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) {
    // DATABASE_URL não configurado (build sem env ou dev sem .env.local preenchido).
    // Retorna proxy que lança ao consultar — capturado pelo try/catch do layout.
    return new Proxy({} as PrismaClient, {
      get(_t, prop) {
        throw new Error(
          `DATABASE_URL não configurado. Configure .env.local antes de usar prisma.${String(prop)}.`,
        )
      },
    })
  }
  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = g.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') g.prisma = prisma
