// Elementos compartilhados da jornada mobile-first.
import type { ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'

const PASSOS = ['Relato', 'Entendimento', 'Caminhos', 'Comparar', 'Acompanhar']

export function Passos({ atual }: { atual: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <nav aria-label="Etapas da jornada" className="space-y-1.5">
      <div className="flex gap-1.5" aria-hidden>
        {PASSOS.map((p, i) => (
          <span
            key={p}
            className={`h-1.5 flex-1 rounded-full ${i < atual ? 'bg-[#125435]' : 'bg-stone-200'}`}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-stone-500">
        Etapa {atual} de {PASSOS.length} · <span className="text-[#125435]">{PASSOS[atual - 1]}</span>
      </p>
    </nav>
  )
}

/** Rótulo obrigatório para qualquer dado simulado ou fictício. */
export function SeloDemo({ children = 'Demonstração' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
      <FlaskConical className="h-3 w-3" aria-hidden />
      {children}
    </span>
  )
}

export function Tela({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-xl space-y-5 pb-28 animate-fade-in">{children}</div>
}

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{rotulo}</dt>
      <dd className="text-sm leading-relaxed text-stone-900">{children}</dd>
    </div>
  )
}
