import Image from 'next/image'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — identidade da marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 px-12 py-14 lg:flex lg:w-[44%]">
        {/* Textura de fundo sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Círculos decorativos */}
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full border border-white/5" />
        <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 size-64 rounded-full border border-white/5" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 size-[28rem] rounded-full border border-white/5" />

        {/* Logo */}
        <div>
          <Image
            src="/sm-logo.png"
            alt="SM Intercâmbio"
            width={220}
            height={56}
            className="object-contain brightness-0 invert"
            priority
          />
        </div>

        {/* Texto central */}
        <div className="space-y-4">
          <p className="font-brand text-4xl leading-snug font-medium italic text-white/90">
            Gerencie cada jornada,<br />do primeiro contato ao embarque.
          </p>
          <p className="text-sm leading-relaxed text-white/45">
            Plataforma interna da SM Intercâmbio para acompanhamento de leads, aplicações e matrículas.
          </p>
        </div>

        {/* Rodapé do painel */}
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-amber-400" />
          <span className="text-xs text-white/30">Sistema restrito à equipe SM</span>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 sm:px-10">
        {/* Logo mobile */}
        <div className="mb-10 flex items-center justify-center lg:hidden">
          <Image
            src="/sm-logo.png"
            alt="SM Intercâmbio"
            width={180}
            height={46}
            className="object-contain"
            priority
          />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">Bem-vindo de volta</h1>
            <p className="mt-1 text-sm text-slate-500">Acesse o painel com suas credenciais.</p>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white px-7 py-8 shadow-sm">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Problemas de acesso? Fale com a direção.
          </p>
        </div>
      </div>
    </div>
  )
}
