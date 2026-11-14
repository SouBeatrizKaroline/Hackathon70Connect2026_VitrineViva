// Pagina de Recomendacoes Transparentes
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Store,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Building2,
  Check,
  X,
  PlayCircle,
  Eye,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
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
  listSolutions,
  getLatestDiagnostic,
  saveDiagnostic,
  createDemand,
} from '@/services/vitrineService'
import type { SolutionItem, DiagnosticRecord, ChannelKey, ObjectiveKey } from '@/types/vitrine'

const CHANNEL_LABELS: Record<ChannelKey, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  loja_fisica: 'Loja física / balcão',
  site: 'Site / loja virtual',
  telefone: 'Telefone',
}

const GOAL_LABELS: Record<ObjectiveKey, string> = {
  vender_mais: 'vender mais',
  responder_rapido: 'responder mais rápido',
  recuperar_pedidos: 'recuperar pedidos',
  controlar_estoque: 'controlar o estoque',
  organizar_entregas: 'organizar entregas',
}

export default function RecomendacoesPage() {
  const navigate = useNavigate()

  const [diagnostic, setDiagnostic] = useState<DiagnosticRecord | null>(null)
  const [solutions, setSolutions] = useState<SolutionItem[]>([])
  const [loading, setLoading] = useState(true)

  // Comparação (até 3)
  const [comparedIds, setComparedIds] = useState<string[]>([])
  const [showHowWeChoose, setShowHowWeChoose] = useState(false)

  // Ajuste rápido de orçamento inline para testar recomputação imediata
  const [budgetQuick, setBudgetQuick] = useState<number>(100)

  // Modal "Pedir apoio da minha associação"
  const [demandModalOpen, setDemandModalOpen] = useState(false)
  const [demandProblem, setDemandProblem] = useState('')
  const [demandImpact, setDemandImpact] = useState(
    'Perda de vendas em horários de pico e retrabalho manual',
  )
  const [demandChannel, setDemandChannel] = useState('Loja física e WhatsApp')
  const [demandBudget, setDemandBudget] = useState('Até R$ 50/mês')
  const [demandRestrictions, setDemandRestrictions] = useState(
    'Sinal de internet cai várias vezes ao dia',
  )
  const [demandDesiredResult, setDemandDesiredResult] = useState(
    'Vender sem travar no balcão e sincronizar quando a internet voltar',
  )
  const [demandConsent, setDemandConsent] = useState(false)
  const [isSubmittingDemand, setIsSubmittingDemand] = useState(false)

  // Carregar diagnóstico e catálogo
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [diag, sols] = await Promise.all([getLatestDiagnostic(), listSolutions()])
        setDiagnostic(diag)
        if (diag && typeof diag.budget_max === 'number') {
          setBudgetQuick(diag.budget_max)
          setDemandProblem(
            diag.free_text ||
              'Preciso registrar vendas no balcão e WhatsApp mesmo com internet instável.',
          )
          setDemandChannel(diag.channels?.join(', ') || 'WhatsApp e Loja física')
          setDemandBudget(`Até R$ ${diag.budget_max}/mês`)
        }
        setSolutions(sols)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Recomputar recomendações transparentes com base nas regras:
  // 1. Filtrar requisitos obrigatórios e teto de orçamento
  // 2. Ordenar elegíveis por objetivo atendido, canal usado, esforço baixo e facilidade de teste
  const mandatoryReqs = diagnostic?.mandatory_requirements || []
  const goals = diagnostic?.goal || []
  const channels = diagnostic?.channels || []

  // Classificar soluções em Elegíveis vs Excluídas
  const eligibleSolutions: { item: SolutionItem; score: number; matchReasons: string[] }[] = []
  const excludedSolutions: { item: SolutionItem; reason: string }[] = []

  for (const sol of solutions) {
    const reasons: string[] = []

    // Checagem de orçamento
    if (sol.price_monthly > budgetQuick) {
      excludedSolutions.push({
        item: sol,
        reason: `Preço de R$ ${sol.price_monthly}/mês acima do seu teto de R$ ${budgetQuick}/mês.`,
      })
      continue
    }

    // Checagem de requisitos obrigatórios
    let failedMandatory = false
    for (const req of mandatoryReqs) {
      if (!sol.mandatory_supported?.includes(req)) {
        failedMandatory = true
        const reqNames: Record<string, string> = {
          funciona_celular: 'funcionar no celular',
          suporte_portugues: 'suporte em português',
          opera_offline: 'operar com internet instável',
          dispensa_troca_sistema: 'dispensar troca do sistema atual',
        }
        excludedSolutions.push({
          item: sol,
          reason: `Não atende ao requisito obrigatório: ${reqNames[req] || req}.`,
        })
        break
      }
    }
    if (failedMandatory) continue

    // Pontuação de compatibilidade
    let score = 50

    // Objetivos atendidos
    const matchedGoals = sol.objectives?.filter((g) => goals.includes(g)) || []
    score += matchedGoals.length * 20

    // Canais compatíveis
    const matchedChannels = sol.channels?.filter((c) => channels.includes(c)) || []
    score += matchedChannels.length * 15

    // Esforço e facilidade de teste
    if (sol.implementation_effort === 'baixo') score += 15
    if (sol.trial_ease === 'imediato') score += 20

    // DOIS motivos específicos usando os dados do diagnóstico
    const specificReasons: string[] = [
      `Cabe no seu orçamento de R$ ${budgetQuick} por mês — custa R$ ${sol.price_monthly}/mês.`,
    ]
    if (matchedChannels.length > 0) {
      specificReasons.push(
        `Funciona com seu canal de vendas: ${matchedChannels
          .map((c) => CHANNEL_LABELS[c] || c)
          .join(' e ')}.`,
      )
    } else if (matchedGoals.length > 0) {
      specificReasons.push(`Ajuda exatamente no seu objetivo de ${GOAL_LABELS[matchedGoals[0]]}.`)
    } else if (sol.implementation_effort === 'baixo') {
      specificReasons.push('Implantação simples, sem trocar o sistema que você já usa.')
    } else {
      specificReasons.push('Compatível com o perfil geral da sua loja no diagnóstico.')
    }

    // Ponto de atenção quando houver
    let attentionPoint: string | undefined
    const slack = budgetQuick - sol.price_monthly
    if (slack <= Math.max(10, budgetQuick * 0.25)) {
      attentionPoint = `Fica perto do seu teto: sobram só R$ ${slack} por mês de folga.`
    } else if (sol.trial_ease !== 'imediato') {
      attentionPoint =
        sol.trial_ease === 'sete_dias'
          ? 'O teste não é imediato: são até 7 dias para começar.'
          : 'O teste precisa de agendamento com a solução.'
    } else if (sol.implementation_effort !== 'baixo') {
      attentionPoint = 'A implantação exige algum esforço da sua equipe antes de rodar.'
    } else if (diagnostic?.main_channel && !sol.channels?.includes(diagnostic.main_channel)) {
      attentionPoint = `Não cobre o seu canal principal (${CHANNEL_LABELS[diagnostic.main_channel]}).`
    }

    eligibleSolutions.push({
      item: sol,
      score,
      matchReasons: specificReasons,
    })
    ;(eligibleSolutions[eligibleSolutions.length - 1] as any).attentionPoint = attentionPoint
  }

  // Ordenar elegíveis pelo score descendente
  eligibleSolutions.sort((a, b) => b.score - a.score)

  const toggleCompare = (id: string) => {
    setComparedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id)
      if (prev.length >= 3) {
        toast({
          title: 'Limite de comparação',
          description: 'Você pode comparar no máximo 3 opções lado a lado.',
        })
        return prev
      }
      return [...prev, id]
    })
  }

  const handleBudgetQuickChange = async (newVal: number) => {
    setBudgetQuick(newVal)
    if (diagnostic?.id) {
      await saveDiagnostic({
        id: diagnostic.id,
        budget_max: newVal,
      })
      toast({
        title: 'Orçamento atualizado',
        description: `Recomendações recalculadas para até R$ ${newVal}/mês.`,
      })
    }
  }

  const handleSendDemand = async () => {
    if (!demandConsent) {
      toast({
        variant: 'destructive',
        title: 'Consentimento obrigatório',
        description: 'Por favor, marque a autorização para encaminhar este resumo à associação.',
      })
      return
    }

    setIsSubmittingDemand(true)
    try {
      await createDemand({
        diagnostic: diagnostic?.id,
        store_name: `Comércio de ${diagnostic?.municipality || 'Marília'}`,
        municipality: diagnostic?.municipality || 'Marília',
        segment: diagnostic?.segment || 'Vestuario',
        problem: demandProblem,
        impact: demandImpact,
        channel: demandChannel,
        requirements: diagnostic?.mandatory_requirements || [],
        budget_range: demandBudget,
        restrictions: demandRestrictions,
        desired_result: demandDesiredResult,
        consent: true,
        status: 'recebida',
      })

      if (diagnostic?.id) {
        await saveDiagnostic({
          id: diagnostic.id,
          status: 'encaminhada',
        })
      }

      setDemandModalOpen(false)
      toast({
        title: 'Demanda encaminhada com sucesso!',
        description:
          'Sua Associação Comercial foi notificada. Acompanhe o andamento no painel de solicitações.',
      })
      navigate('/minhas-solicitacoes')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Falha ao encaminhar demanda',
        description: err?.message || 'Tente novamente.',
      })
    } finally {
      setIsSubmittingDemand(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#125435]">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Recomendações da Vitrine Viva</span>
          </div>
          <h1 className="font-serif-title text-3xl sm:text-4xl text-stone-900 font-normal mt-1">
            Soluções compatíveis com a sua loja
          </h1>
          <p className="text-stone-600 text-sm">
            {diagnostic?.municipality
              ? `Perfil: ${diagnostic.segment} em ${diagnostic.municipality} · Orçamento até R$ ${budgetQuick}/mês.`
              : 'Ordenadas por compatibilidade de canal, objetivos e facilidade de teste.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link to="/diagnostico">Refazer diagnóstico</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHowWeChoose(!showHowWeChoose)}
            className="text-xs text-[#125435] flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Como escolhemos?{' '}
            {showHowWeChoose ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* 2. Seção Explicativa "Como Escolhemos" (Regras Transparentes) */}
      {showHowWeChoose && (
        <Card className="bg-[#FAF7F0] border-2 border-emerald-900/20 rounded-xl p-5 space-y-3 animate-slide-down">
          <h2 className="font-serif-title text-xl text-[#125435] font-semibold">
            Regras abertas de seleção (sem leilão pago)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
            <div className="space-y-1">
              <strong>1º Filtro Eliminatório:</strong> Excluímos qualquer solução que ultrapasse seu
              teto de orçamento ou que não cumpra todos os requisitos indispensáveis que você marcou
              (ex.: operar offline ou ter suporte em português).
            </div>
            <div className="space-y-1">
              <strong>2º Ordenação por Mérito:</strong> Classificamos as elegíveis somando pontos
              por objetivos atendidos, canais que você já usa, menor esforço de implantação e
              possibilidade de teste imediato nesta vitrine.
            </div>
          </div>
        </Card>
      )}

      {/* 3. Barra de Reatividade Rápida de Orçamento */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#125435]" /> Simulação de orçamento ativo:
          </span>
          <p className="text-xs text-stone-500">
            Altere para ver a lista de soluções mudar imediatamente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-serif-title text-xl font-bold text-[#125435]">
            R$ {budgetQuick}/mês
          </span>
          <div className="flex items-center gap-1.5">
            {[40, 50, 79, 100, 150].map((v) => (
              <button
                key={v}
                onClick={() => handleBudgetQuickChange(v)}
                className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                  budgetQuick === v
                    ? 'bg-[#125435] text-white border-[#125435]'
                    : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                R$ {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Estado de NENHUMA COBERTURA (Cenário B e casos de restrição estrita) */}
      {eligibleSolutions.length === 0 && !loading && (
        <Card className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-800" />
            </div>
            <div className="space-y-2">
              <Badge className="bg-amber-200 text-amber-900 border-0 text-xs">
                Sem cobertura pronta no catálogo
              </Badge>
              <h2 className="font-serif-title text-2xl sm:text-3xl text-amber-950 font-normal">
                Nenhuma solução atende 100% dos seus requisitos no momento
              </h2>
              <p className="text-sm text-amber-900 leading-relaxed max-w-2xl">
                Isto é comum no comércio local do interior quando se precisa de funções raras (como
                operar totalmente offline) com orçamento muito reduzido (R$ {budgetQuick}/mês). Em
                vez de vender algo que não funciona, sua Associação Comercial pode intervir e abrir
                um desafio coletivo!
              </p>
            </div>
          </div>

          {/* Requisitos sem cobertura */}
          <div className="bg-white/80 border border-amber-200 p-4 rounded-lg space-y-2 text-xs sm:text-sm">
            <div className="font-semibold text-amber-950">Requisitos que travaram o catálogo:</div>
            <ul className="list-disc pl-5 space-y-1 text-amber-900">
              {mandatoryReqs.includes('opera_offline') && (
                <li>
                  <strong>Operar com internet instável:</strong> A maioria das ferramentas atuais
                  exige conexão contínua na nuvem.
                </li>
              )}
              <li>
                <strong>Teto de orçamento de R$ {budgetQuick}/mês:</strong> Ferramentas mais
                completas com banco local custam a partir de R$ 199.
              </li>
            </ul>
          </div>

          {/* Soluções próximas e motivo da exclusão */}
          {excludedSolutions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-950">
                Soluções próximas no catálogo e por que foram excluídas:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {excludedSolutions.slice(0, 2).map(({ item, reason }) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded-lg border border-amber-200 text-xs space-y-1"
                  >
                    <div className="font-bold text-stone-900">
                      {item.name} · R$ {item.price_monthly}/mês
                    </div>
                    <div className="text-amber-800 font-medium">Motivo da exclusão: {reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ação Primária: Pedir Apoio da Associação */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Button
              size="lg"
              onClick={() => setDemandModalOpen(true)}
              className="w-full sm:w-auto bg-[#125435] text-white hover:bg-emerald-900 font-semibold shadow-md"
            >
              <Building2 className="w-4 h-4 mr-2 text-amber-300" />
              Pedir apoio da minha associação (Criar demanda)
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleBudgetQuickChange(100)}
              className="w-full sm:w-auto text-xs bg-white"
            >
              Testar com orçamento de R$ 100/mês
            </Button>
          </div>
        </Card>
      )}

      {/* 5. Lista de Resultados Elegíveis */}
      {eligibleSolutions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {eligibleSolutions.length} soluções encontradas para seu perfil
            </span>
            {comparedIds.length > 0 && (
              <span className="text-xs text-[#125435] font-medium">
                {comparedIds.length} selecionada(s) para comparar
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {eligibleSolutions.map(({ item, score, matchReasons, attentionPoint }) => {
              const isCompared = comparedIds.includes(item.id)
              return (
                <Card
                  key={item.id}
                  className="bg-white border-2 border-stone-200 hover:border-[#125435] transition-all shadow-sm rounded-xl overflow-hidden"
                >
                  <CardHeader className="p-5 sm:p-6 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="font-serif-title text-2xl sm:text-3xl text-stone-900 font-normal">
                            {item.name}
                          </CardTitle>
                          {item.interactive_test && (
                            <Badge className="bg-emerald-100 text-[#125435] border-emerald-300 text-xs">
                              ⭐ Teste interativo disponível
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-stone-600 text-sm mt-1 max-w-2xl leading-relaxed">
                          {item.tagline}
                        </CardDescription>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="font-serif-title text-2xl font-bold text-[#125435]">
                          R$ {item.price_monthly}
                        </span>
                        <span className="text-xs text-stone-500 block">por mês na simulação</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 sm:p-6 pt-0 space-y-4">
                    {/* DOIS motivos específicos + ponto de atenção, baseados no diagnóstico */}
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#125435] block">
                        Por que recomendamos para a sua loja
                      </span>
                      <ul className="space-y-1.5">
                        {matchReasons.map((r) => (
                          <li key={r} className="flex items-start gap-2 text-xs text-stone-800">
                            <Check className="w-3.5 h-3.5 text-[#125435] shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                      {attentionPoint && (
                        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong>Ponto de atenção: </strong>
                            {attentionPoint}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Três Blocos com Evidências Concretas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-stone-100">
                      {/* Bloco 1: Por que combina com sua loja */}
                      <div className="bg-[#FAF7F0] p-3.5 rounded-lg space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#125435] block">
                          Por que combina com sua loja
                        </span>
                        <p className="text-xs text-stone-700 leading-relaxed">{item.why_matches}</p>
                      </div>

                      {/* Bloco 2: O que você vai precisar */}
                      <div className="bg-stone-50 p-3.5 rounded-lg space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                          O que você vai precisar
                        </span>
                        <p className="text-xs text-stone-600 leading-relaxed">{item.what_needed}</p>
                      </div>

                      {/* Bloco 3: O que consegue testar hoje */}
                      <div className="bg-emerald-50/70 p-3.5 rounded-lg space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
                          O que consegue testar hoje
                        </span>
                        <p className="text-xs text-stone-700 leading-relaxed">
                          {item.what_testable}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação do Card */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`compare-${item.id}`}
                          checked={isCompared}
                          onCheckedChange={() => toggleCompare(item.id)}
                        />
                        <label
                          htmlFor={`compare-${item.id}`}
                          className="text-xs font-medium text-stone-700 cursor-pointer select-none"
                        >
                          Comparar lado a lado
                        </label>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <Button asChild variant="outline" size="sm" className="text-xs">
                          <Link to={`/solucao/${item.id}`}>Ver detalhes</Link>
                        </Button>

                        {item.interactive_test ? (
                          <Button
                            asChild
                            size="sm"
                            className="bg-[#125435] text-white hover:bg-emerald-900 font-semibold text-xs"
                          >
                            <Link to={`/teste/${item.id}`}>
                              <PlayCircle className="w-4 h-4 mr-1.5 text-amber-300" />
                              Testar com pedidos fictícios
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            size="sm"
                            className="bg-stone-800 text-white hover:bg-stone-900 text-xs"
                          >
                            <Link to={`/solucao/${item.id}`}>Ver condições do piloto</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 6. Tabela de Comparação Lado a Lado (quando ≥ 2 selecionadas) */}
      {comparedIds.length >= 2 && (
        <Card className="bg-white border-2 border-[#125435] rounded-xl shadow-lg p-5 sm:p-6 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="font-serif-title text-2xl text-[#125435] font-normal">
              Comparação detalhada ({comparedIds.length} soluções)
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setComparedIds([])}
              className="text-xs text-stone-500 hover:text-stone-900"
            >
              Limpar comparação
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="p-3 text-stone-500 font-normal w-1/4">Critério</th>
                  {comparedIds.map((id) => {
                    const sol = solutions.find((s) => s.id === id)
                    return (
                      <th key={id} className="p-3 font-serif-title text-lg text-stone-900">
                        {sol?.name}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="p-3 font-semibold text-stone-700">Preço mensal</td>
                  {comparedIds.map((id) => {
                    const sol = solutions.find((s) => s.id === id)
                    return (
                      <td key={id} className="p-3 font-bold text-[#125435]">
                        R$ {sol?.price_monthly}/mês
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-stone-700">Esforço de implantação</td>
                  {comparedIds.map((id) => {
                    const sol = solutions.find((s) => s.id === id)
                    return (
                      <td key={id} className="p-3 capitalize">
                        {sol?.implementation_effort}
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-stone-700">Requisitos cumpridos</td>
                  {comparedIds.map((id) => {
                    const sol = solutions.find((s) => s.id === id)
                    return (
                      <td key={id} className="p-3 text-xs text-stone-600">
                        {sol?.mandatory_supported?.join(', ') || 'Nenhum listado'}
                      </td>
                    )
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-stone-700">Condições do piloto</td>
                  {comparedIds.map((id) => {
                    const sol = solutions.find((s) => s.id === id)
                    return (
                      <td key={id} className="p-3 text-xs text-stone-600">
                        {sol?.pilot_conditions}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 7. Modal "Pedir apoio da minha associação" (Resumo de Demanda Editável com Consentimento) */}
      <Dialog open={demandModalOpen} onOpenChange={setDemandModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif-title text-2xl text-[#125435]">
              Pedir apoio da minha Associação Comercial
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-stone-600">
              Seu resumo de demanda foi pré-preenchido com base no diagnóstico. Você pode ajustar
              cada campo antes de enviar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs sm:text-sm">
            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Problema enfrentado:</label>
              <Textarea
                rows={2}
                value={demandProblem}
                onChange={(e) => setDemandProblem(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Impacto no trabalho:</label>
                <Input
                  value={demandImpact}
                  onChange={(e) => setDemandImpact(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Canal utilizado:</label>
                <Input
                  value={demandChannel}
                  onChange={(e) => setDemandChannel(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Faixa de orçamento:</label>
                <Input
                  value={demandBudget}
                  onChange={(e) => setDemandBudget(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-700">Restrições operacionais:</label>
                <Input
                  value={demandRestrictions}
                  onChange={(e) => setDemandRestrictions(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700">Resultado desejado:</label>
              <Textarea
                rows={2}
                value={demandDesiredResult}
                onChange={(e) => setDemandDesiredResult(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Caixa de Transparência e Consentimento Obrigatório */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-800" /> A associação poderá ver:
              </div>
              <p className="text-amber-900 leading-relaxed">
                Município, segmento, relato do problema, canais, requisitos indispensáveis e faixa
                de orçamento. Nenhum dado pessoal sensível (como CPF ou faturamento contábil) é
                compartilhado.
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                <Checkbox
                  id="consent-check"
                  checked={demandConsent}
                  onCheckedChange={(c) => setDemandConsent(!!c)}
                />
                <label
                  htmlFor="consent-check"
                  className="font-semibold text-amber-950 cursor-pointer"
                >
                  Autorizo encaminhar este resumo à minha associação comercial.
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setDemandModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={isSubmittingDemand}
              onClick={handleSendDemand}
              className="bg-[#125435] text-white hover:bg-emerald-900"
            >
              {isSubmittingDemand ? 'Encaminhando...' : 'Confirmar e encaminhar'}
              <Send className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
