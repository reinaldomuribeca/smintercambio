export default function CrmLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-cream-200 border-t-navy-900"
        role="status"
        aria-label="Carregando"
      />
    </div>
  )
}
