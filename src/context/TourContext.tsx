// Contexto para conduzir os cenários de demonstração guiada A e B
import React, { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { resetDemoState } from '@/services/vitrineService'
import { useAuth } from '@/context/AuthContext'

export type ScenarioType = 'scenarioA' | 'scenarioB' | null

export interface TourStep {
  title: string
  text: string
  route: string
  targetHint?: string
  actionLabel?: string
  role?: 'lojista' | 'associacao' | 'startup'
}

const SCENARIO_A_STEPS: TourStep[] = [
  {
    title: 'Cenário A · Passo 1 de 5: Diagnóstico do Lojista',
    text: 'Loja de roupas em Marília. Vende pelo WhatsApp, perde retornos de clientes e tem orçamento de até R$ 100/mês.',
    route: '/diagnostico',
    targetHint: 'Formulário de diagnóstico pré-preenchido',
    actionLabel: 'Ver recomendações',
    role: 'lojista',
  },
  {
    title: 'Cenário A · Passo 2 de 5: Recomendações Transparentes',
    text: 'A RetomaZap lidera com evidência clara: "Funciona com seu canal de vendas e custa R$ 79 por mês na simulação".',
    route: '/recomendacoes',
    targetHint: 'Card da RetomaZap e Comparador',
    actionLabel: 'Testar com pedidos fictícios',
    role: 'lojista',
  },
  {
    title: 'Cenário A · Passo 3 de 5: Teste Interativo da RetomaZap',
    text: 'Abra pedidos fictícios, marque retorno, simule lembrete e mova para Concluído. O tempo médio cai em tempo real.',
    route: '/teste/solretomazap001',
    targetHint: 'Quadro de pedidos e resumo do teste',
    actionLabel: 'Criar piloto de 7 dias',
    role: 'lojista',
  },
  {
    title: 'Cenário A · Passo 4 de 5: Piloto de 7 dias e Decisão',
    text: 'Tempo de primeira resposta caiu de 4h para 45min (81% de melhora). O lojista decide Continuar com a solução.',
    route: '/piloto',
    targetHint: 'Barra comparativa e botões de decisão',
    actionLabel: 'Acompanhar em Minhas Solicitações',
    role: 'lojista',
  },
  {
    title: 'Cenário A · Passo 5 de 5: Jornada Concluída!',
    text: 'O piloto registrado fica visível na timeline do lojista e computado nos indicadores da associação comercial.',
    route: '/minhas-solicitacoes',
    targetHint: 'Timeline com status ativo',
    actionLabel: 'Concluir Cenário A',
    role: 'lojista',
  },
]

const SCENARIO_B_STEPS: TourStep[] = [
  {
    title: 'Cenário B · Passo 1 de 6: Mercearia com Internet Instável',
    text: 'Alimentação em Tatuí. Orçamento até R$ 50/mês. Requisito indispensável: "operar com internet instável".',
    route: '/diagnostico',
    targetHint: 'Diagnóstico pré-configurado',
    actionLabel: 'Buscar catálogo',
    role: 'lojista',
  },
  {
    title: 'Cenário B · Passo 2 de 6: Sem Cobertura no Catálogo',
    text: 'Nenhuma solução pronta atende a internet instável abaixo de R$ 50. O lojista clica em "Pedir apoio da minha associação".',
    route: '/recomendacoes',
    targetHint: 'Aviso âmbar de requisitos sem cobertura',
    actionLabel: 'Encaminhar resumo de demanda',
    role: 'lojista',
  },
  {
    title: 'Cenário B · Passo 3 de 6: Radar de Demandas da Associação',
    text: 'A AC identifica 3 demandas com o mesmo requisito ("operar com internet instável") e publica um desafio coletivo.',
    route: '/associacao',
    targetHint: 'Agrupamento inteligente por motivo',
    actionLabel: 'Publicar desafio coletivo',
    role: 'associacao',
  },
  {
    title: 'Cenário B · Passo 4 de 6: Startup Responde ao Desafio',
    text: 'A ConectaVarejo Labs envia proposta cobrindo os 5 campos: o que já atende, o que desenvolverá, prazo, custo e avaliação.',
    route: '/startup',
    targetHint: 'Formulário de resposta em 5 pontos',
    actionLabel: 'Enviar proposta de piloto',
    role: 'startup',
  },
  {
    title: 'Cenário B · Passo 5 de 6: Associação Aprova o Piloto Coletivo',
    text: 'A associação avalia a proposta e clica em "Aprovar proposta de demonstração". O status atualiza para todos.',
    route: '/associacao',
    targetHint: 'Caixa de propostas',
    actionLabel: 'Aprovar e notificar lojistas',
    role: 'associacao',
  },
  {
    title: 'Cenário B · Passo 6 de 6: Lojista Vê "Piloto Aprovado"',
    text: 'Em Minhas Solicitações, o lojista vê a timeline avançando em tempo real até "Piloto aprovado".',
    route: '/minhas-solicitacoes',
    targetHint: 'Stepper completo em tempo real',
    actionLabel: 'Concluir Cenário B',
    role: 'lojista',
  },
]

interface TourContextType {
  activeScenario: ScenarioType
  currentStepIndex: number
  currentStep: TourStep | null
  totalSteps: number
  isTourActive: boolean
  startScenarioA: () => void
  startScenarioB: () => void
  startFullTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  restartDemo: () => Promise<void>
}

const TourContext = createContext<TourContextType>({
  activeScenario: null,
  currentStepIndex: 0,
  currentStep: null,
  totalSteps: 0,
  isTourActive: false,
  startScenarioA: () => {},
  startScenarioB: () => {},
  startFullTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTour: () => {},
  restartDemo: async () => {},
})

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const { switchDemoRole } = useAuth()
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)

  const steps =
    activeScenario === 'scenarioA'
      ? SCENARIO_A_STEPS
      : activeScenario === 'scenarioB'
        ? SCENARIO_B_STEPS
        : []
  const currentStep = steps[currentStepIndex] || null
  const totalSteps = steps.length
  const isTourActive = activeScenario !== null && currentStep !== null

  const applyStep = (step: TourStep) => {
    if (step.role) {
      void switchDemoRole(step.role, false)
    }
    navigate(step.route)
  }

  const startScenarioA = () => {
    setActiveScenario('scenarioA')
    setCurrentStepIndex(0)
    applyStep(SCENARIO_A_STEPS[0])
    toast({
      title: 'Cenário A iniciado',
      description:
        'Loja de roupas em Marília: diagnóstico, recomendação, teste RetomaZap e piloto.',
    })
  }

  const startScenarioB = () => {
    setActiveScenario('scenarioB')
    setCurrentStepIndex(0)
    applyStep(SCENARIO_B_STEPS[0])
    toast({
      title: 'Cenário B iniciado',
      description:
        'Mercearia com internet instável: sem cobertura, demanda encaminhada, agrupamento e desafio coletivo.',
    })
  }

  const startFullTour = () => {
    startScenarioA()
  }

  const nextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIdx = currentStepIndex + 1
      setCurrentStepIndex(nextIdx)
      applyStep(steps[nextIdx])
    } else {
      if (activeScenario === 'scenarioA') {
        toast({
          title: 'Cenário A concluído!',
          description:
            'Iniciando agora o Cenário B (Mercearia com internet instável e apoio da associação).',
        })
        startScenarioB()
      } else {
        setActiveScenario(null)
        setCurrentStepIndex(0)
        toast({
          title: 'Demonstração guiada concluída!',
          description:
            'Você pode explorar livremente qualquer tela ou reiniciar a demonstração a qualquer momento.',
        })
      }
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1
      setCurrentStepIndex(prevIdx)
      applyStep(steps[prevIdx])
    }
  }

  const skipTour = () => {
    setActiveScenario(null)
    setCurrentStepIndex(0)
    toast({
      title: 'Demonstração pausada',
      description: 'Você está no modo de navegação livre.',
    })
  }

  const restartDemo = async () => {
    const res = await resetDemoState()
    setActiveScenario(null)
    setCurrentStepIndex(0)
    navigate('/')
    void switchDemoRole('lojista', false)
    if (res.ok) {
      toast({
        title: 'Demonstração reiniciada',
        description: 'Todos os dados fictícios foram restaurados para o estado semente inicial.',
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Aviso',
        description: res.message,
      })
    }
  }

  return (
    <TourContext.Provider
      value={{
        activeScenario,
        currentStepIndex,
        currentStep,
        totalSteps,
        isTourActive,
        startScenarioA,
        startScenarioB,
        startFullTour,
        nextStep,
        prevStep,
        skipTour,
        restartDemo,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export const useTour = () => useContext(TourContext)
