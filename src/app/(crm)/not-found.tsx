import Link from 'next/link'

export default function CrmNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-lg font-semibold text-stone-900">Não encontrado</h2>
      <p className="max-w-md text-sm text-stone-500">
        O registro que você procura não existe ou você não tem acesso a ele.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
      >
        Voltar ao dashboard
      </Link>
    </div>
  )
}
