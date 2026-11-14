// Layout mobile-first: barra superior com a marca e a associação participante.
import { Link, Outlet } from 'react-router-dom'
import { Store } from 'lucide-react'
import { ASSOCIACAO_DEMO } from '@/lib/jornada/catalogo'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/" className="flex min-w-0 items-center gap-2" aria-label="vivIA, início">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#125435] text-amber-300">
              <Store className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block font-serif-title text-base font-semibold text-stone-900">
                vivIA
              </span>
              <span className="block truncate text-[11px] text-stone-500">
                Conectado à {ASSOCIACAO_DEMO} · demonstração
              </span>
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-3 text-sm font-semibold text-[#125435]">
            <Link to="/acompanhar" className="hover:underline">
              Acompanhar
            </Link>
            <Link to="/entrar" className="hidden hover:underline sm:inline">
              Entrar
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
        <Outlet />
      </main>
    </div>
  )
}
