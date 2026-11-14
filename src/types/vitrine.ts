export type ObjectiveKey =
  | 'vender_mais'
  | 'responder_rapido'
  | 'recuperar_pedidos'
  | 'controlar_estoque'
  | 'organizar_entregas'

export type ChannelKey = 'whatsapp' | 'instagram' | 'loja_fisica' | 'site' | 'telefone'

export type MandatoryRequirementKey =
  | 'funciona_celular'
  | 'suporte_portugues'
  | 'opera_offline'
  | 'dispensa_troca_sistema'

export type ImplementationEffort = 'baixo' | 'medio' | 'alto'
export type TrialEase = 'imediato' | 'sete_dias' | 'agendado'

export type DiagnosticStatus =
  | 'rascunho'
  | 'diagnosticado'
  | 'com_recomendacao'
  | 'em_teste'
  | 'piloto_criado'
  | 'sem_cobertura'
  | 'encaminhada'

export type DemandStatus =
  | 'recebida'
  | 'agrupada'
  | 'publicada'
  | 'proposta_recebida'
  | 'piloto_aprovado'
  | 'encerrada'

export type PilotDecision = 'pendente' | 'continuar' | 'ajustar' | 'encerrar'

export type UserRole = 'lojista' | 'associacao' | 'startup' | 'admin'

export interface SolutionItem {
  id: string
  name: string
  tagline: string
  description: string
  price_monthly: number
  objectives: ObjectiveKey[]
  channels: ChannelKey[]
  mandatory_supported: MandatoryRequirementKey[]
  implementation_effort: ImplementationEffort
  trial_ease: TrialEase
  keywords: string
  why_matches: string
  what_needed: string
  what_testable: string
  pilot_conditions: string
  interactive_test: boolean
  is_active: boolean
  created?: string
  updated?: string
}

export interface DiagnosticRecord {
  id?: string
  owner?: string
  goal: ObjectiveKey[]
  free_text: string
  keywords: string[]
  segment: 'Vestuario' | 'Alimentacao' | 'Automecanica' | 'Servicos' | 'Farmacia' | 'Outro'
  municipality: string
  channels: ChannelKey[]
  team_size: 'So eu' | '2-4' | '5-10' | '10+'
  budget_max: number
  main_channel: ChannelKey
  implementation_time: 'Mesmo dia' | '1 semana' | '1 mes'
  mandatory_requirements: MandatoryRequirementKey[]
  status: DiagnosticStatus
  step_current?: number
  is_demo?: boolean
  created?: string
  updated?: string
}

export interface FictionalOrder {
  id: string
  customer: string
  item: string
  timeAgo: string
  status: 'aguardando_retorno' | 'retorno_registrado' | 'orcamento_enviado' | 'concluido'
  lastAction?: string
  notes?: string
  messages?: { sender: 'cliente' | 'loja'; text: string; time: string }[]
}

export interface TestRecord {
  id?: string
  diagnostic?: string
  solution?: string
  orders: FictionalOrder[]
  summary: {
    openedCount: number
    repliedCount: number
    remindersCount: number
    completedCount: number
    simulatedResponseTime: string
  }
  completed: boolean
  is_demo?: boolean
  created?: string
  updated?: string
}

export interface PilotRecord {
  id?: string
  test?: string
  solution?: string
  diagnostic?: string
  goal: string
  initial_value: number
  final_value?: number
  difference?: number
  decision: PilotDecision
  decision_reason?: string
  is_simulated: boolean
  is_demo?: boolean
  created?: string
  updated?: string
}

export interface DemandRecord {
  id?: string
  diagnostic?: string
  store_name?: string
  municipality: string
  segment: 'Vestuario' | 'Alimentacao' | 'Automecanica' | 'Servicos' | 'Farmacia' | 'Outro'
  problem: string
  impact: string
  channel: string
  requirements: MandatoryRequirementKey[]
  budget_range: string
  restrictions: string
  desired_result: string
  consent: boolean
  status: DemandStatus
  group_key?: string
  is_demo?: boolean
  created?: string
  updated?: string
}

export interface ChallengeRecord {
  id?: string
  title: string
  description: string
  municipality_scope: string
  segment: string
  common_problem: string
  common_requirements: MandatoryRequirementKey[]
  cluster_reason: string
  demands_count: number
  interested_startups: number
  status: 'aberto' | 'em_analise' | 'piloto_aprovado' | 'encerrado'
  is_demo?: boolean
  created?: string
  updated?: string
}

export interface ProposalRecord {
  id?: string
  challenge: string
  startup_name: string
  already_solves: string
  to_develop: string
  estimated_time: string
  proposed_cost: string
  pilot_evaluation: string
  status: 'enviada' | 'aprovada' | 'recusada'
  decision_note?: string
  is_demo?: boolean
  created?: string
  updated?: string
}

export interface AppConfigRecord {
  id?: string
  key: string
  association_name: string
  municipality: string
  profile_type: 'equipe_pequena' | 'equipe_inovacao'
  visual_palette: string
  priority_segments: string[]
  active_solution_ids: string[]
}
