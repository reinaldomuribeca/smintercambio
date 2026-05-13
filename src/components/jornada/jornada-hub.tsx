import Link from 'next/link'
import { ArrowLeft, Plane, FileCheck2, Luggage, Globe, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { JornadaHubData } from '@/lib/actions/jornada'

const JORNADAS = [
  {
    slug: 'fechamento',
    titulo: 'Fechamento e Matrícula',
    descricao: 'Documentação, aplicação, visto e confirmação de matrícula na escola.',
    icon: FileCheck2,
    cor: '#f59e0b',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    hover: 'hover:border-amber-400 hover:bg-amber-50/80',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    slug: 'preparacao',
    titulo: 'Preparação da Viagem',
    descricao: 'Passagens, acomodação, seguro, pré-embarque e orientações finais.',
    icon: Luggage,
    cor: '#3b82f6',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    hover: 'hover:border-blue-400 hover:bg-blue-50/80',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    slug: 'experiencia',
    titulo: 'Experiência em Curso',
    descricao: 'Acompanhamento durante o programa no exterior e suporte ao estudante.',
    icon: Globe,
    cor: '#8b5cf6',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    hover: 'hover:border-violet-400 hover:bg-violet-50/80',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
  },
]

export function JornadaHub({ jornada }: { jornada: JornadaHubData }) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-cream-200 bg-white px-6 py-4 sm:px-8">
        <Link href="/jornada" className="mb-3 inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600">
          <ArrowLeft className="size-3.5" /> Voltar para Jornadas
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl leading-none">
                {jornada.paisBandeira && jornada.paisBandeira.length <= 4 ? jornada.paisBandeira : '🌐'}
              </span>
              <h1 className="text-xl font-bold text-stone-900">{jornada.leadNome}</h1>
            </div>
            <p className="text-sm text-stone-500">
              {jornada.escolaNome} · {jornada.paisNome}
            </p>
            {(jornada.embarqueEm || jornada.retornoEm) && (
              <p className="mt-1 flex items-center gap-2 text-sm text-stone-500">
                <Plane className="size-4 text-amber-500" />
                {jornada.embarqueEm && format(new Date(jornada.embarqueEm), 'dd/MM/yyyy', { locale: ptBR })}
                {jornada.retornoEm && ` → ${format(new Date(jornada.retornoEm), 'dd/MM/yyyy', { locale: ptBR })}`}
              </p>
            )}
          </div>

          <Link href={`/leads/${jornada.leadId}`}
            className="text-xs text-stone-400 hover:text-amber-600 hover:underline">
            Ver ficha do estudante →
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="mb-8 text-center text-sm text-stone-400">Selecione a jornada que deseja acessar</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {JORNADAS.map(({ slug, titulo, descricao, icon: Icon, border, hover, iconBg, iconColor }) => {
              const concluido =
                slug === 'fechamento' ? jornada.fechamentoConcluido :
                slug === 'preparacao' ? jornada.preparacaoConcluida :
                jornada.experienciaConcluida

              return (
                <Link
                  key={slug}
                  href={`/jornada/${jornada.id}/${slug}`}
                  className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border-2 bg-white p-6 transition-all duration-150 shadow-sm ${
                    concluido
                      ? 'border-green-300 bg-green-50 hover:border-green-400 hover:bg-green-50/80'
                      : `${border} ${hover}`
                  }`}
                >
                  <div className={`flex size-12 items-center justify-center rounded-xl ${concluido ? 'bg-green-100' : iconBg}`}>
                    <Icon className={`size-6 ${concluido ? 'text-green-600' : iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-stone-900 mb-1">{titulo}</h2>
                    <p className="text-sm text-stone-500">{descricao}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="flex items-center gap-1 text-xs font-medium text-stone-400 group-hover:text-stone-600 transition-colors">
                      Acessar <ChevronRight className="size-3.5" />
                    </span>
                  </div>

                  {concluido && (
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute left-1/2 top-1/2 w-[200%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-green-500/40 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-green-900 shadow-md backdrop-blur-[1px]">
                        Etapa 100% Concluída
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
