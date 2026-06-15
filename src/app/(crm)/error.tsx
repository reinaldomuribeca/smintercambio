'use client'

import { useEffect } from 'react'

export default function CrmError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Em produção, encaminhar para observabilidade (ex.: Sentry).
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-lg font-semibold text-stone-900">Algo deu errado</h2>
      <p className="max-w-md text-sm text-stone-500">
        Não foi possível carregar esta seção. Tente novamente — se o problema
        persistir, avise a equipe técnica.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
      >
        Tentar novamente
      </button>
    </div>
  )
}
