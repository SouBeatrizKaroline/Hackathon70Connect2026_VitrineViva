// Pagina de Detalhe do Desafio
import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Rocket, ArrowLeft, Building2, Users, Send, Calendar, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { getChallengeById, createProposal } from '@/services/vitrineService'
import { recordProposalEventsForChallenge } from '@/services/demandHistoryService'
import type { ChallengeRecord } from '@/types/vitrine'

export default function DesafioDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const [challenge, setChallenge] = useState<ChallengeRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const [alreadySolves, setAlreadySolves] = useState('PDV Android com banco SQLite local offline')
  const [toDevelop, setToDevelop] = useState(
    'Sincronização com retornos do WhatsApp em segundo plano',
  )
  const [estimatedTime, setEstimatedTime] = useState('14 dias')
  const [proposedCost, setProposedCost] = useState('R$ 49/mês por loja no piloto')
  const [pilotEvaluation, setPilotEvaluation] = useState('7 dias operando sem travamentos')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      getChallengeById(id).then((ch) => {
        setChallenge(ch)
        setLoading(false)
      })
    }
  }, [id])

  const handleSubmit = async () => {
    if (!id) return
    setIsSubmitting(true)
    try {
      await createProposal({
        challenge: id,
        startup_name: 'ConectaVarejo Labs (Startup demo)',
        already_solves: alreadySolves,
        to_develop: toDevelop,
        estimated_time: estimatedTime,
        proposed_cost: proposedCost,
        pilot_evaluation: pilotEvaluation,
        status: 'enviada',
      })

      // Registra o evento no histórico das demandas agrupadas neste desafio
      await recordProposalEventsForChallenge(id, 'ConectaVarejo Labs (Startup demo)')

      toast({
        title: 'Proposta registrada!',
        description: 'Enviada para a Associação Comercial responsável.',
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err?.message || 'Falha ao registrar proposta.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-stone-500">Carregando detalhes do desafio...</div>
  }

  if (!challenge) {
    return (
      <div className="py-12 text-center space-y-3">
        <div className="text-lg font-semibold text-stone-800">Desafio não encontrado.</div>
        <Button asChild variant="outline">
          <Link to="/startup">Voltar aos desafios</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-16">
      <Button asChild variant="ghost" size="sm">
        <Link to="/startup">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar para Startups
        </Link>
      </Button>

      <Card className="bg-white border-2 border-stone-200 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <Badge className="bg-emerald-100 text-[#125435]">
            {challenge.demands_count || 3} negócios reunidos
          </Badge>
          <span className="text-xs text-stone-500">{challenge.municipality_scope}</span>
        </div>

        <h1 className="font-serif-title text-3xl text-stone-900 font-normal">{challenge.title}</h1>

        <p className="text-sm text-stone-700 leading-relaxed">{challenge.description}</p>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950">
          <strong>Motivo do agrupamento:</strong> {challenge.cluster_reason}
        </div>
      </Card>

      <Card className="bg-white border-2 border-[#125435] p-6 rounded-xl space-y-4">
        <h2 className="font-serif-title text-2xl text-stone-900 font-normal">
          Enviar proposta (5 campos técnicos)
        </h2>

        <div className="space-y-3 text-xs sm:text-sm">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">1. O que já atende:</label>
            <Textarea
              rows={2}
              value={alreadySolves}
              onChange={(e) => setAlreadySolves(e.target.value)}
            />
          </div>
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              2. O que precisa desenvolver:
            </label>
            <Textarea rows={2} value={toDevelop} onChange={(e) => setToDevelop(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">3. Prazo estimado:</label>
              <Input value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">4. Custo proposto:</label>
              <Input value={proposedCost} onChange={(e) => setProposedCost(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              5. Como o piloto será avaliado:
            </label>
            <Textarea
              rows={2}
              value={pilotEvaluation}
              onChange={(e) => setPilotEvaluation(e.target.value)}
            />
          </div>
        </div>

        <Button
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="w-full bg-[#125435] text-white hover:bg-emerald-900"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar proposta'}
        </Button>
      </Card>
    </div>
  )
}
