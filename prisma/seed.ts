import { PrismaClient, type Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_FUNIL_ETAPAS } from '../src/lib/funil-etapas'
import { DEFAULT_CHECKLIST_TEMPLATES } from '../src/lib/checklist-templates'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL não configurado — defina antes de rodar o seed.')

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

async function seedFunilEtapas() {
  for (const e of DEFAULT_FUNIL_ETAPAS) {
    await prisma.funilEtapa.upsert({
      where: { slug: e.slug },
      create: e,
      update: { nome: e.nome, cor: e.cor, macroetapa: e.macroetapa, ordem: e.ordem, perdido: e.perdido },
    })
  }
  console.log(`✓ Funil: ${DEFAULT_FUNIL_ETAPAS.length} etapas`)
}

async function seedChecklistTemplates() {
  const objetivos = Object.keys(DEFAULT_CHECKLIST_TEMPLATES) as (keyof typeof DEFAULT_CHECKLIST_TEMPLATES)[]
  for (const objetivo of objetivos) {
    const documentos = DEFAULT_CHECKLIST_TEMPLATES[objetivo] as unknown as Prisma.InputJsonValue
    await prisma.checklistTemplate.upsert({
      where: { objetivoPrograma: objetivo },
      create: { objetivoPrograma: objetivo, documentos },
      update: { documentos },
    })
  }
  console.log(`✓ Checklist templates: ${objetivos.length}`)
}

// Cria o primeiro usuário DIRECAO (resolve o galinha-e-ovo: criar usuário exige DIRECAO).
// Cria também no Supabase Auth (mesmo id), senão o usuário não consegue logar.
async function seedDirecaoInicial() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  const nome = process.env.SEED_ADMIN_NOME ?? 'Direção'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!email || !password) {
    console.log('• DIRECAO inicial pulada (defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD para criar)')
    return
  }
  if (!supabaseUrl || !serviceKey) {
    console.log('• DIRECAO inicial pulada (faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`• DIRECAO inicial já existe (${email})`)
    return
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário no Supabase Auth: ${error?.message ?? 'desconhecido'}`)
  }

  await prisma.user.create({
    data: { id: data.user.id, email, nome, role: 'DIRECAO', ativo: true },
  })
  console.log(`✓ DIRECAO inicial criada: ${email}`)
}

async function main() {
  await seedFunilEtapas()
  await seedChecklistTemplates()
  await seedDirecaoInicial()
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
