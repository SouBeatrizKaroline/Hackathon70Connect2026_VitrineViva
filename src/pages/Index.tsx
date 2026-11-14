// Home da Vitrine Viva — Rede de Soluções
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass,
  Building2,
  Rocket,
  ArrowRight,
  Sparkles,
  ClipboardList,
  Search,
  FlaskConical,
  CalendarClock,
  PlayCircle,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useTour } from '@/context/TourContext'

const FLOW_STEPS = [
  {
    icon: ClipboardList,
    title: '1. Diagnóstico',
    text: 'Você conta, em 3 passos rápidos, o que trava as vendas da sua loja.',
  },
  {
    icon: Search,
    title: '2. Recomendações',
    text: 'Regras abertas: sem leilão pago, só compatibilidade real com o seu perfil.',
  },
  {
    icon: FlaskConical,
    title: '3. Teste prático',
    text: 'Experimente a solução com pedidos fictícios antes de decidir qualquer coisa.',
  },
  {
    icon: CalendarClock,
    title: '4. Piloto de 7 dias',
    text: 'Indicadores antes e depois para decidir com o lojista no comando.',
  },
]

const ENTRY_CARDS = [
  {
    to: '/diagnostico',
    icon: Compass,
    title: 'Encontrar uma solução',
    text: 'Responda o diagnóstico do lojista e veja soluções compatíveis com seu canal, orçamento e requisitos.',
    cta: 'Começar diagnóstico',
    accent: 'bg-emerald-50 text-[#125435]',
    border: 'hover:border-[#125435]',
  },
  {
    to: '/associacao',
    icon: Building2,
    title: 'Explorar como associação',
    text: 'Acompanhe o radar de demandas, o agrupamento por motivo e os desafios coletivos da Rede FACESP.',
    cta: 'Abrir painel da associação',
    accent: 'bg-blue-50 text-blue-800',
    border: 'hover:border-blue-700',
  },
  {
    to: '/startup',
    icon: Rocket,
    title: 'Explorar como startup',
    text: 'Veja os desafios publicados pelas associações e envie uma proposta de piloto em 5 pontos.',
    cta: 'Abrir painel da startup',
    accent: 'bg-amber-50 text-amber-800',
    border: 'hover:border-amber-600',
  },
]

export default function Index() {
  const { startScenarioA, startScenarioB, restartDemo } = useTour()
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <div className="animate-fade-in pb-16">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#FAF7F0] to-white border-b border-stone-200">
        <div className="container mx-auto px-4 py-14 sm:py-20 max-w-4xl text-center space-y-6">
          <Badge className="bg-[#125435] text-white border-0 text-xs font-semibold px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
            Hackathon 7.0 Connect · FACESP
          </Badge>

          <h1 className="font-serif-title text-4xl sm:text-5xl lg:text-6xl text-stone-900 font-normal leading-tight">
            Conte o que trava suas vendas.{' '}
            <span className="text-[#125435]">Descubra o que você pode testar.</span>
          </h1>

          <p className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            A Vitrine Viva conecta o comércio local do interior paulista a soluções digitais
            verificadas — com diagnóstico transparente, teste prático e piloto com acompanhamento da
            Associação Comercial.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-[#125435] text-white hover:bg-emerald-900 font-semibold shadow-md"
            >
              <Link to="/diagnostico">
                <Compass className="w-4 h-4 mr-2 text-amber-300" />
                Encontrar uma solução
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white text-[#125435] border-[#125435] font-semibold"
            >
              <Link to="/recomendacoes">Ver como escolhemos as soluções</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="container mx-auto px-4 pt-12">
        <h2 className="font-serif-title text-2xl sm:text-3xl text-stone-900 font-normal text-center">
          Como funciona a jornada
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {FLOW_STEPS.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="bg-white border border-stone-200 rounded-xl p-5 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#125435] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-serif-title text-lg text-stone-900 font-semibold">{title}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pontos de entrada */}
      <section className="container mx-auto px-4 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ENTRY_CARDS.map(({ to, icon: Icon, title, text, cta, accent, border }) => (
            <Link key={to} to={to} className="group">
              <Card
                className={`bg-white border-2 border-stone-200 rounded-xl h-full transition-all shadow-sm group-hover:shadow-md ${border}`}
              >
                <CardContent className="p-6 space-y-3 flex flex-col h-full">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif-title text-xl text-stone-900 font-semibold">{title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed flex-1">{text}</p>
                  <span className="text-sm font-semibold text-[#125435] inline-flex items-center gap-1.5">
                    {cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Demonstração para a banca */}
      <section className="container mx-auto px-4 pt-12">
        <Card className="bg-[#FAF7F0] border-2 border-emerald-900/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-[#125435]" />
            <h2 className="font-serif-title text-xl text-[#125435] font-semibold">
              Apresentar à banca
            </h2>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed max-w-3xl">
            Percorra os dois casos de demonstração com indicador de etapa, ou restaure todos os
            dados fictícios ao estado semente antes de começar.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
            <Button
              onClick={startScenarioA}
              className="bg-[#125435] text-white hover:bg-emerald-900 font-semibold"
            >
              <PlayCircle className="w-4 h-4 mr-2 text-amber-300" />
              Cenário A · Lojista encontra e testa uma solução
            </Button>
            <Button
              onClick={startScenarioB}
              className="bg-amber-700 text-white hover:bg-amber-800 font-semibold"
            >
              <PlayCircle className="w-4 h-4 mr-2 text-amber-200" />
              Cenário B · Associação abre desafio coletivo
            </Button>
            <Button
              variant="outline"
              onClick={() => setResetOpen(true)}
              className="bg-white text-stone-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar dados da demonstração
            </Button>
          </div>
        </Card>
      </section>

      {/* Nota de rodapé */}
      <p className="container mx-auto px-4 pt-10 text-center text-xs text-stone-400">
        Protótipo Hackathon 7.0 Connect · FACESP — dados fictícios para fins de demonstração.
      </p>

      {/* Confirmação de reset */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif-title text-xl text-stone-900">
              Reiniciar todos os dados da demonstração?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Diagnósticos, testes, pilotos, demandas e propostas voltam ao estado semente inicial.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#125435] text-white hover:bg-emerald-900"
              onClick={() => {
                setResetOpen(false)
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
