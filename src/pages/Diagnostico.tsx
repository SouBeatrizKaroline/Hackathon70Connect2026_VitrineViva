// Pagina do Diagnostico do lojista
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Sparkles,
  Smartphone,
  Globe2,
  WifiOff,
  RefreshCw,
  HelpCircle,
  Pencil,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { toast } from '@/hooks/use-toast'
import { saveDiagnostic, getLatestDiagnostic } from '@/services/vitrineService'
import type {
  ObjectiveKey,
  ChannelKey,
  MandatoryRequirementKey,
  DiagnosticRecord,
} from '@/types/vitrine'

const OBJECTIVE_OPTIONS: { key: ObjectiveKey; label: string; desc: string }[] = [
  { key: 'vender_mais', label: 'Vender mais', desc: 'Atrair mais clientes e aumentar ticket' },
  {
    key: 'responder_rapido',
    label: 'Responder mais rápido',
    desc: 'Não deixar clientes esperando no chat',
  },
  {
    key: 'recuperar_pedidos',
    label: 'Recuperar pedidos',
    desc: 'Reativar quem pediu orçamento e sumiu',
  },
  {
    key: 'controlar_estoque',
    label: 'Controlar estoque',
    desc: 'Saber o que tem para vender sem furar',
  },
  {
    key: 'organizar_entregas',
    label: 'Organizar entregas',
    desc: 'Roteiro de entregador e taxa correta',
  },
]

const CHANNEL_OPTIONS: { key: ChannelKey; label: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'loja_fisica', label: 'Loja física / Balcão' },
  { key: 'site', label: 'Site / Loja virtual' },
  { key: 'telefone', label: 'Telefone' },
]

const MANDATORY_OPTIONS: { key: MandatoryRequirementKey; label: string; icon: any }[] = [
  { key: 'funciona_celular', label: 'Funcionar no celular', icon: Smartphone },
  { key: 'suporte_portugues', label: 'Ter suporte em português', icon: Globe2 },
  { key: 'opera_offline', label: 'Operar com internet instável', icon: WifiOff },
  { key: 'dispensa_troca_sistema', label: 'Dispensar a troca do sistema atual', icon: RefreshCw },
]

const EXAMPLE_PHRASES = [
  'Recebo pedidos pelo WhatsApp e esqueço de retornar',
  'Meu estoque físico nunca bate com as vendas',
  'Demoro para responder e o cliente compra do concorrente',
]

export default function DiagnosticoPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [recordId, setRecordId] = useState<string | undefined>(undefined)

  // Step 1: O que você quer melhorar?
  const [selectedGoals, setSelectedGoals] = useState<ObjectiveKey[]>(['recuperar_pedidos'])
  const [freeText, setFreeText] = useState('Recebo pedidos pelo WhatsApp e esqueço de retornar')
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([
    'whatsapp',
    'retorno',
    'pedidos',
  ])

  // Step 2: Como sua loja funciona?
  const [segment, setSegment] = useState<
    'Vestuario' | 'Alimentacao' | 'Automecanica' | 'Servicos' | 'Farmacia' | 'Outro'
  >('Vestuario')
  const [municipality, setMunicipality] = useState('Marília')
  const [channels, setChannels] = useState<ChannelKey[]>(['whatsapp', 'instagram'])
  const [mainChannel, setMainChannel] = useState<ChannelKey>('whatsapp')
  const [teamSize, setTeamSize] = useState<'So eu' | '2-4' | '5-10' | '10+'>('2-4')
  const [budgetMax, setBudgetMax] = useState<number>(100)
  const [implementationTime, setImplementationTime] = useState<'Mesmo dia' | '1 semana' | '1 mes'>(
    'Mesmo dia',
  )

  // Step 3: O que é indispensável?
  const [mandatoryRequirements, setMandatoryRequirements] = useState<MandatoryRequirementKey[]>([
    'funciona_celular',
    'suporte_portugues',
  ])

  // Validação
  const [missingFieldWarning, setMissingFieldWarning] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Carrega rascunho anterior se houver
  useEffect(() => {
    getLatestDiagnostic().then((d) => {
      if (d) {
        setRecordId(d.id)
        if (d.goal?.length) setSelectedGoals(d.goal)
        if (d.free_text) setFreeText(d.free_text)
        if (d.keywords?.length) setExtractedKeywords(d.keywords)
        if (d.segment) setSegment(d.segment)
        if (d.municipality) setMunicipality(d.municipality)
        if (d.channels?.length) setChannels(d.channels)
        if (d.main_channel) setMainChannel(d.main_channel)
        if (d.team_size) setTeamSize(d.team_size)
        if (typeof d.budget_max === 'number') setBudgetMax(d.budget_max)
        if (d.implementation_time) setImplementationTime(d.implementation_time)
        if (d.mandatory_requirements) setMandatoryRequirements(d.mandatory_requirements)
        if (d.step_current && d.step_current >= 1 && d.step_current <= 3) {
          setStep(d.step_current as 1 | 2 | 3)
        }
      }
    })
  }, [])

  // Extrair palavras-chave do texto livre
  const extractKeywordsFromText = (text: string) => {
    const rawWords = text.toLowerCase().split(/[\s,.;:!?]+/)
    const stopWords = new Set([
      'e',
      'de',
      'o',
      'a',
      'do',
      'da',
      'em',
      'um',
      'para',
      'com',
      'não',
      'os',
      'as',
      'pelo',
      'pela',
      'meu',
      'minha',
    ])
    const valid = rawWords.filter((w) => w.length > 3 && !stopWords.has(w))
    const unique = Array.from(new Set(valid)).slice(0, 6)
    if (unique.length > 0) {
      setExtractedKeywords(unique)
    }
  }

  const handleFreeTextChange = (val: string) => {
    setFreeText(val)
    extractKeywordsFromText(val)
  }

  const toggleGoal = (goal: ObjectiveKey) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    )
  }

  const toggleChannel = (ch: ChannelKey) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]))
  }

  const toggleMandatory = (req: MandatoryRequirementKey) => {
    setMandatoryRequirements((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req],
    )
  }

  const persistCurrentState = async (nextStep: 1 | 2 | 3) => {
    setIsSaving(true)
    try {
      const saved = await saveDiagnostic({
        id: recordId,
        goal: selectedGoals,
        free_text: freeText,
        keywords: extractedKeywords,
        segment,
        municipality,
        channels,
        main_channel: mainChannel,
        team_size: teamSize,
        budget_max: budgetMax,
        implementation_time: implementationTime,
        mandatory_requirements: mandatoryRequirements,
        step_current: nextStep,
        status: 'rascunho',
      })
      if (saved.id && !recordId) {
        setRecordId(saved.id)
      }
    } catch {
      // continua mesmo com erro no rascunho
    } finally {
      setIsSaving(false)
    }
  }

  const goToStep = async (targetStep: 1 | 2 | 3) => {
    setMissingFieldWarning(null)
    await persistCurrentState(targetStep)
    setStep(targetStep)
  }

  const validateAndSearch = async () => {
    setMissingFieldWarning(null)

    // Validações essenciais
    if (selectedGoals.length === 0) {
      setMissingFieldWarning(
        'Falta selecionar pelo menos um objetivo que você quer melhorar (Etapa 1).',
      )
      setStep(1)
      return
    }
    if (!municipality.trim()) {
      setMissingFieldWarning('Falta informar o município da sua loja (Etapa 2).')
      setStep(2)
      return
    }
    if (channels.length === 0) {
      setMissingFieldWarning('Falta selecionar pelo menos um canal de vendas (Etapa 2).')
      setStep(2)
      return
    }
    if (typeof budgetMax !== 'number' || budgetMax <= 0) {
      setMissingFieldWarning('Falta informar quanto você pode investir por mês (Etapa 2).')
      setStep(2)
      return
    }

    // Salvar como diagnosticado
    setIsSaving(true)
    try {
      await saveDiagnostic({
        id: recordId,
        goal: selectedGoals,
        free_text: freeText,
        keywords: extractedKeywords,
        segment,
        municipality,
        channels,
        main_channel: mainChannel,
        team_size: teamSize,
        budget_max: budgetMax,
        implementation_time: implementationTime,
        mandatory_requirements: mandatoryRequirements,
        status: 'diagnosticado',
        step_current: 3,
      })

      toast({
        title: 'Diagnóstico salvo e sincronizado',
        description: 'Buscando recomendações transparentes para a sua loja...',
      })

      navigate('/recomendacoes')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Aviso',
        description: 'Erro ao salvar diagnóstico: ' + (err?.message || 'Tente novamente.'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Cabeçalho do Wizard */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#125435]">
          <Compass className="w-4 h-4 text-amber-600" />
          <span>Diagnóstico da loja em 3 etapas</span>
        </div>
        <h1 className="font-serif-title text-3xl sm:text-4xl text-stone-900 font-normal">
          Entenda o que você precisa antes de gastar
        </h1>
        <p className="text-stone-600 text-sm sm:text-base">
          Sem termos técnicos complicados. Suas respostas definem quais ferramentas funcionam no seu
          dia a dia.
        </p>

        {/* Stepper horizontal */}
        <div className="pt-4 grid grid-cols-3 gap-2 sm:gap-4">
          <button
            onClick={() => goToStep(1)}
            className={`text-left p-3 rounded-lg border transition-all ${
              step === 1
                ? 'border-[#125435] bg-emerald-50 text-[#125435] shadow-xs'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider">Etapa 1</div>
            <div className="text-xs sm:text-sm font-semibold truncate">O que melhorar?</div>
          </button>

          <button
            onClick={() => goToStep(2)}
            className={`text-left p-3 rounded-lg border transition-all ${
              step === 2
                ? 'border-[#125435] bg-emerald-50 text-[#125435] shadow-xs'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider">Etapa 2</div>
            <div className="text-xs sm:text-sm font-semibold truncate">Como funciona?</div>
          </button>

          <button
            onClick={() => goToStep(3)}
            className={`text-left p-3 rounded-lg border transition-all ${
              step === 3
                ? 'border-[#125435] bg-emerald-50 text-[#125435] shadow-xs'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider">Etapa 3</div>
            <div className="text-xs sm:text-sm font-semibold truncate">Indispensável & Resumo</div>
          </button>
        </div>
      </div>

      {/* Aviso Âmbar de Validação se faltar campo essencial */}
      {missingFieldWarning && (
        <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Atenção para continuar: </span>
            {missingFieldWarning}
          </div>
        </div>
      )}

      {/* ETAPA 1 */}
      {step === 1 && (
        <Card className="bg-white border-2 border-stone-200/90 shadow-sm rounded-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="font-serif-title text-2xl text-stone-900 font-normal">
              1. O que você quer melhorar na sua loja?
            </CardTitle>
            <CardDescription className="text-stone-600 text-sm">
              Marque os desafios mais urgentes e conte em suas palavras o que está travando o
              balcão.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Chips de Objetivos */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Selecione seus objetivos prioritários:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {OBJECTIVE_OPTIONS.map((opt) => {
                  const isSelected = selectedGoals.includes(opt.key)
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleGoal(opt.key)}
                      className={`text-left p-3.5 rounded-lg border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#125435] bg-emerald-50 text-[#125435] shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{opt.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#125435]" />}
                      </div>
                      <span className="text-xs text-stone-500 mt-1">{opt.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Texto livre e exemplos tocáveis */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Conte com suas palavras o que acontece (opcional):
                </label>
                <span className="text-xs text-stone-400">Exemplos reais de comércio</span>
              </div>

              <Textarea
                rows={3}
                value={freeText}
                onChange={(e) => handleFreeTextChange(e.target.value)}
                placeholder="Ex.: Recebo pedidos pelo WhatsApp e esqueço de retornar..."
                className="bg-stone-50 border-stone-300 text-sm focus:bg-white"
              />

              {/* Chips de exemplos clicáveis */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-stone-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Exemplos tocáveis:
                </span>
                {EXAMPLE_PHRASES.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => handleFreeTextChange(phrase)}
                    className="text-xs px-2.5 py-1 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-800 transition-colors"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>

              {/* Palavras-chave extraídas confirmáveis/corrigíveis */}
              {extractedKeywords.length > 0 && (
                <div className="p-3 bg-stone-100/80 rounded-lg mt-3 space-y-1.5">
                  <div className="text-xs text-stone-600 font-medium">
                    🔍 Palavras-chave identificadas no seu relato (você pode remover se não fizer
                    sentido):
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {extractedKeywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="bg-white text-stone-800 border border-stone-300 cursor-pointer hover:bg-red-50 hover:text-red-700 text-xs px-2 py-0.5"
                        onClick={() => setExtractedKeywords((prev) => prev.filter((k) => k !== kw))}
                        title="Clique para remover"
                      >
                        {kw} <span className="ml-1 text-[10px] text-stone-400">×</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ação Próximo */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => goToStep(2)}
                className="bg-[#125435] text-white hover:bg-emerald-900"
              >
                Continuar para Etapa 2 <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 2 */}
      {step === 2 && (
        <Card className="bg-white border-2 border-stone-200/90 shadow-sm rounded-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="font-serif-title text-2xl text-stone-900 font-normal">
              2. Como sua loja funciona?
            </CardTitle>
            <CardDescription className="text-stone-600 text-sm">
              Tamanho, canais que usa e quanto você pode investir por mês sem comprometer o caixa.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Segmento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Segmento de atuação:
                </label>
                <select
                  value={segment}
                  onChange={(e: any) => setSegment(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-stone-300 bg-white text-sm"
                >
                  <option value="Vestuario">Vestuário e Calçados</option>
                  <option value="Alimentacao">Alimentação e Mercearia</option>
                  <option value="Automecanica">Autopeças e Mecânica</option>
                  <option value="Servicos">Serviços e Beleza</option>
                  <option value="Farmacia">Farmácia e Drogaria</option>
                  <option value="Outro">Outro Comércio Local</option>
                </select>
              </div>

              {/* Município */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Município (SP):
                </label>
                <Input
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  list="cities-datalist"
                  placeholder="Ex.: Marília, Tatuí, Ourinhos..."
                  className="bg-white"
                />
                <datalist id="cities-datalist">
                  <option value="Marília" />
                  <option value="Tatuí" />
                  <option value="Ourinhos" />
                  <option value="Sorocaba" />
                  <option value="Bauru" />
                </datalist>
              </div>
            </div>

            {/* Como você vende hoje? (Canal Principal) */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Como você vende hoje? (Selecione todos os canais que você utiliza):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CHANNEL_OPTIONS.map((ch) => {
                  const isChecked = channels.includes(ch.key)
                  return (
                    <button
                      key={ch.key}
                      type="button"
                      onClick={() => toggleChannel(ch.key)}
                      className={`p-2.5 rounded-lg border text-xs sm:text-sm font-medium text-left flex items-center justify-between ${
                        isChecked
                          ? 'border-[#125435] bg-emerald-50 text-[#125435]'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span>{ch.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#125435]" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Canal principal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Qual é o seu canal principal de vendas?
              </label>
              <select
                value={mainChannel}
                onChange={(e: any) => setMainChannel(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-stone-300 bg-white text-sm"
              >
                {CHANNEL_OPTIONS.map((ch) => (
                  <option key={ch.key} value={ch.key}>
                    {ch.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tamanho da equipe e tempo de implantação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Tamanho da equipe:
                </label>
                <select
                  value={teamSize}
                  onChange={(e: any) => setTeamSize(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-stone-300 bg-white text-sm"
                >
                  <option value="So eu">Só eu (autônomo / MEI)</option>
                  <option value="2-4">2 a 4 pessoas</option>
                  <option value="5-10">5 a 10 pessoas</option>
                  <option value="10+">Mais de 10 pessoas</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Tempo disponível para implantação:
                </label>
                <select
                  value={implementationTime}
                  onChange={(e: any) => setImplementationTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-stone-300 bg-white text-sm"
                >
                  <option value="Mesmo dia">Mesmo dia (muito rápido)</option>
                  <option value="1 semana">Até 1 semana</option>
                  <option value="1 mes">Até 1 mês</option>
                </select>
              </div>
            </div>

            {/* Quanto você pode investir por mês? (Slider + Chips) */}
            <div className="space-y-3 pt-3 border-t border-stone-100 bg-[#FAF7F0] p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#125435]">
                    Quanto você pode investir por mês?
                  </label>
                  <p className="text-xs text-stone-500">
                    Filtra apenas soluções que cabem na sua margem.
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-serif-title text-2xl font-bold text-[#125435]">
                    R$ {budgetMax}
                  </span>
                  <span className="text-xs text-stone-500 block">/mês</span>
                </div>
              </div>

              <Slider
                value={[budgetMax]}
                min={0}
                max={300}
                step={10}
                onValueChange={(val) => setBudgetMax(val[0])}
                className="py-2"
              />

              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>R$ 0</span>
                <span>R$ 150</span>
                <span>R$ 300+</span>
              </div>

              {/* Chips rápidos de orçamento */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-stone-600 font-medium">Valores rápidos:</span>
                {[50, 80, 100, 150].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBudgetMax(val)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                      budgetMax === val
                        ? 'bg-[#125435] text-white border-[#125435]'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    R$ {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Navegação */}
            <div className="pt-4 flex items-center justify-between">
              <Button variant="outline" onClick={() => goToStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar à Etapa 1
              </Button>
              <Button
                onClick={() => goToStep(3)}
                className="bg-[#125435] text-white hover:bg-emerald-900"
              >
                Continuar para Etapa 3 <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3: O que é indispensável? + Resumo Editável */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="bg-white border-2 border-stone-200/90 shadow-sm rounded-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="font-serif-title text-2xl text-stone-900 font-normal">
                3. O que é indispensável para a sua loja?
              </CardTitle>
              <CardDescription className="text-stone-600 text-sm">
                Marque apenas o que não pode faltar de jeito nenhum. Se a ferramenta não cumprir,
                será excluída.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MANDATORY_OPTIONS.map((item) => {
                  const Icon = item.icon
                  const isChecked = mandatoryRequirements.includes(item.key)
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleMandatory(item.key)}
                      className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-[#125435] bg-emerald-50 text-[#125435]'
                          : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleMandatory(item.key)}
                      />
                    </div>
                  )
                })}
              </div>

              <div className="text-xs text-stone-500 bg-stone-50 p-2.5 rounded border border-stone-200">
                💡 <strong>Dica da rede:</strong> Se você marcar "Operar com internet instável" e o
                orçamento for muito baixo (até R$ 50), o catálogo pode não ter solução pronta — mas
                você poderá pedir apoio da sua Associação Comercial para criar um desafio coletivo!
              </div>
            </CardContent>
          </Card>

          {/* Resumo Editável das Respostas */}
          <Card className="bg-[#FAF7F0] border-2 border-emerald-900/20 rounded-xl shadow-xs">
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif-title text-xl text-[#125435] font-normal flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  Resumo do seu diagnóstico
                </CardTitle>
                <span className="text-xs text-stone-500">Clique no lápis para editar</span>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 space-y-3 divide-y divide-stone-200 text-xs sm:text-sm">
              {/* Linha 1 */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-stone-500 block text-xs">
                    Objetivos prioritários (Etapa 1)
                  </span>
                  <span className="font-semibold text-stone-900">
                    {selectedGoals
                      .map((g) => OBJECTIVE_OPTIONS.find((o) => o.key === g)?.label)
                      .join(', ') || 'Nenhum'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="h-7 text-xs text-[#125435]"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </div>

              {/* Linha 2 */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-stone-500 block text-xs">Sua loja e canais (Etapa 2)</span>
                  <span className="font-semibold text-stone-900">
                    {segment} em {municipality} · Vende por {channels.join(', ')} (Principal:{' '}
                    {mainChannel})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="h-7 text-xs text-[#125435]"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </div>

              {/* Linha 3 */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-stone-500 block text-xs">
                    Orçamento mensal máximo (Etapa 2)
                  </span>
                  <span className="font-semibold text-[#125435]">Até R$ {budgetMax} por mês</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="h-7 text-xs text-[#125435]"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </div>

              {/* Linha 4 */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-stone-500 block text-xs">
                    Requisitos indispensáveis (Etapa 3)
                  </span>
                  <span className="font-semibold text-stone-900">
                    {mandatoryRequirements
                      .map((r) => MANDATORY_OPTIONS.find((m) => m.key === r)?.label)
                      .join(', ') || 'Nenhum obrigatório'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(3)}
                  className="h-7 text-xs text-[#125435]"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Botões Finais de Busca */}
          <div className="pt-2 flex items-center justify-between">
            <Button variant="outline" onClick={() => goToStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar à Etapa 2
            </Button>

            <Button
              size="lg"
              disabled={isSaving}
              onClick={validateAndSearch}
              className="bg-[#125435] text-white hover:bg-emerald-900 font-semibold px-6"
            >
              {isSaving ? 'Buscando recomendações...' : 'Buscar recomendações transparentes'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
