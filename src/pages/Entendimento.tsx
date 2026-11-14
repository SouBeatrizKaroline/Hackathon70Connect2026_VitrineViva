// Tela 3 — "Foi isso que você quis dizer?": rascunho editável + confirmação.
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Pencil, MessageSquarePlus, Lock, Mic, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Campo, Passos, SeloDemo, Tela } from '@/components/jornada/Passos'
import {
  TEMAS,
  URGENCIA_LABEL,
  interpretar,
  montarEntendimento,
} from '@/lib/jornada/interpretar'
import { NEGOCIO_DEMO, TEMA_LABEL } from '@/lib/jornada/catalogo'
import { corrigirDemanda, criarDemanda, salvarRascunho, useJornada } from '@/lib/jornada/store'
import type { Entendimento, TemaId, Urgencia } from '@/lib/jornada/types'

const CAMPOS_TEXTO: { chave: 'objetivo' | 'situacaoAtual' | 'tipoSolucao' | 'restricoes' | 'resultadoEsperado'; rotulo: string }[] = [
  { chave: 'objetivo', rotulo: 'Objetivo' },
  { chave: 'situacaoAtual', rotulo: 'Situação atual' },
  { chave: 'tipoSolucao', rotulo: 'Tipo de solução procurada' },
  { chave: 'restricoes', rotulo: 'Restrições' },
  { chave: 'resultadoEsperado', rotulo: 'Resultado esperado' },
]

export default function EntendimentoPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { rascunho, demandas } = useJornada()
  const emCorrecao = demandas.find((d) => d.id === params.get('demanda'))

  const relato = emCorrecao ? emCorrecao.relato : (rascunho?.texto ?? '')
  const origem = emCorrecao ? emCorrecao.origem : rascunho?.origem
  const exemplo = emCorrecao ? emCorrecao.relatoExemplo : !!rascunho?.exemplo

  const [ent, setEnt] = useState<Entendimento | null>(() => {
    if (emCorrecao) return emCorrecao.entendimento
    if (!rascunho) return null
    return interpretar(rascunho.texto, rascunho.temaSugerido).entendimento
  })
  const [editando, setEditando] = useState(false)
  const [faltou, setFaltou] = useState(false)
  const [complemento, setComplemento] = useState('')

  if (!emCorrecao && !rascunho) {
    return (
      <Tela>
        <div className="space-y-4 py-10 text-center">
          <h1 className="font-serif-title text-2xl text-stone-900">Ainda não há um relato</h1>
          <p className="text-sm text-stone-600">Comece contando o que acontece no seu negócio.</p>
          <Button asChild className="h-12 bg-[#125435] text-white hover:bg-emerald-900">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </Tela>
    )
  }

  const escolherTema = (tema: TemaId) => setEnt(montarEntendimento(tema, relato))

  const aplicarComplemento = () => {
    const extra = complemento.trim()
    if (!ent || !extra) return
    const novoRelato = `${relato} ${extra}`
    const base = montarEntendimento(ent.tema, novoRelato)
    setEnt({
      ...ent,
      restricoes: base.restricoes,
      urgencia: base.urgencia === 'nao_informada' ? ent.urgencia : base.urgencia,
      situacaoAtual: `${ent.situacaoAtual} Complemento informado por você: “${extra}”`,
    })
    if (rascunho && !emCorrecao) salvarRascunho({ ...rascunho, texto: novoRelato, exemplo: false })
    setComplemento('')
    setFaltou(false)
  }

  const confirmar = () => {
    if (!ent) return
    if (emCorrecao) {
      corrigirDemanda(emCorrecao.id, ent)
      navigate('/acompanhar')
    } else if (rascunho) {
      const d = criarDemanda(ent, rascunho)
      navigate(`/caminhos?demanda=${d.id}`)
    }
  }

  const pergunta = ent ? TEMAS[ent.tema].pergunta : null

  return (
    <Tela>
      <Passos atual={2} />

      <header className="space-y-1">
        <h1 className="font-serif-title text-2xl text-stone-900 sm:text-3xl">
          Foi isso que você quis dizer?
        </h1>
        <p className="text-sm text-stone-600">
          Confira o resumo. Você pode corrigir qualquer parte antes de seguir.
        </p>
      </header>

      {/* Relato de origem */}
      <section className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-600">
          {origem === 'audio' ? <Mic className="h-3.5 w-3.5" /> : <Keyboard className="h-3.5 w-3.5" />}
          {origem === 'audio' ? 'Transcrição da sua fala' : 'Seu relato'}
          {exemplo && <SeloDemo>Relato de exemplo</SeloDemo>}
        </div>
        <p className="text-sm italic leading-relaxed text-stone-700">“{relato}”</p>
      </section>

      {/* O motor de regras não reconheceu o assunto: o usuário decide. */}
      {!ent && (
        <section className="space-y-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-bold text-amber-950">
            Não identificamos o assunto com segurança
          </h2>
          <p className="text-sm text-amber-900">Qual destes chega mais perto do que você precisa?</p>
          <div className="grid gap-2">
            {(Object.keys(TEMA_LABEL) as TemaId[]).map((t) => (
              <Button
                key={t}
                variant="outline"
                className="h-12 justify-start bg-white text-left"
                onClick={() => escolherTema(t)}
              >
                {TEMA_LABEL[t]}
              </Button>
            ))}
          </div>
        </section>
      )}

      {ent && (
        <>
          <section className="space-y-4 rounded-2xl border-2 border-[#125435]/30 bg-[#FAF7F0] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif-title text-xl text-[#125435]">
                Entendemos que você precisa de…
              </h2>
              <SeloDemo>Rascunho gerado automaticamente</SeloDemo>
            </div>

            {editando ? (
              <div className="space-y-3">
                {CAMPOS_TEXTO.map(({ chave, rotulo }) => (
                  <label key={chave} className="block space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                      {rotulo}
                    </span>
                    <Textarea
                      rows={2}
                      value={ent[chave]}
                      onChange={(e) => setEnt({ ...ent, [chave]: e.target.value })}
                      className="bg-white text-base"
                    />
                  </label>
                ))}
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    Urgência
                  </span>
                  <select
                    value={ent.urgencia}
                    onChange={(e) => setEnt({ ...ent, urgencia: e.target.value as Urgencia })}
                    className="h-12 w-full rounded-md border border-stone-300 bg-white px-3 text-base"
                  >
                    {(Object.keys(URGENCIA_LABEL) as Urgencia[]).map((u) => (
                      <option key={u} value={u}>
                        {URGENCIA_LABEL[u]}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  className="h-12 w-full bg-[#125435] text-white hover:bg-emerald-900"
                  onClick={() => setEditando(false)}
                >
                  Salvar alterações
                </Button>
              </div>
            ) : (
              <dl className="space-y-3">
                <Campo rotulo="Objetivo">{ent.objetivo}</Campo>
                <Campo rotulo="Situação atual">{ent.situacaoAtual}</Campo>
                <Campo rotulo="Tipo de solução procurada">{ent.tipoSolucao}</Campo>
                <Campo rotulo="Restrições">{ent.restricoes}</Campo>
                <Campo rotulo="Urgência">{URGENCIA_LABEL[ent.urgencia]}</Campo>
                <Campo rotulo="Resultado esperado">{ent.resultadoEsperado}</Campo>
              </dl>
            )}

            <p className="border-t border-stone-200 pt-3 text-xs text-stone-500">
              Negócio da demonstração: {NEGOCIO_DEMO.nome} · {NEGOCIO_DEMO.segmento} ·{' '}
              {NEGOCIO_DEMO.municipio} (dados fictícios).
            </p>
          </section>

          {/* Uma pergunta objetiva por vez */}
          {pergunta && !editando && (
            <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
              <h2 className="text-sm font-bold text-stone-900">{pergunta.texto}</h2>
              <p className="text-xs text-stone-500">Opcional. Ajuda a ordenar as recomendações.</p>
              <div className="grid grid-cols-2 gap-2">
                {pergunta.opcoes.map((o) => {
                  const ativa = ent.respostaPergunta === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={ativa}
                      onClick={() => setEnt({ ...ent, respostaPergunta: ativa ? null : o.id })}
                      className={`h-12 rounded-lg border-2 px-3 text-sm font-medium ${
                        ativa
                          ? 'border-[#125435] bg-emerald-50 text-[#125435]'
                          : 'border-stone-200 bg-white text-stone-800'
                      }`}
                    >
                      {o.rotulo}
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {faltou && (
            <section className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
              <label className="block space-y-1">
                <span className="text-sm font-bold text-stone-900">O que faltou?</span>
                <Textarea
                  rows={3}
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Ex.: preciso que funcione no celular e não posso gastar muito."
                  className="bg-stone-50 text-base"
                />
              </label>
              <Button
                variant="outline"
                className="h-11 w-full bg-white"
                disabled={!complemento.trim()}
                onClick={aplicarComplemento}
              >
                Atualizar resumo
              </Button>
            </section>
          )}

          {!editando && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-12 bg-white" onClick={() => setEditando(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </Button>
              <Button variant="outline" className="h-12 bg-white" onClick={() => setFaltou((v) => !v)}>
                <MessageSquarePlus className="mr-2 h-4 w-4" /> Faltou algo
              </Button>
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-stone-500">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Nada é enviado a fornecedores nem à associação nesta etapa. O compartilhamento só
            acontece se você pedir proposta e autorizar.
          </p>

          {!editando && (
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 p-3 backdrop-blur">
              <div className="mx-auto max-w-xl">
                <Button
                  onClick={confirmar}
                  className="h-12 w-full bg-[#125435] text-base font-semibold text-white hover:bg-emerald-900"
                >
                  <Check className="mr-2 h-5 w-5" />
                  {emCorrecao ? 'Salvar correção' : 'Está correto'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Tela>
  )
}
