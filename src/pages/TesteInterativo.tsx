// Pagina de Teste Interativo com Pedidos Ficticios
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  BellRing,
  ArrowRight,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  User,
  Send,
  Calendar,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { toast } from '@/hooks/use-toast'
import {
  getSolutionById,
  getLatestDiagnostic,
  saveTest,
  getTestByDiagnostic,
} from '@/services/vitrineService'
import type { FictionalOrder, SolutionItem, TestRecord } from '@/types/vitrine'

const INITIAL_ORDERS: FictionalOrder[] = [
  {
    id: 'ord-101',
    customer: 'Marina Ribeiro',
    item: 'Vestido floral linho · Tam M',
    timeAgo: 'há 3h40',
    status: 'aguardando_retorno',
    lastAction: 'Cliente perguntou: "Tem no azul marinho?"',
    notes: 'Aguardando retorno da loja',
    messages: [
      {
        sender: 'cliente',
        text: 'Boa tarde! Vi no Instagram o vestido floral linho. Tem no tamanho M?',
        time: '11:15',
      },
      { sender: 'loja', text: 'Olá Marina! Temos sim no cru e no azul marinho.', time: '11:20' },
      { sender: 'cliente', text: 'Perfeito! Qual o valor para entregar no centro?', time: '11:22' },
    ],
  },
  {
    id: 'ord-102',
    customer: 'João Pedro Silveira',
    item: 'Camisa polo dry fit · Tam G',
    timeAgo: 'há 2h15',
    status: 'aguardando_retorno',
    lastAction: 'Orçamento enviado, sem confirmação',
    notes: 'Aguardando retorno da loja',
    messages: [
      {
        sender: 'cliente',
        text: 'Oi, vocês conseguem separar 2 camisas para retirar hoje?',
        time: '12:40',
      },
      { sender: 'loja', text: 'Separamos sim, João! Fica R$ 138 no Pix.', time: '12:45' },
    ],
  },
  {
    id: 'ord-103',
    customer: 'Paula Mendes',
    item: 'Calça jeans alfaiataria · Tam 40',
    timeAgo: 'há 1h30',
    status: 'aguardando_retorno',
    lastAction: 'Cliente aguardando confirmação de tamanho',
    notes: 'Aguardando retorno da loja',
    messages: [{ sender: 'cliente', text: 'A forma da calça é pequena ou normal?', time: '13:20' }],
  },
  {
    id: 'ord-104',
    customer: 'Renata Albuquerque',
    item: 'Saia midi plissada · Tam P',
    timeAgo: 'há 45 min',
    status: 'concluido',
    lastAction: 'Pedido finalizado e entregue',
    notes: 'Concluído com sucesso',
    messages: [
      { sender: 'cliente', text: 'Acabei de receber, ficou linda! Obrigada!', time: '14:10' },
      {
        sender: 'loja',
        text: 'Que alegria, Renata! Qualquer coisa estamos à disposição!',
        time: '14:12',
      },
    ],
  },
]

export default function TesteInterativoPage() {
  const { id: solutionId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [solution, setSolution] = useState<SolutionItem | null>(null)
  const [diagnosticId, setDiagnosticId] = useState<string | undefined>(undefined)
  const [testRecordId, setTestRecordId] = useState<string | undefined>(undefined)

  const [orders, setOrders] = useState<FictionalOrder[]>(INITIAL_ORDERS)
  const [selectedOrder, setSelectedOrder] = useState<FictionalOrder | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Carregar dados
  useEffect(() => {
    async function load() {
      if (solutionId) {
        const sol = await getSolutionById(solutionId)
        setSolution(sol)
      }
      const diag = await getLatestDiagnostic()
      if (diag?.id) {
        setDiagnosticId(diag.id)
        const existingTest = await getTestByDiagnostic(diag.id)
        if (existingTest?.orders?.length) {
          setOrders(existingTest.orders)
          setTestRecordId(existingTest.id)
        }
      }
    }
    load()
  }, [solutionId])

  // Contadores vivos do resumo do teste
  const openedCount =
    orders.filter((o) => o.status !== 'aguardando_retorno' || o.lastAction?.includes('Lembrete'))
      .length + 1
  const repliedCount = orders.filter(
    (o) => o.status === 'retorno_registrado' || o.status === 'concluido',
  ).length
  const remindersCount = orders.filter(
    (o) => o.lastAction?.includes('Lembrete') || o.notes?.includes('Lembrete'),
  ).length
  const completedCount = orders.filter((o) => o.status === 'concluido').length

  // Tempo de primeira resposta simulado caindo de 4h para 45min
  const simulatedResponseTime =
    completedCount >= 2 || repliedCount >= 2
      ? '45 min'
      : repliedCount === 1
        ? '1h 30min'
        : '4h antes do teste'

  // Persistir estado do teste no PocketBase
  const persistTestState = async (updatedOrders: FictionalOrder[]) => {
    try {
      const saved = await saveTest({
        id: testRecordId,
        diagnostic: diagnosticId,
        solution: solutionId,
        orders: updatedOrders,
        summary: {
          openedCount,
          repliedCount,
          remindersCount,
          completedCount,
          simulatedResponseTime,
        },
        completed: completedCount >= 2,
      })
      if (saved.id && !testRecordId) {
        setTestRecordId(saved.id)
      }
    } catch {
      // continua mesmo com erro local
    }
  }

  // Ações sobre os pedidos fictícios
  const handleOpenOrder = (ord: FictionalOrder) => {
    setSelectedOrder(ord)
    setDrawerOpen(true)
  }

  const handleMarkReturn = (ordId: string) => {
    const updated = orders.map((o) => {
      if (o.id === ordId) {
        return {
          ...o,
          status: 'retorno_registrado' as const,
          lastAction: 'Retorno registrado às 14:28',
          notes: 'Mensagem enviada com sucesso ao cliente',
        }
      }
      return o
    })
    setOrders(updated)
    persistTestState(updated)
    if (selectedOrder?.id === ordId) {
      setSelectedOrder(updated.find((o) => o.id === ordId) || null)
    }
    toast({
      title: 'Retorno marcado!',
      description: 'Tempo médio de primeira resposta da loja atualizado.',
    })
  }

  const handleSimulateReminder = (ordId: string) => {
    const updated = orders.map((o) => {
      if (o.id === ordId) {
        return {
          ...o,
          lastAction: 'Lembrete automático simulado · 14:32',
          notes: 'Lembrete amigável enviado sem parecer cobrança',
        }
      }
      return o
    })
    setOrders(updated)
    persistTestState(updated)
    toast({
      title: 'Lembrete simulado!',
      description: 'Mensagem de acompanhamento enviada no fluxo fictício.',
    })
  }

  const handleMoveCompleted = (ordId: string) => {
    const updated = orders.map((o) => {
      if (o.id === ordId) {
        return {
          ...o,
          status: 'concluido' as const,
          lastAction: 'Concluído e arquivado com sucesso',
        }
      }
      return o
    })
    setOrders(updated)
    persistTestState(updated)
    if (selectedOrder?.id === ordId) {
      setDrawerOpen(false)
    }
    toast({
      title: 'Pedido concluído!',
      description: 'Movido para a coluna de concluídos.',
    })
  }

  const handleResetTest = () => {
    setOrders(INITIAL_ORDERS)
    persistTestState(INITIAL_ORDERS)
    toast({
      title: 'Teste reiniciado',
      description: 'Os 4 pedidos de exemplo voltaram ao estado inicial.',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* 1. Banner Âmbar Permanente de Simulação Fictícia */}
      <div className="bg-[#FFFBEB] border-2 border-[#FCD34D] text-[#92400E] p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <div className="text-xs sm:text-sm font-semibold">
            Simulação — pedidos fictícios. Nenhuma mensagem real é enviada ao WhatsApp.
          </div>
        </div>
        <Badge className="bg-amber-200 text-amber-900 border-0 text-[11px] hidden sm:inline-flex">
          Ambiente Seguro de Teste
        </Badge>
      </div>

      {/* 2. Cabeçalho do Teste */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#125435]">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Demonstração Interativa da Solução</span>
          </div>
          <h1 className="font-serif-title text-3xl sm:text-4xl text-stone-900 font-normal mt-1">
            Testar RetomaZap com pedidos fictícios
          </h1>
          <p className="text-stone-600 text-sm">
            R$ 79/mês na simulação · Experimente responder clientes e enviar lembretes antes de
            decidir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetTest}
            className="text-xs text-stone-600"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reiniciar teste
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-[#125435] text-white hover:bg-emerald-900 text-xs"
          >
            <Link to="/piloto">
              Criar piloto de 7 dias <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 3. Layout Grid: Quadro de Pedidos (Esquerda) + Resumo do Teste (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Quadro de Pedidos Fictícios (2 colunas no desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif-title text-xl text-stone-900 font-semibold">
              Quadro de conversas do WhatsApp (simulado)
            </h2>
            <span className="text-xs text-stone-500">4 pedidos carregados</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orders.map((ord) => {
              const isWaiting = ord.status === 'aguardando_retorno'
              const isReplied = ord.status === 'retorno_registrado'
              const isDone = ord.status === 'concluido'

              return (
                <Card
                  key={ord.id}
                  className={`border-2 transition-all rounded-xl p-4 space-y-3 flex flex-col justify-between ${
                    isDone
                      ? 'bg-stone-50/70 border-stone-200 opacity-90'
                      : isReplied
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : 'bg-white border-amber-300 shadow-sm'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        {ord.customer}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isDone
                            ? 'bg-stone-100 text-stone-700 border-stone-300'
                            : isReplied
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {isDone
                          ? 'Concluído'
                          : isReplied
                            ? 'Retorno registrado'
                            : 'Aguardando retorno'}
                      </Badge>
                    </div>

                    <div className="text-xs font-semibold text-stone-800">{ord.item}</div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" /> Última mensagem: {ord.timeAgo}
                    </div>

                    <div className="text-xs text-stone-600 bg-stone-100/80 p-2 rounded italic">
                      "{ord.lastAction}"
                    </div>
                  </div>

                  {/* Ações interativas no pedido */}
                  <div className="space-y-2 pt-2 border-t border-stone-200">
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenOrder(ord)}
                        className="text-xs h-7 bg-white"
                      >
                        Abrir conversa
                      </Button>

                      {isWaiting && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkReturn(ord.id)}
                          className="text-xs h-7 bg-[#125435] text-white hover:bg-emerald-900"
                        >
                          Marcar retorno
                        </Button>
                      )}

                      {isReplied && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSimulateReminder(ord.id)}
                          className="text-xs h-7 bg-amber-100 text-amber-900 hover:bg-amber-200"
                        >
                          Simular lembrete
                        </Button>
                      )}

                      {isDone && (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finalizado
                        </span>
                      )}
                    </div>

                    {!isDone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveCompleted(ord.id)}
                        className="w-full text-[11px] h-6 text-stone-500 hover:text-stone-800"
                      >
                        Mover para "Concluído"
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Resumo do Teste em Tempo Real (Painel Lateral) */}
        <div className="space-y-4">
          <Card className="bg-[#FAF7F0] border-2 border-[#125435] rounded-xl p-5 space-y-4 shadow-md sticky top-20">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#125435]">
                Métricas do seu teste
              </span>
              <h2 className="font-serif-title text-2xl text-stone-900 font-normal mt-0.5">
                Resumo em tempo real
              </h2>
              <p className="text-xs text-stone-600">
                Veja o impacto simulado na rotina da sua loja.
              </p>
            </div>

            <div className="space-y-2.5 divide-y divide-stone-200 text-xs sm:text-sm">
              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-600">Pedidos abertos:</span>
                <span className="font-bold text-stone-900">{openedCount} de 4</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-stone-600">Retornos marcados:</span>
                <span className="font-bold text-[#125435]">{repliedCount}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-stone-600">Lembretes simulados:</span>
                <span className="font-bold text-amber-800">{remindersCount}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-stone-600">Pedidos concluídos:</span>
                <span className="font-bold text-emerald-800">{completedCount}</span>
              </div>

              {/* Tempo de Primeira Resposta caindo */}
              <div className="pt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-stone-700 font-medium">Tempo de 1ª resposta:</span>
                  <span className="font-serif-title text-lg font-bold text-[#125435]">
                    {simulatedResponseTime}
                  </span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#125435] h-full transition-all duration-500"
                    style={{
                      width:
                        simulatedResponseTime === '45 min'
                          ? '85%'
                          : simulatedResponseTime === '1h 30min'
                            ? '50%'
                            : '20%',
                    }}
                  />
                </div>
                <span className="text-[11px] text-stone-500 block">
                  Caindo conforme você marca retornos na simulação.
                </span>
              </div>
            </div>

            {/* Ação Próxima: Criar Piloto de 7 dias */}
            <div className="pt-2 border-t border-stone-200 space-y-2">
              <Button
                asChild
                size="lg"
                className="w-full bg-[#125435] text-white hover:bg-emerald-900 font-semibold shadow-sm"
              >
                <Link to="/piloto">
                  Criar piloto de 7 dias <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <p className="text-[11px] text-stone-500 text-center">
                Defina uma meta simples (ex.: tempo de resposta) e avalie sem custo.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Drawer / Modal de Detalhe da Conversa Fictícia */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-white max-w-lg mx-auto">
          <DrawerHeader className="border-b border-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="font-serif-title text-xl text-stone-900">
                  Conversa simulada · {selectedOrder?.customer}
                </DrawerTitle>
                <DrawerDescription className="text-xs text-stone-500">
                  Item: {selectedOrder?.item} · WhatsApp simulado
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto bg-stone-50 text-xs">
            {selectedOrder?.messages?.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'loja' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-2.5 rounded-lg max-w-[80%] ${
                    m.sender === 'loja'
                      ? 'bg-[#125435] text-white rounded-br-none'
                      : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`text-[10px] block mt-1 ${m.sender === 'loja' ? 'text-emerald-200' : 'text-stone-400'}`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <DrawerFooter className="border-t border-stone-100 flex flex-row items-center justify-between gap-2">
            {selectedOrder && selectedOrder.status !== 'concluido' && (
              <Button
                size="sm"
                onClick={() => handleMarkReturn(selectedOrder.id)}
                className="bg-[#125435] text-white hover:bg-emerald-900 text-xs"
              >
                Marcar retorno respondido
              </Button>
            )}
            {selectedOrder && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMoveCompleted(selectedOrder.id)}
                className="text-xs"
              >
                Mover para concluído
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
