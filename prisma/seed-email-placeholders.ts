import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { DEFAULT_EMAIL_PLACEHOLDERS } from '../src/lib/email-placeholders-config'

// Seed FOCADO: popula apenas os placeholders de e-mail (tabela email_placeholders).
// Idempotente (upsert por tag) e NÃO mexe em funil/templates/usuários.
// Rodar: node --env-file=.env.local --import tsx prisma/seed-email-placeholders.ts
//   (ou:  npm run db:seed:emails  — exige DATABASE_URL no ambiente)

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL não configurado — defina antes de rodar o seed.')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

async function main() {
  for (const p of DEFAULT_EMAIL_PLACEHOLDERS) {
    await prisma.emailPlaceholder.upsert({
      where: { tag: p.tag },
      create: p,
      update: { label: p.label, campoSistema: p.campoSistema },
    })
  }
  console.log(`✓ ${DEFAULT_EMAIL_PLACEHOLDERS.length} placeholders de e-mail prontos para uso.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
