// Tela 1 — Início mobile-first: falar ou escrever em até dois toques.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mic,
  Keyboard,
  ShieldCheck,
  ArrowRight,
  Building2,
  Rocket,
  PlayCircle,
  RotateCcw,
  ClipboardList,
} from 'lucide-react'
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
import { SeloDemo } from '@/components/jornada/Passos'
import { useTour } from '@/context/TourContext'
import { limparJornada, useJornada } from '@/lib/jornada/store'

const ATALHOS = [
  { rotulo: 'Vender melhor pelo digital', tema: 'vender_digital' },
  { rotulo: 'Organizar estoque e pedidos', tema: 'estoque_canais' },
  { rotulo: 'Automatizar tarefas', tema: 'atendimento' },
  { rotulo: 'Encontrar um sistema', tema: 'gestao' },
]

export default function Index() {
  const { startScenarioA, startScenarioB, restartDemo } = useTour()
  const { demandas } = useJornada()
  const [resetOpen, setResetOpen] = useState(false)
  const emAndamento = demandas.find((d) => d.status !== 'cancelada' && d.status !== 'concluida')

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 pb-12 animate-fade-in">
      <section className="space-y-3 pt-2">
        <h1 className="font-serif-title text-3xl leading-tight text-stone-900 sm:text-4xl">
          O que você gostaria de melhorar na sua loja?
        </h1>
        <p className="text-base leading-relaxed text-stone-600">
          Pode falar do seu jeito. Não precisa saber o nome da tecnologia.
        </p>
      </section>

      <section className="space-y-3">
        <Button
          asChild
          className="h-16 w-full rounded-2xl bg-[#125435] text-lg font-semibold text-white shadow-md hover:bg-emerald-900"
        >
          <Link to="/relatar?modo=audio">
            <Mic className="mr-3 h-6 w-6 text-amber-300" aria-hidden />
            Gravar áudio
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-14 w-full rounded-2xl border-2 border-[#125435] bg-white text-base font-semibold text-[#125435]"
        >
          <Link to="/relatar?modo=texto">
            <Keyboard className="mr-3 h-5 w-5" aria-hidden />
            Prefiro escrever
          </Link>
        </Button>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Ou comece por um assunto
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {ATALHOS.map((a) => (
            <Link
              key={a.tema}
              to={`/relatar?modo=texto&tema=${a.tema}`}
              className="flex min-h-14 items-center rounded-xl border border-stone-200 bg-[#FAF7F0] px-3 py-2 text-sm font-medium text-stone-800 hover:border-[#125435]"
            >
              {a.rotulo}
            </Link>
          ))}
        </div>
      </section>

      <p className="flex items-center justify-center gap-2 text-xs text-stone-500">
        <ShieldCheck className="h-4 w-4 text-[#125435]" aria-hidden />
        Você revisa tudo antes de compartilhar.
      </p>

      {emAndamento && (
        <Link
          to={`/acompanhar?demanda=${emAndamento.id}`}
          className="flex items-center justify-between gap-3 rounded-xl border-2 border-[#125435]/30 bg-emerald-50/60 p-4"
        >
          <span className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 shrink-0 text-[#125435]" aria-hidden />
            <span className="text-sm">
              <strong className="block text-stone-900">Você tem uma solicitação em andamento</strong>
              <span className="text-stone-600">{emAndamento.entendimento.objetivo}</span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#125435]" aria-hidden />
        </Link>
      )}

      {/* Outros perfis */}
      <section className="space-y-2 border-t border-stone-200 pt-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Outros perfis da rede
        </h2>
        <Link
          to="/radar"
          className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3.5 hover:border-[#125435]"
        >
          <span className="flex items-center gap-3 text-sm">
            <Building2 className="h-5 w-5 shrink-0 text-blue-800" aria-hidden />
            <span>
              <strong className="block text-stone-900">Sou da associação</strong>
              <span className="text-stone-600">Radar de necessidades e oportunidades coletivas</span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
        </Link>
        <Link
          to="/startup"
          className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3.5 hover:border-[#125435]"
        >
          <span className="flex items-center gap-3 text-sm">
            <Rocket className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
            <span>
              <strong className="block text-stone-900">Sou fornecedor ou startup</strong>
              <span className="text-stone-600">Desafios publicados e envio de proposta</span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
        </Link>
      </section>

      {/* Apoio à apresentação */}
      <details className="rounded-xl border border-stone-200 bg-[#FAF7F0] p-4">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#125435]">
          <PlayCircle className="h-4 w-4" aria-hidden />
          Apresentar à banca
        </summary>
        <div className="mt-3 space-y-2">
          <p className="text-xs text-stone-600">
            Roteiros guiados do protótipo anterior (diagnóstico em formulário, teste e desafio
            coletivo) e reinício dos dados fictícios.
          </p>
          <Button onClick={startScenarioA} variant="outline" className="h-11 w-full justify-start bg-white">
            Cenário A · Lojista testa uma solução
          </Button>
          <Button onClick={startScenarioB} variant="outline" className="h-11 w-full justify-start bg-white">
            Cenário B · Associação abre desafio coletivo
          </Button>
          <Button
            variant="outline"
            onClick={() => setResetOpen(true)}
            className="h-11 w-full justify-start bg-white text-stone-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar dados da demonstração
          </Button>
        </div>
      </details>

      <p className="flex flex-wrap items-center justify-center gap-2 text-center text-xs text-stone-400">
        <SeloDemo>Protótipo</SeloDemo>
        Hackathon 7.0 Connect · FACESP. Empresas, preços e resultados são fictícios.
      </p>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif-title text-xl text-stone-900">
              Reiniciar todos os dados da demonstração?
            </AlertDialogTitle>
            <AlertDialogDescription>
              As solicitações deste aparelho são apagadas e os dados fictícios do painel voltam ao
              estado inicial. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#125435] text-white hover:bg-emerald-900"
              onClick={() => {
                setResetOpen(false)
                limparJornada()
                void restartDemo()
              }}
            >
              Sim, reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
