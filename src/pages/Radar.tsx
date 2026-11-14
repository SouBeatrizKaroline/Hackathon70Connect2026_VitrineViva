// Tela 7 — Radar agregado da associação: tendências sem expor relatos individuais.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Check, EyeOff, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SeloDemo } from '@/components/jornada/Passos'
import { ASSOCIACAO_DEMO } from '@/lib/jornada/catalogo'
import { MINIMO_RADAR, gruposDoRadar, registrarAcaoRadar, useJornada } from '@/lib/jornada/store'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/use-toast'

const ACOES = [
  'Validar demandas',
  'Convidar fornecedores',
  'Criar desafio coletivo',
  'Selecionar negócios para piloto',
]
const MINIMO_OPORTUNIDADE = 5

function Filtro({
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  rotulo: string
  valor: string
  opcoes: string[]
  onChange: (v: string) => void
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{rotulo}</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-stone-300 bg-white px-2 text-sm"
      >
        <option value="">Todos</option>
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function RadarPage() {
  const { demandas, acoesRadar } = useJornada()
  const { role, switchDemoRole } = useAuth()
  const ehAssociacao = role === 'associacao'

  const [tema, setTema] = useState('')
  const [segmento, setSegmento] = useState('')
  const [municipio, setMunicipio] = useState('')

  const todos = useMemo(() => gruposDoRadar(demandas), [demandas])
  const unicos = (f: (g: (typeof todos)[number]) => string) => [...new Set(todos.map(f))].sort()

  const filtrados = todos.filter(
    (g) =>
      (!tema || g.temaRotulo === tema) &&
      (!segmento || g.segmento === segmento) &&
      (!municipio || g.municipio === municipio),
  )
  const visiveis = filtrados.filter((g) => g.total >= MINIMO_RADAR)
  const ocultos = filtrados.length - visiveis.length
  const maior = Math.max(1, ...visiveis.map((g) => g.total))
  const oportunidades = visiveis.filter((g) => g.total >= MINIMO_OPORTUNIDADE)
  const autorizadasAqui = demandas.filter((d) => d.autorizouRadar && d.status !== 'cancelada').length

  const agir = (grupo: string, acao: string) => {
    registrarAcaoRadar(grupo, acao)
    toast({ title: `${acao}: registrado`, description: 'Ação simulada nesta demonstração.' })
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-16 animate-fade-in">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#125435]">
          <Building2 className="h-4 w-4" aria-hidden />
          Radar · {ASSOCIACAO_DEMO}
          <SeloDemo>Dados fictícios</SeloDemo>
        </div>
        <h1 className="font-serif-title text-2xl text-stone-900 sm:text-3xl">
          O que os associados estão precisando
        </h1>
        <p className="text-sm text-stone-600">
          Necessidades semelhantes agrupadas por tema, segmento e município, nos últimos 30 dias
          da demonstração.
        </p>
      </header>

      <p className="flex gap-2 rounded-lg border border-stone-200 bg-[#FAF7F0] p-3 text-xs leading-relaxed text-stone-700">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-[#125435]" aria-hidden />
        <span>
          Visão agregada: sem áudio, sem texto original e sem nome de loja. Grupos com menos de{' '}
          {MINIMO_RADAR} demandas não aparecem. Contagens de base são fictícias
          {autorizadasAqui > 0 &&
            `; ${autorizadasAqui} demanda(s) autorizada(s) neste aparelho já entra(m) na contagem`}
          .
        </span>
      </p>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Filtros">
        <Filtro rotulo="Tema" valor={tema} opcoes={unicos((g) => g.temaRotulo)} onChange={setTema} />
        <Filtro rotulo="Segmento" valor={segmento} opcoes={unicos((g) => g.segmento)} onChange={setSegmento} />
        <Filtro rotulo="Município" valor={municipio} opcoes={unicos((g) => g.municipio)} onChange={setMunicipio} />
      </section>

      {/* Oportunidades coletivas */}
      {oportunidades.map((g) => {
        const feitas = acoesRadar[g.chave] ?? []
        return (
          <section key={g.chave} className="space-y-3 rounded-2xl border-2 border-[#125435] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#125435] px-2.5 py-0.5 text-xs font-bold text-white">
                Oportunidade coletiva
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-stone-600">
                <Users className="h-3.5 w-3.5" /> {g.total} demandas semelhantes
              </span>
            </div>
            <h2 className="font-serif-title text-xl text-stone-900">{g.temaRotulo}</h2>
            <p className="text-sm text-stone-700">
              {g.segmento} · {g.municipio}. Volume suficiente para avaliar uma negociação conjunta
              ou um piloto com vários negócios.
            </p>
            {ehAssociacao ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ACOES.map((a) => {
                  const feita = feitas.includes(a)
                  return (
                    <Button
                      key={a}
                      variant="outline"
                      disabled={feita}
                      onClick={() => agir(g.chave, a)}
                      className="h-11 justify-start bg-white"
                    >
                      {feita && <Check className="mr-2 h-4 w-4 text-emerald-700" />}
                      {a}
                      {feita && ' (registrado)'}
                    </Button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2 rounded-lg bg-stone-50 p-3 text-sm text-stone-700">
                <p>Validar, convidar fornecedores e abrir desafio são ações da associação.</p>
                <Button
                  variant="outline"
                  className="h-11 bg-white"
                  onClick={() => void switchDemoRole('associacao')}
                >
                  Entrar com o perfil de associação da demo
                </Button>
              </div>
            )}
          </section>
        )
      })}

      {/* Demandas por tema */}
      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-bold text-stone-900">Demandas por tema, segmento e município</h2>
        {visiveis.length === 0 ? (
          <p className="text-sm text-stone-600">
            Nenhum grupo com pelo menos {MINIMO_RADAR} demandas para os filtros escolhidos.
          </p>
        ) : (
          <ul className="space-y-3">
            {visiveis.map((g) => (
              <li key={g.chave} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-stone-900">
                    <strong>{g.temaRotulo}</strong>
                    <span className="block text-xs text-stone-500">
                      {g.segmento} · {g.municipio}
                    </span>
                  </span>
                  <span className="font-serif-title text-xl tabular-nums text-[#125435]">{g.total}</span>
                </div>
                <div className="h-2 rounded-full bg-stone-100" aria-hidden>
                  <div
                    className="h-2 rounded-full bg-[#125435]"
                    style={{ width: `${(g.total / maior) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        {ocultos > 0 && (
          <p className="text-xs text-stone-500">
            {ocultos} grupo(s) com menos de {MINIMO_RADAR} demandas não são exibidos, para não
            expor negócios individualmente.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:justify-between">
        <Link to="/" className="font-semibold text-[#125435] underline underline-offset-2">
          Voltar ao início
        </Link>
        {ehAssociacao && (
          <Link to="/associacao" className="font-semibold text-[#125435] underline underline-offset-2">
            Abrir painel completo da associação
          </Link>
        )}
      </div>
    </div>
  )
}
