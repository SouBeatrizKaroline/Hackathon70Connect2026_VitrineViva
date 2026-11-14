// Tela 2 — Captura do relato por voz ou texto.
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Mic,
  Pause,
  Play,
  Check,
  Trash2,
  Keyboard,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Passos, SeloDemo, Tela } from '@/components/jornada/Passos'
import { useGravador } from '@/hooks/use-gravador'
import { RELATO_EXEMPLO, pareceTerDadoPessoal } from '@/lib/jornada/interpretar'
import { salvarRascunho } from '@/lib/jornada/store'
import { ASSOCIACAO_DEMO } from '@/lib/jornada/catalogo'
import type { TemaId } from '@/lib/jornada/types'

const LIMITE = 90
const MINIMO_CARACTERES = 20

const DICA_TEMA: Record<TemaId, string> = {
  vender_digital: 'Conte como você vende hoje e o que gostaria que fosse diferente no digital.',
  estoque_canais: 'Conte como você controla estoque e pedidos e onde costuma dar errado.',
  atendimento: 'Conte quais tarefas se repetem todo dia e tomam seu tempo.',
  gestao: 'Conte o que você controla hoje no papel, na planilha ou de cabeça.',
  pedidos_entregas: 'Conte como os pedidos chegam e como você organiza as entregas.',
}

function tempo(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function RelatarPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const modo = params.get('modo') === 'texto' ? 'texto' : 'audio'
  const tema = (params.get('tema') as TemaId | null) ?? undefined
  const g = useGravador(LIMITE)

  const [digitado, setDigitado] = useState('')
  const [editado, setEditado] = useState<string | null>(null)
  const [exemploAudio, setExemploAudio] = useState(false)
  const [organizando, setOrganizando] = useState(false)

  const textoAudio = exemploAudio ? (editado ?? RELATO_EXEMPLO) : (editado ?? g.texto)
  const texto = modo === 'texto' ? digitado : textoAudio
  const pronto = texto.trim().length >= MINIMO_CARACTERES
  const revisandoAudio = modo === 'audio' && (g.estado === 'finalizado' || exemploAudio)

  const mudarModo = (m: 'audio' | 'texto') => {
    g.descartar()
    setEditado(null)
    setExemploAudio(false)
    const p = new URLSearchParams(params)
    p.set('modo', m)
    setParams(p, { replace: true })
  }

  const descartar = () => {
    g.descartar()
    setEditado(null)
    setExemploAudio(false)
  }

  const enviar = () => {
    if (!pronto) return
    salvarRascunho({
      origem: modo,
      texto: texto.trim(),
      exemplo: texto.trim() === RELATO_EXEMPLO,
      temaSugerido: tema,
    })
    setOrganizando(true)
    window.setTimeout(() => navigate('/entendimento'), 1300)
  }

  if (organizando) {
    return (
      <Tela>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#125435]" aria-hidden />
          <h1 className="font-serif-title text-2xl text-stone-900" role="status">
            Organizando seu relato…
          </h1>
          <p className="max-w-xs text-sm text-stone-600">
            O resumo é um rascunho automático e pode precisar de correção. Você confere tudo antes
            de seguir.
          </p>
        </div>
      </Tela>
    )
  }

  return (
    <Tela>
      <Passos atual={1} />

      <header className="space-y-1">
        <h1 className="font-serif-title text-2xl text-stone-900 sm:text-3xl">
          {modo === 'audio' ? 'Conte com a sua voz' : 'Escreva do seu jeito'}
        </h1>
        <p className="text-sm text-stone-600">
          {tema ? DICA_TEMA[tema] : 'Explique como falaria com outra pessoa. Não precisa saber o nome da tecnologia.'}
        </p>
      </header>

      {/* Aviso curto de privacidade, antes de gravar ou escrever */}
      <div className="flex gap-2.5 rounded-xl border border-stone-200 bg-[#FAF7F0] p-3 text-xs leading-relaxed text-stone-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#125435]" aria-hidden />
        <p>
          Seu relato serve só para montar o resumo da sua necessidade. Não cite nomes ou telefones
          de clientes, senhas nem dados financeiros.{' '}
          <Dialog>
            <DialogTrigger className="font-semibold text-[#125435] underline underline-offset-2">
              Ver aviso completo
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif-title text-xl">
                  Como seu relato é usado nesta demonstração
                </DialogTitle>
                <DialogDescription>Orientação de produto, não parecer jurídico.</DialogDescription>
              </DialogHeader>
              <ul className="list-disc space-y-2 pl-5 text-sm text-stone-700">
                <li>
                  <strong>Finalidade:</strong> transformar o que você contou em um resumo de
                  demanda, que só segue adiante depois da sua confirmação.
                </li>
                <li>
                  <strong>Áudio:</strong> a vivIA não grava nem guarda o áudio. A fala vira
                  texto pelo reconhecimento de voz do seu navegador, que pode processá-la no
                  serviço do fabricante do navegador. Se preferir, use o texto.
                </li>
                <li>
                  <strong>Onde fica:</strong> o relato e o resumo ficam neste aparelho. Nada é
                  enviado a fornecedores ou à associação sem autorização específica sua.
                </li>
                <li>
                  <strong>Quem pode ver:</strong> fornecedores veem apenas o resumo que você
                  autorizar; a {ASSOCIACAO_DEMO} vê apenas contagens agregadas, e só se você
                  autorizar em separado.
                </li>
                <li>
                  <strong>Excluir ou corrigir:</strong> você pode corrigir ou cancelar a
                  solicitação a qualquer momento em “Acompanhar”.
                </li>
                <li>
                  <strong>Não informe:</strong> dados de clientes, conversas, senhas, documentos
                  ou informações financeiras sensíveis.
                </li>
              </ul>
            </DialogContent>
          </Dialog>
        </p>
      </div>

      {/* ---------- MODO ÁUDIO ---------- */}
      {modo === 'audio' && !revisandoAudio && (
        <section className="space-y-4 rounded-2xl border-2 border-stone-200 bg-white p-5 text-center">
          {g.estado === 'pronto' && (
            <>
              {g.erro === 'permissao' && (
                <p className="rounded-lg bg-amber-50 p-3 text-left text-sm text-amber-900" role="alert">
                  O microfone não foi liberado. Sem problema: você pode escrever ou usar o relato
                  de exemplo.
                </p>
              )}
              {g.erro === 'falha' && (
                <p className="rounded-lg bg-amber-50 p-3 text-left text-sm text-amber-900" role="alert">
                  Não foi possível captar o áudio agora. Tente de novo ou escreva.
                </p>
              )}
              {g.suportado ? (
                <>
                  <button
                    type="button"
                    onClick={g.iniciar}
                    className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#125435] text-white shadow-lg transition active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-400"
                    aria-label="Começar a gravar"
                  >
                    <Mic className="h-12 w-12" aria-hidden />
                  </button>
                  <p className="text-sm font-semibold text-stone-800">Toque para começar a gravar</p>
                  <p className="text-xs text-stone-500">Até {LIMITE} segundos. Você pode pausar.</p>
                </>
              ) : (
                <p className="rounded-lg bg-stone-100 p-3 text-left text-sm text-stone-700">
                  Este navegador não oferece transcrição de voz. Você pode escrever ou seguir com
                  o relato de exemplo.
                </p>
              )}
            </>
          )}

          {(g.estado === 'gravando' || g.estado === 'pausado') && (
            <>
              <div className="flex items-center justify-center gap-2" role="status" aria-live="polite">
                <span
                  className={`h-3 w-3 rounded-full ${g.estado === 'gravando' ? 'animate-pulse bg-red-600' : 'bg-stone-400'}`}
                  aria-hidden
                />
                <span className="text-sm font-semibold text-stone-800">
                  {g.estado === 'gravando' ? 'Gravando' : 'Pausado'}
                </span>
              </div>
              <p className="font-serif-title text-4xl tabular-nums text-stone-900">
                {tempo(g.segundos)}{' '}
                <span className="text-base text-stone-400">/ {tempo(LIMITE)}</span>
              </p>
              <p className="min-h-16 rounded-lg bg-stone-50 p-3 text-left text-sm text-stone-700">
                {g.texto || g.parcial ? (
                  <>
                    {g.texto} <span className="text-stone-400">{g.parcial}</span>
                  </>
                ) : (
                  <span className="text-stone-400">Sua fala aparece aqui em texto…</span>
                )}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {g.estado === 'gravando' ? (
                  <Button variant="outline" className="h-12 bg-white" onClick={g.pausar}>
                    <Pause className="mr-2 h-4 w-4" /> Pausar
                  </Button>
                ) : (
                  <Button variant="outline" className="h-12 bg-white" onClick={g.retomar}>
                    <Play className="mr-2 h-4 w-4" /> Retomar
                  </Button>
                )}
                <Button className="h-12 bg-[#125435] text-white hover:bg-emerald-900" onClick={g.finalizar}>
                  <Check className="mr-2 h-4 w-4" /> Concluir
                </Button>
              </div>
              <Button variant="ghost" className="text-stone-600" onClick={descartar}>
                <Trash2 className="mr-2 h-4 w-4" /> Descartar gravação
              </Button>
            </>
          )}

          {g.estado === 'pronto' && (
            <div className="space-y-2 border-t border-stone-100 pt-4">
              <Button
                variant="outline"
                className="h-12 w-full bg-white"
                onClick={() => setExemploAudio(true)}
              >
                Usar relato de exemplo
              </Button>
              <div className="flex justify-center">
                <SeloDemo>Transcrição de exemplo, sem gravar áudio</SeloDemo>
              </div>
            </div>
          )}
        </section>
      )}

      {revisandoAudio && (
        <section className="space-y-3 rounded-2xl border-2 border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-stone-800">Confira o texto antes de enviar</h2>
            {exemploAudio ? (
              <SeloDemo>Transcrição de exemplo</SeloDemo>
            ) : (
              <span className="text-xs text-stone-500">Duração: {tempo(g.segundos)}</span>
            )}
          </div>
          {!exemploAudio && !textoAudio.trim() && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="alert">
              Não conseguimos captar sua fala. Você pode gravar de novo ou digitar aqui embaixo.
            </p>
          )}
          <Textarea
            rows={7}
            value={textoAudio}
            onChange={(e) => setEditado(e.target.value)}
            aria-label="Texto do seu relato"
            className="bg-stone-50 text-base"
          />
          <p className="text-xs text-stone-500">
            A transcrição automática pode errar palavras. Corrija o que for preciso. O áudio não
            foi guardado.
          </p>
          <Button variant="ghost" className="text-stone-600" onClick={descartar}>
            <Trash2 className="mr-2 h-4 w-4" /> Descartar e gravar de novo
          </Button>
        </section>
      )}

      {/* ---------- MODO TEXTO ---------- */}
      {modo === 'texto' && (
        <section className="space-y-3 rounded-2xl border-2 border-stone-200 bg-white p-4">
          <Textarea
            rows={7}
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            placeholder="Ex.: Vendo pelo Instagram e pelo WhatsApp, mas o estoque nunca bate…"
            aria-label="Escreva o que está acontecendo na sua loja"
            className="bg-stone-50 text-base"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="bg-white" onClick={() => setDigitado(RELATO_EXEMPLO)}>
              Usar relato de exemplo
            </Button>
            <SeloDemo>Exemplo fictício</SeloDemo>
          </div>
        </section>
      )}

      {pareceTerDadoPessoal(texto) && (
        <p className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Seu relato parece conter um telefone ou documento. Remova antes de enviar.
        </p>
      )}

      {/* Troca de modo: o texto está sempre disponível */}
      <div className="flex items-center justify-between text-sm">
        <Link to="/" className="inline-flex items-center gap-1 text-stone-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>
        {modo === 'audio' ? (
          <button
            type="button"
            onClick={() => mudarModo('texto')}
            className="inline-flex items-center gap-1.5 font-semibold text-[#125435] underline underline-offset-2"
          >
            <Keyboard className="h-4 w-4" /> Prefiro escrever
          </button>
        ) : (
          <button
            type="button"
            onClick={() => mudarModo('audio')}
            className="inline-flex items-center gap-1.5 font-semibold text-[#125435] underline underline-offset-2"
          >
            <Mic className="h-4 w-4" /> Prefiro falar
          </button>
        )}
      </div>

      {/* Ação principal fixa no rodapé (alcance do polegar) */}
      {(modo === 'texto' || revisandoAudio) && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto max-w-xl space-y-1">
            <Button
              disabled={!pronto}
              onClick={enviar}
              className="h-12 w-full bg-[#125435] text-base font-semibold text-white hover:bg-emerald-900"
            >
              Enviar relato
            </Button>
            {!pronto && (
              <p className="text-center text-xs text-stone-500">
                Conte um pouco mais (pelo menos {MINIMO_CARACTERES} caracteres).
              </p>
            )}
          </div>
        </div>
      )}
    </Tela>
  )
}
