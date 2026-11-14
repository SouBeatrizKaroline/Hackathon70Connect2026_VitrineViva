// Tela 4 — Até três caminhos recomendados, explicados sem jargão.
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, CircleSlash, Info, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Campo, Passos, SeloDemo, Tela } from '@/components/jornada/Passos'
import { TEMAS, recomendarCaminhos } from '@/lib/jornada/interpretar'
import { demandaAtual } from '@/lib/jornada/atual'
import { useJornada } from '@/lib/jornada/store'

export default function CaminhosPage() {
  const [params] = useSearchParams()
  const { demandas } = useJornada()
  const demanda = demandaAtual(demandas, params.get('demanda'))

  if (!demanda) {
    return (
      <Tela>
        <div className="space-y-4 py-10 text-center">
          <h1 className="font-serif-title text-2xl text-stone-900">Nenhuma demanda confirmada</h1>
          <p className="text-sm text-stone-600">
            As recomendações aparecem depois que você confirma o resumo do seu relato.
          </p>
          <Button asChild className="h-12 bg-[#125435] text-white hover:bg-emerald-900">
            <Link to="/">Contar o que acontece</Link>
          </Button>
        </div>
      </Tela>
    )
  }

  const ent = demanda.entendimento
  const caminhos = recomendarCaminhos(ent)
  const naoRecomendado = TEMAS[ent.tema].naoRecomendado

  return (
    <Tela>
      <Passos atual={3} />

      <header className="space-y-1">
        <h1 className="font-serif-title text-2xl text-stone-900 sm:text-3xl">
          Caminhos que combinam com o seu caso
        </h1>
        <p className="text-sm text-stone-600">
          Para: <strong className="text-stone-800">{ent.objetivo}</strong>
        </p>
      </header>

      <ol className="space-y-4">
        {caminhos.map((c, i) => (
          <li key={c.categoria} className="space-y-3 rounded-2xl border-2 border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  i === 0 ? 'bg-[#125435] text-white' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {i === 0 ? 'Mais adequado ao seu relato' : `Alternativa ${i}`}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Categoria recomendada
              </span>
            </div>
            <h2 className="font-serif-title text-xl leading-snug text-stone-900">{c.nome}</h2>
            <dl className="space-y-2.5">
              <Campo rotulo="O que resolve">{c.oQueResolve}</Campo>
              <Campo rotulo="Por que combina com o seu caso">{c.porQueCombina}</Campo>
              {c.limite && (
                <p className="flex gap-2 rounded-lg bg-amber-50 p-2.5 text-sm text-amber-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {c.limite}
                </p>
              )}
              <Campo rotulo="O que precisa confirmar">{c.oQueConfirmar}</Campo>
              <Campo rotulo="Próximo passo">{c.proximoPasso}</Campo>
            </dl>
            <div className="space-y-2 border-t border-stone-100 pt-3">
              <p className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                {c.fornecedores} fornecedor(es) cadastrado(s) nesta categoria
                <SeloDemo>Perfis demonstrativos</SeloDemo>
              </p>
              <Button asChild className="h-12 w-full bg-[#125435] text-white hover:bg-emerald-900">
                <Link to={`/comparar?demanda=${demanda.id}&caminho=${c.categoria}`}>
                  Comparar fornecedores <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <section className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900">
          <CircleSlash className="h-4 w-4 text-stone-500" aria-hidden />O que não estamos
          recomendando agora
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-stone-700">
          {naoRecomendado.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <p className="flex items-start gap-2 text-xs text-stone-500">
        <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Ordem definida por regras de adequação ao seu relato. Nenhum fornecedor paga para aparecer
        ou subir de posição. Categoria recomendada não é garantia de disponibilidade: confirme com
        o fornecedor.
      </p>

      <div className="text-center text-sm">
        <Link
          to={`/entendimento?demanda=${demanda.id}`}
          className="font-semibold text-[#125435] underline underline-offset-2"
        >
          Corrigir minha demanda
        </Link>
      </div>
    </Tela>
  )
}
