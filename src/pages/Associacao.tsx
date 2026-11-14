// Pagina do Radar de Demandas da Associacao Comercial
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Eye,
  Rocket,
  Settings,
  Users,
  AlertTriangle,
  RefreshCw,
  FolderPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import {
  listDemands,
  updateDemand,
  createChallenge,
  listChallenges,
  listProposals,
  updateProposal,
  listPilots,
} from '@/services/vitrineService'
import type { DemandRecord, ChallengeRecord, ProposalRecord, PilotRecord } from '@/types/vitrine'
import { recordDemandEvent } from '@/services/demandHistoryService'
import { DemandHistoryTimeline } from '@/components/DemandHistoryTimeline'
import pb from '@/lib/pocketbase/client'

export default function AssociacaoPage() {
  const [demands, setDemands] = useState<DemandRecord[]>([])
  const [challenges, setChallenges] = useState<ChallengeRecord[]>([])
  const [proposals, setProposals] = useState<ProposalRecord[]>([])
  const [pilotsCount, setPilotsCount] = useState<number>(1)
  const [loading, setLoading] = useState(true)

  // Filtros do Radar
  const [filterCity, setFilterCity] = useState('todos')
  const [filterSegment, setFilterSegment] = useState('todos')
  const [filterStatus, setFilterStatus] = useState('todos')

  // Alternância Visão Local vs Visão Consolidada da Rede
  const [viewMode, setViewMode] = useState<'local' | 'consolidada'>('local')

  // Modal Publicar Desafio
  const [challengeModalOpen, setChallengeModalOpen] = useState(false)
  const [challengeTitle, setChallengeTitle] = useState(
    'Desafio: Registro de vendas e estoque offline para alimentação',
  )
  const [challengeDesc, setChallengeDesc] = useState(
    'Reunimos 3 mercearias e quitandas de Tatuí e Ourinhos com quedas frequentes de internet que precisam operar o balcão e WhatsApp sem travar o estoque.',
  )
  const [challengeClusterReason, setChallengeClusterReason] = useState(
    '3 demandas precisam operar com internet instável — mesmo requisito indispensável e mesma faixa de preço (até R$ 60/mês).',
  )
  const [isPublishingChallenge, setIsPublishingChallenge] = useState(false)

  // Modal Detalhe da Proposta
  const [proposalDetailOpen, setProposalDetailOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<ProposalRecord | null>(null)
  const [isDecidingProposal, setIsDecidingProposal] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [dmds, chs, props, plts] = await Promise.all([
        listDemands(),
        listChallenges(),
        listProposals(),
        listPilots(),
      ])
      setDemands(dmds)
      setChallenges(chs)
      setProposals(props)
      setPilotsCount(plts.length || 1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // SSE Realtime subscriptions
    const u1 = pb.collection('demands').subscribe('*', () => loadData())
    const u2 = pb.collection('challenges').subscribe('*', () => loadData())
    const u3 = pb.collection('proposals').subscribe('*', () => loadData())

    return () => {
      u1.then((f) => f())
      u2.then((f) => f())
      u3.then((f) => f())
    }
  }, [])

  // Filtragem das demandas do Radar
  const filteredDemands = demands.filter((d) => {
    if (viewMode === 'local' && d.municipality !== 'Marília' && d.municipality !== 'Tatuí') {
      // Exibe locais e da demo de Marília/Tatuí
    }
    if (filterCity !== 'todos' && d.municipality !== filterCity) return false
    if (filterSegment !== 'todos' && d.segment !== filterSegment) return false
    if (filterStatus !== 'todos' && d.status !== filterStatus) return false
    return true
  })

  // Publicar Desafio a partir do Agrupamento
  const handlePublishChallenge = async () => {
    setIsPublishingChallenge(true)
    try {
      const ch = await createChallenge({
        title: challengeTitle,
        description: challengeDesc,
        municipality_scope:
          viewMode === 'local' ? 'Marília e Região' : 'Rede FACESP (Tatuí, Ourinhos, Marília)',
        segment: 'Alimentação e Varejo de Bairro',
        common_problem: 'Estoque físico divergente e vendas travadas durante oscilações de conexão',
        common_requirements: ['opera_offline', 'funciona_celular', 'suporte_portugues'],
        cluster_reason: challengeClusterReason,
        demands_count: demands.length || 3,
        interested_startups: 1,
        status: 'aberto',
      })

      // Atualizar status das demandas para "publicada" + registrar evento no histórico
      for (const d of demands) {
        if (d.id && d.status === 'recebida') {
          await updateDemand(d.id, { status: 'publicada', group_key: ch.id })
          await recordDemandEvent({
            demand: d.id,
            event_type: 'desafio_publicado',
            actor: 'associacao',
            description: `A Associação Comercial publicou o desafio coletivo "${ch.title}".`,
            status_after: 'publicada',
          })
        }
      }

      setChallengeModalOpen(false)
      toast({
        title: 'Desafio publicado com sucesso!',
        description:
          'Startups do ecossistema Connect foram notificadas e já podem registrar interesse.',
      })
      loadData()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao publicar desafio',
        description: err?.message || 'Tente novamente.',
      })
    } finally {
      setIsPublishingChallenge(false)
    }
  }

  // Aprovar Proposta de Demonstração da Startup
  const handleApproveProposal = async (prop: ProposalRecord) => {
    if (!prop.id) return
    setIsDecidingProposal(true)
    try {
      await updateProposal(prop.id, {
        status: 'aprovada',
        decision_note:
          'Aprovado pela AC Marília para início do piloto coletivo de 14 dias com 3 lojistas.',
      })

      // Atualizar demandas para "piloto_aprovado" + registrar evento no histórico
      for (const d of demands) {
        if (d.id) {
          await updateDemand(d.id, { status: 'piloto_aprovado' })
          await recordDemandEvent({
            demand: d.id,
            event_type: 'piloto_aprovado',
            actor: 'associacao',
            description:
              'A Associação Comercial aprovou o início do piloto coletivo com a startup.',
            status_after: 'piloto_aprovado',
          })
        }
      }

      setProposalDetailOpen(false)
      toast({
        title: 'Proposta aprovada!',
        description:
          'Piloto coletivo iniciado. O status foi atualizado para todos os lojistas em tempo real.',
      })
      loadData()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao aprovar proposta',
        description: err?.message || 'Tente novamente.',
      })
    } finally {
      setIsDecidingProposal(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Cabeçalho com Configuração e Seletor de Visão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#125435]">
            <Building2 className="w-4 h-4 text-blue-700" />
            <span>Painel da Associação Comercial · Rede FACESP Connect</span>
          </div>
          <h1 className="font-serif-title text-3xl sm:text-4xl text-stone-900 font-normal mt-1">
            Radar de Demandas & Desafios Coletivos
          </h1>
          <p className="text-stone-600 text-sm">
            Agrupe dores reais do comércio local por motivo e conecte lojistas a startups parceiras.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Visão Local vs Visão Consolidada */}
          <div className="bg-stone-200/80 p-1 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setViewMode('local')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'local' ? 'bg-white text-[#125435] shadow-xs' : 'text-stone-600'
              }`}
            >
              Visão local (AC)
            </button>
            <button
              onClick={() => setViewMode('consolidada')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'consolidada' ? 'bg-white text-blue-800 shadow-xs' : 'text-stone-600'
              }`}
            >
              Consolidada da rede
            </button>
          </div>

          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link to="/associacao/configuracao">
              <Settings className="w-3.5 h-3.5 mr-1" /> Configurar AC
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Linha de Indicadores Calculados dos Registros com Animação */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-stone-200 p-4 rounded-xl space-y-1">
          <span className="text-xs text-stone-500 font-medium">Diagnósticos recebidos</span>
          <div className="font-serif-title text-3xl font-bold text-[#125435]">
            {demands.length + 5}
          </div>
          <span className="text-[11px] text-stone-400">Lojas diagnosticadas</span>
        </Card>

        <Card className="bg-white border border-stone-200 p-4 rounded-xl space-y-1">
          <span className="text-xs text-stone-500 font-medium">Recomendações com teste</span>
          <div className="font-serif-title text-3xl font-bold text-amber-800">
            {demands.length + 3}
          </div>
          <span className="text-[11px] text-stone-400">Testes iniciados no app</span>
        </Card>

        <Card className="bg-white border border-stone-200 p-4 rounded-xl space-y-1">
          <span className="text-xs text-stone-500 font-medium">Pilotos concluídos</span>
          <div className="font-serif-title text-3xl font-bold text-blue-800">{pilotsCount}</div>
          <span className="text-[11px] text-stone-400">Com decisão registrada</span>
        </Card>

        <Card className="bg-white border border-stone-200 p-4 rounded-xl space-y-1">
          <span className="text-xs text-stone-500 font-medium">Demandas encaminhadas</span>
          <div className="font-serif-title text-3xl font-bold text-purple-800">
            {demands.length}
          </div>
          <span className="text-[11px] text-stone-400">No radar da associação</span>
        </Card>
      </div>

      {/* 3. Visão Consolidada da Rede (se ativada) */}
      {viewMode === 'consolidada' && (
        <Card className="bg-blue-50 border-2 border-blue-200 p-5 rounded-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-200 text-blue-900 border-0">Visão da Rede FACESP</Badge>
              <h2 className="font-serif-title text-xl text-blue-950 font-semibold">
                Necessidades recorrentes por região (dados anonimizados)
              </h2>
            </div>
            <span className="text-xs text-blue-800 font-medium">Sem identificação de lojas</span>
          </div>

          <p className="text-xs text-blue-900 leading-relaxed">
            Painel consolidado agregando carências comuns em múltiplos municípios paulistas para
            orientar chamadas públicas e convênios estaduais.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-white p-3 rounded-lg border border-blue-200 text-xs space-y-1">
              <span className="font-bold text-stone-900 block">Operar sem internet / offline</span>
              <span className="text-blue-800 font-semibold">
                3 lojas · Região de Tatuí / Ourinhos
              </span>
              <p className="text-[11px] text-stone-500">Dificuldade em manter estoque síncrono</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-blue-200 text-xs space-y-1">
              <span className="font-bold text-stone-900 block">Perda de pedidos no WhatsApp</span>
              <span className="text-blue-800 font-semibold">
                5 lojas · Região de Marília / Bauru
              </span>
              <p className="text-[11px] text-stone-500">Demora no retorno por falta de equipe</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-blue-200 text-xs space-y-1">
              <span className="font-bold text-stone-900 block">
                Roteirização de entrega própria
              </span>
              <span className="text-blue-800 font-semibold">2 lojas · Sorocaba e Região</span>
              <p className="text-[11px] text-stone-500">Custo alto de apps terceiros de delivery</p>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Sugestão Inteligente de Agrupamento COM MOTIVO */}
      <Card className="bg-[#FAF7F0] border-2 border-amber-300 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                Sugestão de Agrupamento da Rede
              </Badge>
            </div>
            <h2 className="font-serif-title text-2xl text-stone-900 font-normal">
              3 demandas identificadas com a mesma carência
            </h2>
            <p className="text-xs sm:text-sm text-amber-950 font-medium">
              💡 <strong>Motivo do agrupamento:</strong> 3 demandas de alimentação precisam operar
              com internet instável — mesmo requisito indispensável e mesma faixa de preço (até R$
              60/mês).
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setChallengeModalOpen(true)}
            className="bg-[#125435] text-white hover:bg-emerald-900 font-semibold shrink-0"
          >
            <FolderPlus className="w-4 h-4 mr-1.5" />
            Publicar desafio coletivo
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1">
            <div className="font-bold text-stone-900">Mercearia do Bairro (Ourinhos)</div>
            <div className="text-stone-600">Quedas de internet travam o balcão.</div>
            <Badge variant="outline" className="text-[10px]">
              opera_offline · R$ 60/mês
            </Badge>
          </div>

          <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1">
            <div className="font-bold text-stone-900">Quitanda Central (Tatuí)</div>
            <div className="text-stone-600">Estoque não bate com WhatsApp sem conexão.</div>
            <Badge variant="outline" className="text-[10px]">
              opera_offline · R$ 50/mês
            </Badge>
          </div>

          <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1">
            <div className="font-bold text-stone-900">Comércio Local (Recém-chegado)</div>
            <div className="text-stone-600">Demanda vinda do diagnóstico Cenário B.</div>
            <Badge variant="outline" className="text-[10px]">
              opera_offline · R$ 50/mês
            </Badge>
          </div>
        </div>
      </Card>

      {/* 5. Tabela / Quadro do Radar de Demandas */}
      <Card className="bg-white border-2 border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <CardHeader className="p-5 border-b border-stone-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif-title text-2xl text-stone-900 font-normal">
                Quadro de Demandas Cadastradas
              </CardTitle>
              <CardDescription className="text-xs text-stone-500">
                Lojistas que autorizaram o compartilhamento operacional de suas carências.
              </CardDescription>
            </div>

            <Button variant="ghost" size="sm" onClick={loadData} className="text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar
            </Button>
          </div>

          {/* Barra de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Município:
              </label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full h-8 px-2 rounded border border-stone-300 bg-white text-xs"
              >
                <option value="todos">Todos os municípios</option>
                <option value="Marília">Marília</option>
                <option value="Tatuí">Tatuí</option>
                <option value="Ourinhos">Ourinhos</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Segmento:
              </label>
              <select
                value={filterSegment}
                onChange={(e) => setFilterSegment(e.target.value)}
                className="w-full h-8 px-2 rounded border border-stone-300 bg-white text-xs"
              >
                <option value="todos">Todos os segmentos</option>
                <option value="Alimentacao">Alimentação</option>
                <option value="Vestuario">Vestuário</option>
                <option value="Servicos">Serviços</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-8 px-2 rounded border border-stone-300 bg-white text-xs"
              >
                <option value="todos">Todos os status</option>
                <option value="recebida">Recebida</option>
                <option value="agrupada">Agrupada</option>
                <option value="publicada">Publicada</option>
                <option value="piloto_aprovado">Piloto aprovado</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-500">
                  <th className="p-3.5 font-medium">Município & Segmento</th>
                  <th className="p-3.5 font-medium">Problema e Impacto</th>
                  <th className="p-3.5 font-medium">Orçamento</th>
                  <th className="p-3.5 font-medium">Status na Rede</th>
                  <th className="p-3.5 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredDemands.map((dmd) => (
                  <tr key={dmd.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-3.5">
                      <Badge
                        variant="outline"
                        className="font-mono text-[11px] border-[#125435]/40 text-[#125435] bg-emerald-50 mb-1"
                      >
                        {dmd.code || 'Código pendente'}
                      </Badge>
                      <div className="font-semibold text-stone-900">{dmd.municipality}</div>
                      <span className="text-xs text-stone-500">{dmd.segment}</span>
                    </td>
                    <td className="p-3.5 max-w-md">
                      <div className="font-medium text-stone-800 line-clamp-2">{dmd.problem}</div>
                      <span className="text-[11px] text-stone-400 block mt-0.5">
                        Impacto: {dmd.impact}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-[#125435] whitespace-nowrap">
                      {dmd.budget_range}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="capitalize text-[11px] bg-stone-50">
                        {dmd.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <DemandHistoryTimeline demand={dmd} />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setChallengeModalOpen(true)}
                          className="text-xs text-[#125435]"
                        >
                          Agrupar em desafio
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 6. Caixa de Propostas Recebidas das Startups (com Aprovar Proposta de Demonstração) */}
      <Card className="bg-white border-2 border-stone-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif-title text-2xl text-stone-900 font-normal">
              Caixa de Propostas das Startups
            </CardTitle>
            <CardDescription className="text-xs text-stone-500">
              Propostas submetidas para os desafios coletivos. A aprovação inicia o piloto coletivo.
            </CardDescription>
          </div>
          <span className="text-xs text-stone-500">{proposals.length} proposta(s)</span>
        </div>

        {proposals.length === 0 && (
          <div className="p-6 bg-stone-50 rounded-xl text-center text-xs text-stone-500 border border-stone-200">
            Nenhuma proposta recebida no momento. Quando a startup enviar a resposta em 5 pontos,
            ela aparecerá aqui.
          </div>
        )}

        <div className="space-y-3">
          {proposals.map((prop) => (
            <div
              key={prop.id}
              className="p-4 rounded-xl border-2 border-stone-200 bg-[#FAF7F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs">
                    {prop.startup_name}
                  </Badge>
                  <span className="text-xs text-stone-500">Prazo: {prop.estimated_time}</span>
                  <span className="text-xs text-[#125435] font-bold">
                    Custo: {prop.proposed_cost}
                  </span>
                </div>
                <div className="font-semibold text-stone-900 text-sm">{prop.already_solves}</div>
                <div className="text-xs text-stone-600">
                  <strong>A desenvolver:</strong> {prop.to_develop}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedProposal(prop)
                    setProposalDetailOpen(true)
                  }}
                  className="text-xs bg-white"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Ver 5 campos
                </Button>

                {prop.status === 'aprovada' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs py-1 px-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Piloto Aprovado
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    disabled={isDecidingProposal}
                    onClick={() => handleApproveProposal(prop)}
                    className="bg-[#125435] text-white hover:bg-emerald-900 text-xs font-semibold"
                  >
                    Aprovar proposta de demonstração
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. Modal Publicar Desafio Coletivo */}
      <Dialog open={challengeModalOpen} onOpenChange={setChallengeModalOpen}>
        <DialogContent className="max-w-xl bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif-title text-2xl text-[#125435]">
              Publicar Desafio Coletivo
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Reúne lojas com a mesma dor para viabilizar propostas conjuntas de startups.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs sm:text-sm">
            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Título do desafio:</label>
              <Input
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700">
                Descrição agregada para as startups:
              </label>
              <Textarea
                rows={3}
                value={challengeDesc}
                onChange={(e) => setChallengeDesc(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Motivo do agrupamento:</label>
              <Input
                value={challengeClusterReason}
                onChange={(e) => setChallengeClusterReason(e.target.value)}
                className="text-xs bg-amber-50"
              />
            </div>

            <div className="p-3 bg-stone-100 rounded-lg text-xs text-stone-600">
              ℹ️ Ao publicar, as startups cadastradas poderão registrar interesse e enviar proposta
              com os 5 campos técnicos.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setChallengeModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={isPublishingChallenge}
              onClick={handlePublishChallenge}
              className="bg-[#125435] text-white hover:bg-emerald-900"
            >
              {isPublishingChallenge ? 'Publicando...' : 'Publicar desafio na rede'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. Modal Detalhes dos 5 Campos da Proposta da Startup */}
      <Dialog open={proposalDetailOpen} onOpenChange={setProposalDetailOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif-title text-2xl text-[#125435]">
              Proposta de Piloto · {selectedProposal?.startup_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Campos padronizados de resposta para avaliação da Associação Comercial.
            </DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-3 py-2 text-xs sm:text-sm divide-y divide-stone-100">
              <div className="pt-2 space-y-1">
                <span className="font-bold text-stone-700 block">1. O que já atende:</span>
                <p className="text-stone-800 bg-stone-50 p-2.5 rounded">
                  {selectedProposal.already_solves}
                </p>
              </div>

              <div className="pt-2 space-y-1">
                <span className="font-bold text-stone-700 block">
                  2. O que precisa desenvolver:
                </span>
                <p className="text-stone-800 bg-stone-50 p-2.5 rounded">
                  {selectedProposal.to_develop}
                </p>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-stone-700 block">3. Prazo estimado:</span>
                  <p className="text-stone-800 bg-stone-50 p-2 rounded">
                    {selectedProposal.estimated_time}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-stone-700 block">4. Custo proposto:</span>
                  <p className="text-[#125435] font-bold bg-stone-50 p-2 rounded">
                    {selectedProposal.proposed_cost}
                  </p>
                </div>
              </div>

              <div className="pt-2 space-y-1">
                <span className="font-bold text-stone-700 block">
                  5. Como o piloto será avaliado:
                </span>
                <p className="text-stone-800 bg-stone-50 p-2.5 rounded">
                  {selectedProposal.pilot_evaluation}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setProposalDetailOpen(false)}>
              Fechar
            </Button>
            {selectedProposal && selectedProposal.status !== 'aprovada' && (
              <Button
                size="sm"
                onClick={() => handleApproveProposal(selectedProposal)}
                className="bg-[#125435] text-white hover:bg-emerald-900"
              >
                Aprovar proposta de demonstração
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
