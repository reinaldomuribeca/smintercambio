# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## O que é este projeto

CRM interno da **SM Intercâmbio**, agência de intercâmbio estudantil brasileira. Centraliza a jornada do lead desde o primeiro contato até matrícula, visto, embarque e pós-programa. **Não é SaaS** — uso exclusivo da equipe interna.

---

## Atenção: Next.js 16

Este projeto usa Next.js 16, que tem breaking changes em relação a versões anteriores. Antes de escrever qualquer código Next.js, consulte `node_modules/next/dist/docs/` para APIs atuais. Não assumir que convenções de Next.js 13/14/15 se aplicam.

---

## Comandos

```bash
# Desenvolvimento
npm run dev          # Next.js em localhost:3000
supabase start       # Banco local (requer Supabase CLI)
supabase stop

# Build / qualidade
npm run build
npm run lint

# Banco de dados
npx prisma migrate dev --name <nome>   # nova migration
npx prisma migrate deploy              # aplica em produção
npx prisma studio                      # GUI do banco
npx prisma generate                    # regenera client após mudar schema
```

Não há framework de testes no projeto — nenhum comando `test` existe.

---

## Stack

- **Next.js 16** — App Router, TypeScript, React 19
- **Supabase** — Auth (email/senha), PostgreSQL, Storage
- **Prisma ORM 7** — `prisma/schema.prisma` é o source of truth; configuração de migrations em `prisma.config.ts`
- **Tailwind CSS v4** — sem `tailwind.config.*`; tokens de design definidos via `@theme {}` em `src/app/globals.css`
- **Recharts** — gráficos no dashboard e relatórios
- **Resend** — envio de e-mails (hoje usado apenas no fluxo de fechamento de matrícula via `sendEmailFechamento`; alerta automático de tarefas/vencimentos ainda **não** implementado — não há cron/route handler)
- **@dnd-kit/core** — drag-and-drop do kanban do funil

---

## Arquitetura

### Convenções gerais

- Path alias `@/*` aponta para `src/*` — todos os imports usam `@/`
- Componentes de página são Server Components por padrão
- `'use client'` apenas para forms com estado local, drag-and-drop e charts (Recharts)
- Não existe `api/` — toda mutation passa por Server Action

### Fluxo de dados

```
Browser → Server Component → prisma (fetch direto)
Browser → Client Component → Server Action → prisma → DB
```

Server Actions ficam em `src/lib/actions/[modulo].ts` (ex: `leads.ts`, `financeiro.ts`). Erros retornam `{ error: string }` — nunca fazer throw para o cliente.

### Roteamento

Dois grupos de rotas no App Router:
- `src/app/(auth)/` — rotas públicas (login)
- `src/app/(crm)/` — rotas protegidas (dashboard, leads, funil, jornada, tarefas, relatorios, configuracoes). O módulo **jornada** cobre o pós-fechamento (fechamento de matrícula, preparação de viagem, experiência) — ver `src/lib/actions/{jornada,fechamento}.ts`.

### Middleware (proxy)

O middleware de autenticação fica em **`src/proxy.ts`** — não em `middleware.ts`. Essa é uma convenção específica do Next.js 16 neste projeto. Redireciona `/login` ↔ rotas protegidas com base na sessão Supabase.

### Clientes Supabase (`src/lib/supabase/`)

| Arquivo | Uso |
|---------|-----|
| `server.ts` | Server Components e Server Actions (SSR, lê cookies) |
| `client.ts` | Client Components (browser) |
| `admin.ts` | Operações administrativas com `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS) |

### Autenticação e autorização

**Atenção (realidade do projeto):** o Prisma conecta com role privilegiado via `DATABASE_URL`, que faz **bypass de RLS**. Logo, a verificação dentro do Server Action é a **única** barreira de autorização efetiva do app — as policies em `prisma/sql/add_checklist_templates_and_rls.sql` só protegeriam conexões diretas anon/user, que o app não faz. **Trate toda Server Action como única linha de defesa.**

Helpers compartilhados em `src/lib/auth.ts`:

```ts
const user = await getAuthUser()                          // exige sessão (redirect /login)
if (!(await canAccessLead(leadId, user))) return []       // ownership por role
```

Regras: toda action que recebe um `leadId` deve combinar `getAuthUser()` + `canAccessLead()`; erros retornam `{ error: string }` (nunca `throw` ao cliente).

### Prisma client (`src/lib/prisma.ts`)

Singleton com `@prisma/adapter-pg` — o adapter lê `DATABASE_URL` explicitamente via `connectionString` (não via variável de ambiente automática do Prisma). Se `DATABASE_URL` não estiver definido, o client retorna um Proxy que lança erro descritivo na primeira consulta.

```ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
return new PrismaClient({ adapter })
```

---

## Banco de dados

Schema completo em `prisma/schema.prisma`. Entidades principais:

| Entidade           | Relação        | Observação |
|--------------------|----------------|------------|
| User               | —              | Roles: DIRECAO, CONSULTOR, ADMINISTRATIVO, OPERACOES, FINANCEIRO; UUID sincronizado com Supabase Auth |
| Lead               | N:1 User       | Entidade central; carrega o status do funil |
| DiagnosticoSM      | 1:1 Lead       | Perfil, destino, budget, timing, riscos |
| Aplicacao          | 1:1 Lead       | Checklist de docs (JSON), offer, portal externo |
| Financeiro         | 1:1 Lead       | Tuition, comissões, pagamentos família (JSON), câmbio |
| Tarefa             | N:1 Lead+User  | Tipos: FOLLOWUP, DOCUMENTO, REUNIAO, ALERTA, OUTRO, FECHAMENTO |
| HistoricoInteracao | N:1 Lead+User  | Linha do tempo: reunião, mensagem, email, arquivo, nota |
| ChecklistTemplate  | —              | Templates de documentos por ObjetivoPrograma |

**IDs:** Users usam UUID (sync com Supabase Auth); demais entidades usam CUID.

**Módulo financeiro:** valores sempre na moeda original (USD, GBP…) + câmbio da data de fechamento. BRL = `valorOriginal * cambioUsado` — nunca armazenar BRL diretamente.

**Checklist de documentos** (campo JSON em `Aplicacao`):
```json
[{ "nome": "Passaporte", "obrigatorio": true, "status": "PENDENTE" }]
```
Status: `PENDENTE` | `ENVIADO` | `APROVADO`. Template pré-populado com base em `objetivoPrograma` do `DiagnosticoSM`.

---

## Funil comercial

| Macroetapa   | Cor          | Status incluídos |
|--------------|--------------|------------------|
| Lead         | Cinza        | NOVO_LEAD |
| Qualificação | Amarelo      | REUNIAO_AGENDADA, REUNIAO_REALIZADA, DIAGNOSTICO_CONCLUIDO |
| Proposta     | Laranja      | PROPOSTA_ENVIADA, FOLLOWUP_ESTRATEGICO, EM_DECISAO |
| Aplicação    | Azul claro   | EM_APLICACAO, DOCUMENTACAO_PENDENTE, APPLICATION_ENVIADA |
| Admissão     | Roxo         | ENTREVISTA_TESTE, ACEITO_PELA_ESCOLA, OFFER_ENVIADA |
| Financeiro   | Verde médio  | DEPOSIT_PAGO, TUITION_PARCIAL, TUITION_QUITADA |
| Matrícula    | Verde escuro | MATRICULADO, VISTO, EMBARQUE, EM_PROGRAMA |
| Perdido      | Vermelho     | SEM_RETORNO, SEM_BUDGET, FECHOU_CONCORRENTE, DESISTIU |

Mover para **Perdido** exige campo `motivo` preenchido antes de salvar.

---

## Controle de acesso

| Role           | Visualiza                       | Edita |
|----------------|---------------------------------|-------|
| DIRECAO        | Tudo                            | Tudo + configurações |
| CONSULTOR      | Leads onde é responsável        | Funil, diagnóstico, tarefas próprias |
| ADMINISTRATIVO | Financeiro de todos             | Financeiro |
| OPERACOES      | Aplicações de todos             | Aplicações, checklists |
| FINANCEIRO     | Leads onde tem tarefa atribuída | Financeiro, etapas de fechamento (jornada) |

---

## Regras de negócio automáticas

1. Lead criado → tarefa FOLLOWUP para o consultor responsável (prazo: 24h)
2. Movido para `PROPOSTA_ENVIADA` → tarefa FOLLOWUP estratégico (prazo: 3 dias úteis)
3. `offerRecebidaEm` preenchida → tarefa "Enviar offer à família" (prazo: 1 dia)
4. Documento adicionado ao checklist como PENDENTE → tarefa para o consultor responsável
5. Lead movido para Perdido → motivo obrigatório

---

## Ambiente

- **Dev local:** Next.js em `localhost:3000`, Supabase local via `supabase start`
- **Produção:** Coolify no VPS `187.127.6.119`

Variáveis de ambiente necessárias (`.env.local`):
```
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
AUTH_SECRET=
```

---

## Sprints

| Sprint | Foco | Status |
|--------|------|--------|
| 1 | Setup, Auth, layout base | — |
| 2 | CRUD leads, diagnóstico, funil (tabela + kanban) | — |
| 3 | Aplicações, financeiro, tarefas, histórico | — |
| 4 | Dashboard BI, relatórios, upload de documentos, permissões finais | — |
