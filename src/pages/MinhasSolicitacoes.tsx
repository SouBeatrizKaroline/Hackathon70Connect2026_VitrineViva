// Pagina Minhas Solicitacoes (Timeline ao vivo com SSE)
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Building2,
  Rocket,
  Store,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { listDemands, listPilots, getLatestDiagnostic } from '@/services/vitrineService'
import type { DemandRecord, PilotRecord, DiagnosticRecord, DemandStatus } from '@/types/vitrine'
import pb from '@/lib/pocketbase/client'

const STEPPER_STAGES: { key: DemandStatus; label: string; actor: string }[] = [
  { key: 'recebida', label: 'Recebida', actor: 'Lojista' },
  { key: 'agrupada', label: 'Agrupada', actor: 'Associação' },
  { key: 'publicada', label: 'Desafio publicado', actor: 'Associação' },
  { key: 'proposta_recebida', label: 'Proposta recebida', actor: 'Startup' },
  { key: 'piloto_aprovado', label: 'Piloto aprovado', actor: 'Associação' },
]

export default function MinhasSolicitacoesPage() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticRecord | null>(null)
  const [demands, setDemands] = useState<DemandRecord[]>([])
  const [pilots, setPilots] = useState<PilotRecord[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const [diag, dmds, plts] = await Promise.all([
        getLatestDiagnostic(),
        listDemands(),
        listPilots(),
      ])
      setDiagnostic(diag)
      setDemands(dmds)
      setPilots(plts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Inscrição Realtime via SSE do PocketBase para atualizar ao vivo quando AC ou Startup agem
    const unsubDemandsPromise = pb.collection('demands').subscribe('*', (e) => {
      console.log('Realtime SSE demands update:', e.action)
      loadData()
    })
    const unsubPilotsPromise = pb.collection('pilots').subscribe('*', (e) => {
      console.log('Realtime SSE pilots update:', e.action)
      loadData()
    })

    return () => {
      unsubDemandsPromise.then((u) => u())
      unsubPilotsPromise.then((u) => u())
    }
  }, [])

  const getStageIndex = (status: DemandStatus): number => {
    const idx = STEPPER_STAGES.findIndex((s) => s.key === status)
    return idx === -1 ? 0 : idx
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#125435]">
            <ClipboardList className="w-4 h-4 text-amber-500" />
            <span>Acompanhamento do Lojista</span>
          </div>
          <h1 className="font-serif-title text-3xl sm:text-4xl text-stone-900 font-normal mt-1">
            Minhas solicitações e pilotos
          </h1>
          <p className="text-stone-600 text-sm">
            Linha do tempo ao vivo (SSE). Veja o andamento quando a associação e a startup interagem
            com a sua demanda.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="text-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar agora
        </Button>
      </div>

      {/* 2. Seção: Demandas Encaminhadas à Associação (com Stepper ao Vivo) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-title text-2xl text-stone-900 font-normal">
            Demandas no Radar da Associação
          </h2>
          <span className="text-xs text-stone-500">{demands.length} demanda(s) registrada(s)</span>
        </div>

        {demands.length === 0 && !loading && (
          <Card className="bg-white border border-stone-200 p-8 text-center space-y-3 rounded-xl">
            <div className="text-stone-600 text-sm">
              Você ainda não encaminhou demandas para a associação.
            </div>
            <Button asChild size="sm" className="bg-[#125435] text-white">
              <Link to="/diagnostico">Fazer diagnóstico agora</Link>
            </Button>
          </Card>
        )}

        <div className="space-y-4">
          {demands.map((dmd) => {
            const currentStageIdx = getStageIndex(dmd.status)
            return (
              <Card
                key={dmd.id}
                className="bg-white border-2 border-stone-200 rounded-xl p-5 sm:p-6 space-y-5 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-[#125435] border-0 text-xs">
                        {dmd.segment} · {dmd.municipality}
                      </Badge>
                      <span className="text-xs text-stone-400">Canal: {dmd.channel}</span>
                    </div>
                    <h3 className="font-serif-title text-xl text-stone-900 font-semibold mt-1">
                      {dmd.problem}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1">
                      <strong>Impacto:</strong> {dmd.impact} · <strong>Orçamento:</strong>{' '}
                      {dmd.budget_range}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className="self-start sm:self-auto capitalize text-xs bg-stone-50 text-stone-800 border-stone-300"
                  >
                    Status atual: {dmd.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Stepper Horizontal com os 5 estágios obrigatórios */}
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                    Linha de evolução na rede:
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {STEPPER_STAGES.map((stg, idx) => {
                      const isCompleted = idx < currentStageIdx
                      const isCurrent = idx === currentStageIdx
                      const isFuture = idx > currentStageIdx

                      return (
                        <div
                          key={stg.key}
                          className={`p-2.5 rounded-lg border flex flex-col justify-between text-xs transition-all ${
                            isCurrent
                              ? 'border-[#125435] bg-emerald-50 text-[#125435] font-semibold ring-2 ring-emerald-600/20'
                              : isCompleted
                                ? 'border-emerald-200 bg-stone-50 text-stone-700'
                                : 'border-stone-200 bg-stone-50/50 text-stone-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-bold text-stone-500">
                              Etapa {idx + 1}
                            </span>
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : isCurrent ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            ) : null}
                          </div>
                          <span className="font-medium text-xs leading-tight">{stg.label}</span>
                          <span className="text-[10px] text-stone-500 mt-1">Ator: {stg.actor}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 3. Seção: Pilotos Registrados (com Decisão) */}
      <div className="space-y-4 pt-4 border-t border-border/80">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-title text-2xl text-stone-900 font-normal">
            Pilotos e Decisões de Contratação
          </h2>
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link to="/piloto">Registrar novo piloto</Link>
          </Button>
        </div>

        {pilots.length === 0 && !loading && (
          <div className="p-6 bg-stone-50 rounded-xl text-center text-xs text-stone-500 border border-stone-200">
            Nenhum piloto registrado até o momento. Acesse uma solução para iniciar um teste de 7
            dias.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pilots.map((plt) => {
            const decisionColor = {
              continuar: 'bg-emerald-100 text-emerald-900 border-emerald-300',
              ajustar: 'bg-amber-100 text-amber-900 border-amber-300',
              encerrar: 'bg-red-100 text-red-900 border-red-300',
              pendente: 'bg-stone-100 text-stone-700 border-stone-300',
            }[plt.decision || 'pendente']

            return (
              <Card
                key={plt.id}
                className="bg-white border border-stone-200 p-5 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize font-semibold ${decisionColor}`}
                  >
                    Decisão: {plt.decision}
                  </Badge>
                  <span className="text-[11px] text-stone-400">Piloto simulado</span>
                </div>

                <div className="font-semibold text-stone-900 text-sm">{plt.goal}</div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded">
                  <div>
                    <span className="text-stone-500 block">Inicial:</span>
                    <span className="font-bold text-stone-800">{plt.initial_value} min</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Final alcançado:</span>
                    <span className="font-bold text-[#125435]">{plt.final_value || 45} min</span>
                  </div>
                </div>

                {plt.decision_reason && (
                  <p className="text-xs text-stone-600 italic bg-stone-50/50 p-2 rounded">
                    "{plt.decision_reason}"
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
