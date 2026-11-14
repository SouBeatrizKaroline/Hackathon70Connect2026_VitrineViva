// Pagina de Detalhe da Solucao
import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Store,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Calendar,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSolutionById } from '@/services/vitrineService'
import type { SolutionItem } from '@/types/vitrine'

export default function SolucaoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const [solution, setSolution] = useState<SolutionItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      getSolutionById(id).then((sol) => {
        setSolution(sol)
        setLoading(false)
      })
    }
  }, [id])

  if (loading) {
    return <div className="py-12 text-center text-stone-500">Carregando detalhes da solução...</div>
  }

  if (!solution) {
    return (
      <div className="py-12 text-center space-y-3">
        <div className="text-lg font-semibold text-stone-800">
          Solução não encontrada no catálogo.
        </div>
        <Button asChild variant="outline">
          <Link to="/recomendacoes">Voltar às recomendações</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900">
          <Link to="/recomendacoes">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar para Recomendações
          </Link>
        </Button>
        <span className="text-xs text-stone-400">ID do catálogo: {solution.id}</span>
      </div>

      {/* Header com Preço e Tagline */}
      <Card className="bg-white border-2 border-stone-200 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="p-6 sm:p-8 space-y-2 border-b border-stone-100">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-[#125435] border-0 text-xs">
                  {solution.interactive_test ? 'Teste interativo disponível' : 'Piloto guiado'}
                </Badge>
                <span className="text-xs text-stone-500">
                  Esforço: {solution.implementation_effort}
                </span>
              </div>
              <CardTitle className="font-serif-title text-3xl sm:text-4xl text-stone-900 font-normal mt-1">
                {solution.name}
              </CardTitle>
              <CardDescription className="text-stone-600 text-base mt-1 max-w-2xl leading-relaxed">
                {solution.tagline}
              </CardDescription>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-[#FAF7F0] p-4 rounded-xl border border-stone-200">
              <span className="text-xs text-stone-500 block uppercase font-bold tracking-wider">
                Simulação
              </span>
              <span className="font-serif-title text-3xl font-bold text-[#125435]">
                R$ {solution.price_monthly}
              </span>
              <span className="text-xs text-stone-500 block">por mês</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Descrição Longa */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              Sobre esta solução
            </h2>
            <p className="text-sm text-stone-700 leading-relaxed">{solution.description}</p>
          </div>

          {/* Três Blocos de Evidências Concretas Expandidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAF7F0] rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#125435]">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Por que combina com sua loja
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">{solution.why_matches}</p>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700">
                <Clock className="w-4 h-4 text-stone-500" />
                O que você vai precisar
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">{solution.what_needed}</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900">
                <Zap className="w-4 h-4 text-emerald-600" />
                O que consegue testar hoje
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">{solution.what_testable}</p>
            </div>
          </div>

          {/* Condições do Piloto de 7 dias */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs sm:text-sm">
            <div className="font-bold text-amber-950 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-800" />
              Condições sugeridas para o piloto:
            </div>
            <p className="text-amber-900 leading-relaxed">{solution.pilot_conditions}</p>
          </div>

          {/* Ações */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            {solution.interactive_test ? (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-[#125435] text-white hover:bg-emerald-900 font-semibold px-8 shadow-md"
              >
                <Link to={`/teste/${solution.id}`}>
                  <PlayCircle className="w-5 h-5 mr-2 text-amber-300" />
                  Testar com pedidos fictícios (RetomaZap)
                </Link>
              </Button>
            ) : (
              <div className="w-full sm:w-auto p-3 rounded-lg bg-stone-100 text-stone-600 text-xs border border-stone-200">
                ℹ️ Teste interativo com pedidos fictícios nesta versão está habilitado para a{' '}
                <strong>RetomaZap</strong>.
              </div>
            )}

            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-xs">
              <Link to="/recomendacoes">Ver outras opções</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
