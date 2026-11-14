// Tela 6 — Acompanhamento: status, propostas, piloto, corrigir e cancelar.
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Clock, FlaskConical, Pencil, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Passos, SeloDemo, Tela } from '@/components/jornada/Passos'
import { CATEGORIAS, NAO_INFORMADO, fornecedorPorId, moeda } from '@/lib/jornada/catalogo'
import { demandaAtual } from '@/lib/jornada/atual'
import {
  cancelarDemanda,
  concluirDemanda,
  iniciarPiloto,
  marcarEmAvaliacao,
  simularRetorno,
  useJornada,
} from '@/lib/jornada/store'
import type { Demanda, StatusDemanda } from '@/lib/jornada/types'

const LINHA: { status: StatusDemanda; rotulo: string }[] = [
  { status: 'criada', rotulo: 'Demanda criada' },
  { status: 'revisada', rotulo: 'Revisada' },
  { status: 'fornecedores_convidados', rotulo: 'Fornecedores convidados' },
  { status: 'propostas_recebidas', rotulo: 'Propostas recebidas' },
  { status: 'em_avaliacao', rotulo: 'Em avaliação' },
  { status: 'piloto', rotulo: 'Piloto' },
  { status: 'concluida', rotulo: 'Concluída' },
]

const PROXIMA_ACAO: Record<StatusDemanda, string> = {
  criada: 'Você: conferir o resumo.',
  revisada: 'Você: escolher um caminho e pedir propostas.',
  fornecedores_convidados: 'Fornecedores: responder ao pedido de proposta.',
  propostas_recebidas: 'Você: comparar as propostas recebidas.',
  em_avaliacao: 'Você: escolher um fornecedor para testar em piloto.',
  piloto: 'Você e a associação: combinar objetivo, período e indicador do piloto.',
  concluida: 'Nenhuma. Demanda concluída.',
  cancelada: 'Nenhuma. Solicitação cancelada.',
}

function data(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Item({ rotulo, v }: { rotulo: string; v: string | null }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 border-t border-stone-100 py-1.5 text-sm">
      <dt className="text-xs font-semibold text-stone-500">{rotulo}</dt>
      <dd className={v === null ? 'italic text-amber-800' : 'text-stone-900'}>
        {v ?? NAO_INFORMADO}
      </dd>
    </div>
  )
}

function CartaoDemanda({ d }: { d: Demanda }) {
  const [cancelar, setCancelar] = useState(false)
  const encerrada = d.status === 'cancelada' || d.status === 'concluida'
  const indice = LINHA.findIndex((l) => l.status === d.status)
  const ultimo = d.historico[d.historico.length - 1]
  const mostraPropostas = d.status === 'propostas_recebidas' || d.status === 'em_avaliacao'
  const piloto = d.pilotoFornecedorId ? fornecedorPorId(d.pilotoFornecedorId) : undefined

  return (
    <article className="space-y-4 rounded-2xl border-2 border-stone-200 bg-white p-4">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-700">
            {d.codigo}
          </span>
          {d.status === 'cancelada' && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-800">
              Cancelada
            </span>
          )}
        </div>
        <h2 className="font-serif-title text-xl leading-snug text-stone-900">
          {d.entendimento.objetivo}
        </h2>
        {d.categoriaEscolhida && (
          <p className="text-xs text-stone-500">Caminho: {CATEGORIAS[d.categoriaEscolhida].nome}</p>
        )}
      </header>

      {/* Linha de status */}
      {d.status !== 'cancelada' && (
        <ol className="space-y-0" aria-label="Linha de status">
          {LINHA.map((l, i) => {
            const feito = i < indice || d.status === 'concluida'
            const atual = i === indice && d.status !== 'concluida'
            return (
              <li key={l.status} className="flex items-stretch gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                      feito
                        ? 'border-[#125435] bg-[#125435] text-white'
                        : atual
                          ? 'border-[#125435] bg-white text-[#125435]'
                          : 'border-stone-300 bg-white text-stone-400'
                    }`}
                  >
                    {feito ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  {i < LINHA.length - 1 && (
                    <span className={`w-0.5 flex-1 ${feito ? 'bg-[#125435]' : 'bg-stone-200'}`} />
                  )}
                </div>
                <p
                  className={`pb-3 text-sm ${
                    atual ? 'font-bold text-[#125435]' : feito ? 'text-stone-800' : 'text-stone-400'
                  }`}
                  aria-current={atual ? 'step' : undefined}
                >
                  {l.rotulo}
                  {atual && <span className="ml-2 text-xs font-medium text-stone-500">(agora)</span>}
                </p>
              </li>
            )
          })}
        </ol>
      )}

      <dl className="rounded-lg bg-[#FAF7F0] p-3 text-sm">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Última atualização
          </dt>
          <dd className="text-stone-900">
            {data(ultimo.em)} — {ultimo.nota}
          </dd>
        </div>
        <div className="mt-2">
          <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Próxima ação
          </dt>
          <dd className="text-stone-900">{PROXIMA_ACAO[d.status]}</dd>
        </div>
      </dl>

      {/* Ações por etapa */}
      {d.status === 'revisada' && (
        <Button asChild className="h-12 w-full bg-[#125435] text-white hover:bg-emerald-900">
          <Link to={`/caminhos?demanda=${d.id}`}>Ver caminhos recomendados</Link>
        </Button>
      )}

      {d.status === 'fornecedores_convidados' && (
        <section className="space-y-3">
          <ul className="space-y-1.5">
            {d.propostas.map((p) => (
              <li key={p.fornecedorId} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-stone-900">{fornecedorPorId(p.fornecedorId)?.nome}</span>
                <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                  <Clock className="h-3.5 w-3.5" /> Aguardando retorno
                </span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => simularRetorno(d.id)}
            className="h-12 w-full bg-amber-700 text-white hover:bg-amber-800"
          >
            <FlaskConical className="mr-2 h-4 w-4" /> Simular retorno dos fornecedores
          </Button>
          <p className="text-center text-xs text-stone-500">
            Na demonstração, o retorno é simulado. Nenhuma empresa real foi contatada.
          </p>
        </section>
      )}

      {mostraPropostas && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-stone-900">Propostas</h3>
            <SeloDemo>Retorno simulado</SeloDemo>
          </div>
          {d.propostas.map((p) => {
            const f = fornecedorPorId(p.fornecedorId)
            if (!f) return null
            if (p.situacao === 'aguardando')
              return (
                <div key={f.id} className="rounded-xl border border-dashed border-stone-300 p-3 text-sm">
                  <p className="font-semibold text-stone-900">{f.nome}</p>
                  <p className="text-stone-600">
                    Sem retorno até agora. Você pode seguir com as propostas recebidas ou voltar aos
                    caminhos para considerar outro fornecedor.
                  </p>
                </div>
              )
            return (
              <div key={f.id} className="space-y-2 rounded-xl border-2 border-stone-200 p-3">
                <p className="font-serif-title text-lg text-stone-900">{f.nome}</p>
                <dl>
                  <Item rotulo="Mensalidade" v={f.precoMensal === null ? null : `${moeda(f.precoMensal)}/mês`} />
                  <Item rotulo="Implantação" v={f.implantacao === null ? null : moeda(f.implantacao)} />
                  <Item rotulo="Custos variáveis" v={f.custosVariaveis} />
                  <Item rotulo="Escopo" v={f.funcionalidades.join(' · ')} />
                  <Item rotulo="Não incluído" v={f.naoIncluido} />
                  <Item rotulo="Prazo" v={f.prazoDias === null ? null : `${f.prazoDias} dia(s)`} />
                  <Item rotulo="Suporte" v={f.suporte} />
                  <Item rotulo="Validade" v={f.validadeProposta} />
                </dl>
                {d.status === 'em_avaliacao' && (
                  <Button
                    onClick={() => iniciarPiloto(d.id, f.id, f.nome)}
                    variant="outline"
                    className="h-11 w-full border-[#125435] bg-white text-[#125435]"
                  >
                    Testar em piloto com {f.nome}
                  </Button>
                )}
              </div>
            )
          })}
          {d.status === 'propostas_recebidas' && (
            <Button
              onClick={() => marcarEmAvaliacao(d.id)}
              className="h-12 w-full bg-[#125435] text-white hover:bg-emerald-900"
            >
              Estou avaliando as propostas
            </Button>
          )}
        </section>
      )}

      {d.status === 'piloto' && piloto && (
        <section className="space-y-3 rounded-xl border-2 border-[#125435]/30 bg-emerald-50/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#125435]">Piloto com {piloto.nome}</h3>
            <SeloDemo>Simulação</SeloDemo>
          </div>
          <p className="text-sm text-stone-700">
            Objetivo, período e indicador serão combinados com a associação. Nenhum resultado foi
            medido ainda: resultados só aparecem como reais depois da medição.
          </p>
          <Button
            onClick={() => concluirDemanda(d.id)}
            variant="outline"
            className="h-11 w-full bg-white"
          >
            Encerrar e concluir a demanda
          </Button>
        </section>
      )}

      {/* O que foi compartilhado */}
      <p className="text-xs leading-relaxed text-stone-500">
        Compartilhamento:{' '}
        {d.autorizouFornecedores
          ? `resumo enviado a ${d.propostas.length} fornecedor(es) (simulado)`
          : 'nada enviado a fornecedores'}
        ; Radar da associação: {d.autorizouRadar ? 'contagem agregada autorizada' : 'não autorizado'}.
      </p>

      {!encerrada && (
        <div className="grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
          <Button asChild variant="outline" className="h-11 bg-white">
            <Link to={`/entendimento?demanda=${d.id}`}>
              <Pencil className="mr-2 h-4 w-4" /> Corrigir demanda
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-11 border-red-200 bg-white text-red-800 hover:bg-red-50"
            onClick={() => setCancelar(true)}
          >
            <XCircle className="mr-2 h-4 w-4" /> Cancelar
          </Button>
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-stone-700">Histórico</summary>
        <ul className="mt-2 space-y-1.5 text-stone-600">
          {d.historico.map((h, i) => (
            <li key={i}>
              <span className="tabular-nums text-stone-400">{data(h.em)}</span> — {h.nota}
            </li>
          ))}
        </ul>
      </details>

      <AlertDialog open={cancelar} onOpenChange={setCancelar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif-title text-xl">
              Cancelar esta solicitação?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Os fornecedores deixam de receber atualizações e a necessidade sai da contagem do
              Radar. A solicitação fica no seu histórico como cancelada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 text-white hover:bg-red-800"
              onClick={() => cancelarDemanda(d.id)}
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}

export default function AcompanharPage() {
  const [params] = useSearchParams()
  const { demandas } = useJornada()
  const destaque = demandaAtual(demandas, params.get('demanda'))
  const ordenadas = destaque ? [destaque, ...demandas.filter((d) => d.id !== destaque.id)] : demandas

  return (
    <Tela>
      <Passos atual={5} />
      <header className="space-y-1">
        <h1 className="font-serif-title text-2xl text-stone-900 sm:text-3xl">
          Acompanhar minha solicitação
        </h1>
        <p className="text-sm text-stone-600">
          Veja em que etapa está, quem age em seguida e o que foi compartilhado.
        </p>
      </header>

      {ordenadas.length === 0 ? (
        <div className="space-y-4 rounded-2xl border-2 border-dashed border-stone-300 p-6 text-center">
          <p className="text-sm text-stone-600">Você ainda não tem solicitações neste aparelho.</p>
          <Button asChild className="h-12 bg-[#125435] text-white hover:bg-emerald-900">
            <Link to="/">Contar o que acontece no negócio</Link>
          </Button>
        </div>
      ) : (
        ordenadas.map((d) => <CartaoDemanda key={d.id} d={d} />)
      )}

      <div className="text-center text-sm">
        <Link to="/radar" className="font-semibold text-[#125435] underline underline-offset-2">
          Ver o Radar agregado da associação
        </Link>
      </div>
    </Tela>
  )
}
