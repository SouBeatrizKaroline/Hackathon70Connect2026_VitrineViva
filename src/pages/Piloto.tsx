// Pagina do Piloto de 7 dias com decisao
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  Clock,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { savePilot, getLatestDiagnostic, listPilots } from '@/services/vitrineService'
import type { PilotRecord, PilotDecision } from '@/types/vitrine'

export default function PilotoPage() {
  const navigate = useNavigate()

  const [diagnosticId, setDiagnosticId] = useState<string | undefined>(undefined)
  const [pilotRecordId, setPilotRecordId] = useState<string | undefined>(undefined)

  // Metas do piloto
  const [goal, setGoal] = useState('Reduzir o tempo de primeira resposta aos clientes no WhatsApp')
  const [initialValue, setInitialValue] = useState<number>(240) // 240 minutos = 4 horas
  const [finalValue, setFinalValue] = useState<number>(45) // 45 minutos após o piloto
  const [hasRecordedResult, setHasRecordedResult] = useState(true)

  // Decisão
  const [decision, setDecision] = useState<PilotDecision>('continuar')
  const [decisionReason, setDecisionReason] = useState(
    'A ferramenta organizou os retornos e nenhum cliente ficou sem resposta há mais de 1 hora.',
  )
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const diag = await getLatestDiagnostic()
      if (diag?.id) {
        setDiagnosticId(diag.id)
      }
      const pilots = await listPilots()
      if (pilots.length > 0) {
        const last = pilots[0]
        setPilotRecordId(last.id)
        if (last.goal) setGoal(last.goal)
        if (typeof last.initial_value === 'number') setInitialValue(last.initial_value)
        if (typeof last.final_value === 'number') {
          setFinalValue(last.final_value)
          setHasRecordedResult(true)
        }
        if (last.decision) setDecision(last.decision)
        if (last.decision_reason) setDecisionReason(last.decision_reason)
      }
    }
    load()
  }, [])

  // Cálculo da diferença e melhora percentual
  const diffMinutes = initialValue - finalValue // ex.: 240 - 45 = 195 min
  const improvementPercent = Math.round((diffMinutes / initialValue) * 100) // ex.: 81%

  const handleSaveDecision = async (selectedDecision: PilotDecision) => {
    setDecision(selectedDecision)
    setIsSaving(true)
    try {
      await savePilot({
        id: pilotRecordId,
        diagnostic: diagnosticId,
        goal,
        initial_value: initialValue,
        final_value: finalValue,
        difference: diffMinutes,
        decision: selectedDecision,
        decision_reason: decisionReason,
        is_simulated: true,
        is_demo: true,
      })

      const decisionLabels = {
        continuar: 'Continuar com a solução',
        ajustar: 'Solicitar ajustes no piloto',
        encerrar: 'Encerrar sem contratação',
      }

      toast({
        title: `Decisão salva: ${decisionLabels[selectedDecision]}`,
        description:
          'Resultado registrado e visível no painel Minhas Solicitações e nos indicadores da Associação.',
      })

      navigate('/minhas-solicitacoes')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Aviso',
        description: 'Erro ao registrar piloto: ' + (err?.message || 'Tente novamente.'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#125435]">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Piloto Guiado de 7 Dias</span>
          </div>
          <h1 className="font-serif-title text-3xl sm:text-4xl text-stone-900 font-normal mt-1">
            Acompanhe o piloto e registre sua decisão
          </h1>
          <p className="text-stone-600 text-sm">
            Toda contratação começa com um teste com meta clara. Você só continua se fizer sentido
            para o bolso.
          </p>
        </div>

        <Badge className="bg-amber-100 text-amber-900 border-amber-300 self-start sm:self-auto text-xs">
          Valores preenchidos pela demo (simulado)
        </Badge>
      </div>

      {/* 2. Formulário de Meta e Comparação */}
      <Card className="bg-white border-2 border-stone-200 shadow-sm rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Meta escolhida para o piloto:
          </label>
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="text-sm bg-stone-50 font-medium"
          />
          <span className="text-[11px] text-stone-400">
            Ex.: Reduzir o tempo de primeira resposta, recuperar orçamentos parados, zerar furos de
            estoque.
          </span>
        </div>

        {/* Comparação Inicial vs Final */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
          <div className="p-4 bg-stone-50 rounded-xl space-y-1 border border-stone-200">
            <span className="text-xs text-stone-500 font-medium">
              Valor inicial (antes do piloto)
            </span>
            <div className="font-serif-title text-2xl font-bold text-stone-800">
              4 horas (240 min)
            </div>
            <span className="text-[11px] text-amber-800 block">
              ★ valor preenchido pela demo (simulado)
            </span>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl space-y-1 border border-emerald-200">
            <span className="text-xs text-emerald-800 font-medium">
              Valor final simulado (após 7 dias)
            </span>
            <div className="font-serif-title text-2xl font-bold text-[#125435]">45 minutos</div>
            <span className="text-[11px] text-emerald-700 block">
              ★ simulação de resultado positivo da RetomaZap
            </span>
          </div>
        </div>

        {/* Barra Comparativa com Delta de Melhora */}
        <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#125435]/20 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-stone-800">Diferença simulada:</span>
            <span className="font-bold text-[#125435] flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              −3h15 · {improvementPercent}% no cenário simulado (não é resultado medido)
            </span>
          </div>

          <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden flex">
            <div className="bg-[#125435] h-full" style={{ width: '81%' }} />
            <div className="bg-amber-400 h-full" style={{ width: '19%' }} />
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span>Diferença simulada: 195 minutos por atendimento</span>
            <span>Simulação · meta ainda não medida</span>
          </div>
        </div>

        {/* Motivo Opcional da Decisão */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Observações ou motivo da sua decisão (opcional):
          </label>
          <Textarea
            rows={2}
            value={decisionReason}
            onChange={(e) => setDecisionReason(e.target.value)}
            className="text-xs bg-white"
          />
        </div>

        {/* Cartão de Decisão (3 botões obrigatórios: Continuar, Ajustar, Encerrar) */}
        <div className="pt-4 border-t border-stone-200 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-800 block">
            Qual é a sua decisão sobre a ferramenta?
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Opção 1: Continuar */}
            <Button
              size="lg"
              disabled={isSaving}
              onClick={() => handleSaveDecision('continuar')}
              className={`h-auto py-3.5 flex flex-col items-center justify-center gap-1 font-semibold ${
                decision === 'continuar'
                  ? 'bg-[#125435] text-white hover:bg-emerald-900 shadow-md border-2 border-emerald-950'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-amber-300" /> Continuar
              </div>
              <span className="text-[11px] opacity-90 font-normal">Aprovar e manter solução</span>
            </Button>

            {/* Opção 2: Ajustar */}
            <Button
              size="lg"
              variant="outline"
              disabled={isSaving}
              onClick={() => handleSaveDecision('ajustar')}
              className={`h-auto py-3.5 flex flex-col items-center justify-center gap-1 border-2 font-semibold ${
                decision === 'ajustar'
                  ? 'border-amber-600 bg-amber-50 text-amber-900'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-sm text-amber-900">Ajustar</div>
              <span className="text-[11px] text-stone-500 font-normal">
                Pedir alterações no piloto
              </span>
            </Button>

            {/* Opção 3: Encerrar */}
            <Button
              size="lg"
              variant="outline"
              disabled={isSaving}
              onClick={() => handleSaveDecision('encerrar')}
              className={`h-auto py-3.5 flex flex-col items-center justify-center gap-1 border-2 font-semibold ${
                decision === 'encerrar'
                  ? 'border-red-600 bg-red-50 text-red-900'
                  : 'border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-sm text-stone-800">Encerrar</div>
              <span className="text-[11px] text-stone-500 font-normal">
                Sem custo e sem vínculo
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
