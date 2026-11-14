// Tela 5 — Comparação de fornecedores (fictícios) com critérios explícitos.
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, CircleHelp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Passos, SeloDemo, Tela } from '@/components/jornada/Passos'
import {
  ASSOCIACAO_DEMO,
  CATEGORIAS,
  NAO_INFORMADO,
  fornecedoresDaCategoria,
  moeda,
} from '@/lib/jornada/catalogo'
import { avaliarAdequacao, ordenarPorAdequacao } from '@/lib/jornada/interpretar'
import { demandaAtual } from '@/lib/jornada/atual'
import { pedirPropostas, useJornada } from '@/lib/jornada/store'
import type { CategoriaId, CriterioAdequacao } from '@/lib/jornada/types'

function Valor({ v }: { v: string | null }) {
  if (v === null || v === NAO_INFORMADO)
    return <span className="italic text-amber-800">{NAO_INFORMADO}</span>
  return <>{v}</>
}

function Linha({ rotulo, v }: { rotulo: string; v: string | null }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 border-t border-stone-100 py-2 text-sm">
      <dt className="text-xs font-semibold text-stone-500">{rotulo}</dt>
      <dd className="text-stone-900">
        <Valor v={v} />
      </dd>
    </div>
  )
}

const ICONE: Record<CriterioAdequacao['situacao'], ReactNode> = {
  atende: <Check className="h-4 w-4 text-emerald-700" aria-label="Atende" />,
  nao_atende: <X className="h-4 w-4 text-red-700" aria-label="Não atende" />,
  confirmar: <CircleHelp className="h-4 w-4 text-amber-700" aria-label="A confirmar" />,
}

export default function CompararPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { demandas } = useJornada()
  const demanda = demandaAtual(demandas, params.get('demanda'))
  const categoria = params.get('caminho') as CategoriaId | null

  const [interesse, setInteresse] = useState<string[]>([])
  const [dialogo, setDialogo] = useState(false)
  const [autFornecedores, setAutFornecedores] = useState(false)
  const [autRadar, setAutRadar] = useState(false)

  if (!demanda || !categoria || !CATEGORIAS[categoria]) {
    return (
      <Tela>
        <div className="space-y-4 py-10 text-center">
          <h1 className="font-serif-title text-2xl text-stone-900">Escolha um caminho primeiro</h1>
          <Button asChild className="h-12 bg-[#125435] text-white hover:bg-emerald-900">
            <Link to="/caminhos">Ver caminhos recomendados</Link>
          </Button>
        </div>
      </Tela>
    )
  }

  const ent = demanda.entendimento
  const lista = ordenarPorAdequacao(fornecedoresDaCategoria(categoria), ent).slice(0, 3)
  const podePedir = demanda.status === 'revisada'

  const alternar = (id: string) =>
    setInteresse((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]))

  const confirmar = () => {
    // mantém a ordem de adequação na lista de convidados
    const ids = lista.filter((f) => interesse.includes(f.id)).map((f) => f.id)
    pedirPropostas(demanda.id, categoria, ids, autRadar)
    navigate(`/acompanhar?demanda=${demanda.id}`)
  }

  return (
    <Tela>
      <Passos atual={4} />

      <header className="space-y-1">
        <Link
          to={`/caminhos?demanda=${demanda.id}`}
          className="inline-flex items-center gap-1 text-sm text-stone-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Caminhos
        </Link>
        <h1 className="font-serif-title text-2xl text-stone-900 sm:text-3xl">Compare as opções</h1>
        <p className="text-sm text-stone-600">{CATEGORIAS[categoria].nome}</p>
      </header>

      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
        Empresas, preços e condições abaixo são <strong>fictícios</strong>, criados para demonstrar
        a comparação. Ordem por adequação ao seu pedido; nesta demonstração não há comissão nem
        patrocínio, e pagamento nunca altera a posição.
      </p>

      {!podePedir && (
        <p className="rounded-lg bg-stone-100 p-3 text-sm text-stone-700">
          Você já pediu propostas para esta demanda.{' '}
          <Link to={`/acompanhar?demanda=${demanda.id}`} className="font-semibold text-[#125435] underline">
            Acompanhar
          </Link>
        </p>
      )}

      <ul className="space-y-4">
        {lista.map((f) => {
          const criterios = avaliarAdequacao(f, ent)
          const atende = criterios.filter((c) => c.situacao === 'atende').length
          const marcado = interesse.includes(f.id)
          return (
            <li
              key={f.id}
              className={`space-y-3 rounded-2xl border-2 bg-white p-4 ${
                marcado ? 'border-[#125435]' : 'border-stone-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-serif-title text-xl text-stone-900">{f.nome}</h2>
                <SeloDemo>Perfil demonstrativo</SeloDemo>
              </div>
              <p className="text-sm text-stone-600">{f.perfil}</p>

              <div className="rounded-lg bg-[#FAF7F0] p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#125435]">
                  Adequação ao seu pedido: {atende} de {criterios.length} critérios
                </p>
                <ul className="mt-2 space-y-1.5">
                  {criterios.map((c) => (
                    <li key={c.criterio} className="flex items-start gap-2 text-sm text-stone-800">
                      <span className="mt-0.5 shrink-0">{ICONE[c.situacao]}</span>
                      <span>
                        <strong>{c.criterio}:</strong> {c.detalhe}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <dl>
                <Linha rotulo="Mensalidade" v={f.precoMensal === null ? null : `${moeda(f.precoMensal)}/mês`} />
                <Linha rotulo="Implantação" v={moeda(f.implantacao)} />
                <Linha rotulo="Custos variáveis" v={f.custosVariaveis} />
                <Linha rotulo="Inclui" v={f.funcionalidades.join(' · ')} />
                <Linha rotulo="Não inclui" v={f.naoIncluido} />
                <Linha rotulo="Integrações" v={f.integracoes} />
                <Linha rotulo="Prazo estimado" v={f.prazoDias === null ? null : `${f.prazoDias} dia(s)`} />
                <Linha rotulo="Treinamento" v={f.treinamento} />
                <Linha rotulo="Suporte" v={f.suporte} />
                <Linha rotulo="Fidelidade e cancelamento" v={f.fidelidade} />
                <Linha rotulo="Requisitos" v={f.requisitos} />
              </dl>

              {podePedir && (
                <Button
                  variant={marcado ? 'default' : 'outline'}
                  aria-pressed={marcado}
                  onClick={() => alternar(f.id)}
                  className={`h-12 w-full ${
                    marcado
                      ? 'bg-[#125435] text-white hover:bg-emerald-900'
                      : 'border-[#125435] bg-white text-[#125435]'
                  }`}
                >
                  {marcado ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Interesse marcado
                    </>
                  ) : (
                    'Tenho interesse'
                  )}
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      {podePedir && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto max-w-xl">
            <Button
              disabled={interesse.length === 0}
              onClick={() => setDialogo(true)}
              className="h-12 w-full bg-[#125435] text-base font-semibold text-white hover:bg-emerald-900"
            >
              {interesse.length === 0
                ? 'Marque ao menos um fornecedor'
                : `Pedir proposta a ${interesse.length} fornecedor(es)`}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif-title text-xl">Antes de pedir proposta</DialogTitle>
            <DialogDescription>
              Você decide o que é compartilhado. São duas autorizações separadas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-stone-700">
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="font-semibold text-stone-900">O que os fornecedores recebem</p>
              <p>Somente o resumo confirmado: objetivo, situação, restrições, urgência e resultado esperado.</p>
              <p className="mt-2 font-semibold text-stone-900">O que não é enviado</p>
              <p>Seu relato original, áudio, telefone e qualquer dado de clientes.</p>
            </div>

            <label className="flex items-start gap-3 rounded-lg border-2 border-stone-200 p-3">
              <Checkbox
                checked={autFornecedores}
                onCheckedChange={(v) => setAutFornecedores(v === true)}
                className="mt-0.5"
              />
              <span>
                <strong>Autorizo</strong> compartilhar o resumo com os fornecedores que marquei.{' '}
                <span className="text-stone-500">(necessário para pedir proposta)</span>
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-lg border-2 border-stone-200 p-3">
              <Checkbox
                checked={autRadar}
                onCheckedChange={(v) => setAutRadar(v === true)}
                className="mt-0.5"
              />
              <span>
                <strong>Autorizo</strong> contar esta necessidade no Radar da {ASSOCIACAO_DEMO}, de
                forma agregada, sem o nome do negócio nem o texto do relato.{' '}
                <span className="text-stone-500">(opcional)</span>
              </span>
            </label>

            <p className="text-xs text-stone-500">
              Envio simulado nesta demonstração: nenhuma empresa real é contatada. Você pode
              cancelar a solicitação depois.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11" onClick={() => setDialogo(false)}>
              Voltar
            </Button>
            <Button
              disabled={!autFornecedores}
              onClick={confirmar}
              className="h-11 bg-[#125435] text-white hover:bg-emerald-900"
            >
              Pedir proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tela>
  )
}
