// Pagina do Perfil Startup e Desafios Abertos
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Rocket,
  Building2,
  CheckCircle2,
  Send,
  Eye,
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import {
  listChallenges,
  createProposal,
  listProposals,
  updateChallenge,
} from '@/services/vitrineService'
import type { ChallengeRecord, ProposalRecord } from '@/types/vitrine'
import { recordProposalEventsForChallenge } from '@/services/demandHistoryService'
import { ChallengeDemandHistory } from '@/components/ChallengeDemandHistory'
import { ChallengeClusterReason } from '@/components/ChallengeClusterReason'
import pb from '@/lib/pocketbase/client'

export default function StartupPage() {
  const [challenges, setChallenges] = useState<ChallengeRecord[]>([])
  const [myProposals, setMyProposals] = useState<ProposalRecord[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeRecord | null>(null)

  // 5 campos obrigatórios da resposta da startup
  const [alreadySolves, setAlreadySolves] = useState(
    'Módulo de PDV e emissão de cupom não fiscal que roda localmente em aplicativo Android/PWA no celular ou tablet.',
  )
  const [toDevelop, setToDevelop] = useState(
    'Fila de sincronização automática com webhook do WhatsApp para atualizar o saldo quando a internet for restabelecida.',
  )
  const [estimatedTime, setEstimatedTime] = useState('14 dias de implantação guiada')
  const [proposedCost, setProposedCost] = useState('R$ 49/mês por loja durante o piloto coletivo')
  const [pilotEvaluation, setPilotEvaluation] = useState(
    'Avaliar se o lojista consegue vender sem travar por 7 dias seguidos e zerar furos de estoque na sincronização.',
  )

  const [hasInterest, setHasInterest] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  async function loadData() {
    const [chs, props] = await Promise.all([listChallenges(), listProposals()])
    setChallenges(chs)
    setMyProposals(props)
    if (chs.length > 0 && !selectedChallenge) {
      setSelectedChallenge(chs[0])
    }
  }

  useEffect(() => {
    loadData()

    // Realtime SSE
    const u1 = pb.collection('challenges').subscribe('*', () => loadData())
    const u2 = pb.collection('proposals').subscribe('*', () => loadData())
    const u3 = pb.collection('demand_events').subscribe('*', () => {
      setRefreshKey((k) => k + 1)
    })

    return () => {
      u1.then((f) => f())
      u2.then((f) => f())
      u3.then((f) => f())
    }
  }, [])

  const handleToggleInterest = async (ch: ChallengeRecord) => {
    if (!ch.id) return
    const current = !hasInterest[ch.id]
    const updated = !current
    setHasInterest((prev) => ({ ...prev, [ch.id || '']: updated }))

    const newCount = (ch.interested_startups || 0) + (updated ? 1 : -1)
    await updateChallenge(ch.id, { interested_startups: Math.max(0, newCount) })

    toast({
      title: updated ? 'Interesse registrado!' : 'Interesse removido',
      description: updated
        ? 'A Associação Comercial foi notificada do seu interesse neste desafio.'
        : 'Registro de interesse atualizado.',
    })
    loadData()
  }

  const handleSubmitProposal = async () => {
    if (!selectedChallenge?.id) {
      toast({
        variant: 'destructive',
        title: 'Selecione um desafio',
        description: 'Escolha um desafio aberto para enviar sua proposta.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createProposal({
        challenge: selectedChallenge.id,
        startup_name: 'ConectaVarejo Labs (Startup demo)',
        already_solves: alreadySolves,
        to_develop: toDevelop,
        estimated_time: estimatedTime,
        proposed_cost: proposedCost,
        pilot_evaluation: pilotEvaluation,
        status: 'enviada',
      })

      // Registra o evento no histórico das demandas agrupadas neste desafio
      await recordProposalEventsForChallenge(
        selectedChallenge.id,
        'ConectaVarejo Labs (Startup demo)',
      )

      toast({
        title: 'Proposta enviada com sucesso!',
        description:
          'Sua proposta com os 5 campos já está disponível na caixa da Associação Comercial.',
      })
      loadData()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar proposta',
        description: err?.message || 'Tente novamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#125435]">
            <Rocket className="w-4 h-4 text-amber-600" />
            <span>Ecossistema Connect · Perfil Startup</span>
          </div>
          <h1 className="font-serif-title text-3xl sm:text-4xl text-stone-900 font-normal mt-1">
            Desafios Abertos & Envio de Propostas
          </h1>
          <p className="text-stone-600 text-sm">
            Atenda demandas agrupadas e validadas por Associações Comerciais sem custo de prospecção
            porta a porta.
          </p>
        </div>

        <Badge className="bg-amber-100 text-amber-900 border-amber-300 self-start sm:self-auto text-xs">
          Acesso Demo · ConectaVarejo Labs
        </Badge>
      </div>

      {/* 2. Grid de Desafios Abertos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-title text-2xl text-stone-900 font-normal">
            Desafios Coletivos Publicados ({challenges.length})
          </h2>
          <span className="text-xs text-stone-500">
            Dados operacionais aprovados pelos lojistas
          </span>
        </div>

        {challenges.length === 0 && (
          <div className="p-8 bg-white border border-stone-200 rounded-xl text-center text-sm text-stone-600">
            Nenhum desafio aberto no momento. Acesse como Associação Comercial para publicar um
            desafio a partir do radar.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((ch) => {
            const isSelected = selectedChallenge?.id === ch.id
            const interested = !hasInterest[ch.id || '']

            return (
              <Card
                key={ch.id}
                onClick={() => setSelectedChallenge(ch)}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all space-y-3 ${
                  isSelected
                    ? 'border-[#125435] bg-emerald-50/40 ring-2 ring-emerald-600/20'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-100 text-[#125435] border-0 text-xs">
                    {ch.demands_count || 3} lojas reunidas
                  </Badge>
                  <span className="text-xs text-stone-500">{ch.municipality_scope}</span>
                </div>

                <h3 className="font-serif-title text-xl text-stone-900 font-semibold">
                  {ch.title}
                </h3>

                <p className="text-xs text-stone-600 leading-relaxed">{ch.description}</p>

                <ChallengeClusterReason reason={ch.cluster_reason} />

                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <Button
                    size="sm"
                    variant={interested ? 'secondary' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleInterest(ch)
                    }}
                    className="text-xs h-7"
                  >
                    {interested ? '✓ Interesse registrado' : 'Registrar interesse'}
                  </Button>

                  <span className="text-xs text-[#125435] font-semibold">
                    {isSelected ? 'Desafio selecionado' : 'Clique para responder'}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 3. Formulário de Resposta com EXATAMENTE os 5 Campos Solicitados */}
      {selectedChallenge && (
        <Card className="bg-white border-2 border-[#125435] rounded-xl p-6 sm:p-8 space-y-6 shadow-md">
          <div className="border-b border-stone-100 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#125435]">
              Formulário oficial de resposta da startup
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-stone-900 font-normal mt-0.5">
              Enviar proposta para: {selectedChallenge.title}
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              Preencha os cinco campos de avaliação. O resumo será avaliado pela Associação
              Comercial responsável.
            </p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* Campo 1 */}
            <div className="space-y-1">
              <label className="font-bold text-stone-800 block">1. O que já atende:</label>
              <Textarea
                rows={2}
                value={alreadySolves}
                onChange={(e) => setAlreadySolves(e.target.value)}
                className="text-xs bg-stone-50"
              />
            </div>

            {/* Campo 2 */}
            <div className="space-y-1">
              <label className="font-bold text-stone-800 block">
                2. O que precisa desenvolver:
              </label>
              <Textarea
                rows={2}
                value={toDevelop}
                onChange={(e) => setToDevelop(e.target.value)}
                className="text-xs bg-stone-50"
              />
            </div>

            {/* Campos 3 e 4 em linha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-stone-800 block">3. Prazo estimado:</label>
                <Input
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  className="text-xs bg-stone-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800 block">
                  4. Custo proposto para o piloto:
                </label>
                <Input
                  value={proposedCost}
                  onChange={(e) => setProposedCost(e.target.value)}
                  className="text-xs bg-stone-50"
                />
              </div>
            </div>

            {/* Campo 5 */}
            <div className="space-y-1">
              <label className="font-bold text-stone-800 block">
                5. Como o piloto será avaliado:
              </label>
              <Textarea
                rows={2}
                value={pilotEvaluation}
                onChange={(e) => setPilotEvaluation(e.target.value)}
                className="text-xs bg-stone-50"
              />
            </div>
          </div>

          {/* Histórico coletivo das demandas agrupadas neste desafio */}
          <ChallengeDemandHistory challengeId={selectedChallenge.id} refreshKey={refreshKey} />

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100">
            <span className="text-xs text-stone-500">
              💡 A aprovação da associação notificará os lojistas em tempo real.
            </span>
            <Button
              size="lg"
              disabled={isSubmitting}
              onClick={handleSubmitProposal}
              className="w-full sm:w-auto bg-[#125435] text-white hover:bg-emerald-900 font-semibold px-8"
            >
              {isSubmitting ? 'Enviando proposta...' : 'Enviar proposta com os 5 campos'}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* 4. Minhas Propostas Enviadas */}
      <div className="space-y-4 pt-4 border-t border-border/80">
        <h2 className="font-serif-title text-2xl text-stone-900 font-normal">
          Minhas Propostas Submetidas ({myProposals.length})
        </h2>

        {myProposals.length === 0 && (
          <div className="p-6 bg-stone-50 rounded-xl text-center text-xs text-stone-500 border border-stone-200">
            Nenhuma proposta enviada ainda. Selecione um desafio acima e envie seu plano.
          </div>
        )}

        <div className="space-y-3">
          {myProposals.map((p) => (
            <Card
              key={p.id}
              className="p-4 rounded-xl border border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs ${
                      p.status === 'aprovada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'recusada'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    Status: {p.status}
                  </Badge>
                  <span className="text-xs text-stone-500">Custo: {p.proposed_cost}</span>
                  <span className="text-xs text-stone-500">Prazo: {p.estimated_time}</span>
                </div>
                <div className="font-semibold text-stone-900 text-sm">{p.already_solves}</div>
                {p.decision_note && (
                  <div className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded">
                    <strong>Parecer da AC:</strong> {p.decision_note}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
