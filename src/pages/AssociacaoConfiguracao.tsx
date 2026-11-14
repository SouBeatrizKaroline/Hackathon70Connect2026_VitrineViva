import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings,
  Building2,
  CheckCircle2,
  Sliders,
  Palette,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { getAppConfig, updateAppConfig, listSolutions } from '@/services/vitrineService'
import type { AppConfigRecord, SolutionItem } from '@/types/vitrine'

export default function AssociacaoConfiguracaoPage() {
  const [config, setConfig] = useState<AppConfigRecord | null>(null)
  const [solutions, setSolutions] = useState<SolutionItem[]>([])

  const [associationName, setAssociationName] = useState('AC Marilia - Rede FACESP Connect')
  const [municipality, setMunicipality] = useState('Marilia')
  const [profileType, setProfileType] = useState<'equipe_pequena' | 'equipe_inovacao'>(
    'equipe_inovacao',
  )
  const [palette, setPalette] = useState('verde_profundo')
  const [activeSolutionIds, setActiveSolutionIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [cfg, sols] = await Promise.all([getAppConfig(), listSolutions()])
      setSolutions(sols)
      if (cfg) {
        setConfig(cfg)
        if (cfg.association_name) setAssociationName(cfg.association_name)
        if (cfg.municipality) setMunicipality(cfg.municipality)
        if (cfg.profile_type) setProfileType(cfg.profile_type)
        if (cfg.visual_palette) setPalette(cfg.visual_palette)
        if (cfg.active_solution_ids?.length) {
          setActiveSolutionIds(cfg.active_solution_ids)
        } else {
          setActiveSolutionIds(sols.map((s) => s.id))
        }
      } else {
        setActiveSolutionIds(sols.map((s) => s.id))
      }
    }
    load()
  }, [])

  const handleToggleSolution = (solId: string) => {
    setActiveSolutionIds((prev) =>
      prev.includes(solId) ? prev.filter((id) => id !== solId) : [...prev, solId],
    )
  }

  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      await updateAppConfig({
        association_name: associationName,
        municipality,
        profile_type: profileType,
        visual_palette: palette,
        active_solution_ids: activeSolutionIds,
      })

      toast({
        title: 'Configuracoes salvas e sincronizadas',
        description: 'O catalogo e parametros de replicacao da FACESP foram atualizados.',
      })
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: err?.message || 'Tente novamente.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* 1. Cabecalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#125435]">
            <Settings className="w-4 h-4 text-blue-700" />
            <span>Replicacao FACESP · Customizacao e Operacao</span>
          </div>
          <h1 className="font-serif-title text-3xl sm:text-4xl text-stone-900 font-normal mt-1">
            Configuracao da Associacao Comercial
          </h1>
          <p className="text-stone-600 text-sm">
            Adapte a Vitrine Viva para a escala da sua AC: equipe pequena ou nucleo de inovacao
            aberta.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="text-xs">
          <Link to="/associacao">Voltar ao Radar</Link>
        </Button>
      </div>

      {/* 2. Seletor de Perfil Demonstrativo da Associacao */}
      <Card className="bg-white border-2 border-stone-200 rounded-xl p-6 space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
            1. Perfil operacional da Associacao:
          </span>
          <p className="text-xs text-stone-500">
            Alterne entre os dois modelos desenhados para a rede FACESP.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setProfileType('equipe_pequena')}
            className={`p-4 rounded-xl border-2 text-left transition-all space-y-1 ${
              profileType === 'equipe_pequena'
                ? 'border-[#125435] bg-emerald-50 text-[#125435] ring-2 ring-emerald-600/20'
                : 'border-stone-200 bg-white text-stone-800 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Equipe Pequena</span>
              {profileType === 'equipe_pequena' && (
                <CheckCircle2 className="w-4 h-4 text-[#125435]" />
              )}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Diagnostico padronizado, catalogo compartilhado da federacao e revisao manual
              simplificada. Ideal para ACs menores do interior.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setProfileType('equipe_inovacao')}
            className={`p-4 rounded-xl border-2 text-left transition-all space-y-1 ${
              profileType === 'equipe_inovacao'
                ? 'border-[#125435] bg-emerald-50 text-[#125435] ring-2 ring-emerald-600/20'
                : 'border-stone-200 bg-white text-stone-800 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Equipe de Inovacao</span>
              {profileType === 'equipe_inovacao' && (
                <CheckCircle2 className="w-4 h-4 text-[#125435]" />
              )}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Parceiros locais, pilotos em paralelo, desafios entre municipios e integracao direta
              com o ecossistema Connect.
            </p>
          </button>
        </div>
      </Card>

      {/* 3. Parametros de Identidade e Municipio */}
      <Card className="bg-white border-2 border-stone-200 rounded-xl p-6 space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
            2. Identidade e Regiao de Atuacao:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">Nome da Associacao:</label>
            <Input
              value={associationName}
              onChange={(e) => setAssociationName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">Municipio Sede:</label>
            <Input
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <label className="text-xs font-semibold text-stone-700">
            Paleta de Destaque da Regiao:
          </label>
          <div className="flex items-center gap-2">
            {[
              { key: 'verde_profundo', label: 'Verde Profundo FACESP', color: 'bg-[#125435]' },
              { key: 'azul_institucional', label: 'Azul Conectividade', color: 'bg-blue-800' },
              { key: 'ambar_comercio', label: 'Ambar Varejo', color: 'bg-amber-700' },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPalette(p.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  palette === p.key ? 'border-[#125435] bg-stone-100 font-bold' : 'border-stone-200'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${p.color}`} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 4. Gestao do Catalogo Disponivel (Ligar/Desligar Solucoes) */}
      <Card className="bg-white border-2 border-stone-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              3. Catalogo disponivel para seus lojistas:
            </span>
            <p className="text-xs text-stone-500">
              Ligue ou desligue solucoes da vitrine da sua cidade ({activeSolutionIds.length}{' '}
              ativas).
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Catalogo Compartilhado FACESP
          </Badge>
        </div>

        <div className="divide-y divide-stone-100">
          {solutions.map((sol) => {
            const isEnabled = activeSolutionIds.includes(sol.id)
            return (
              <div
                key={sol.id}
                className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <div>
                  <div className="font-semibold text-stone-900">{sol.name}</div>
                  <span className="text-stone-500 text-xs">
                    R$ {sol.price_monthly}/mes · Esforco {sol.implementation_effort}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">{isEnabled ? 'Ativa' : 'Pausada'}</span>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggleSolution(sol.id)}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <Button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="w-full bg-[#125435] text-white hover:bg-emerald-900 font-semibold"
        >
          {isSaving ? 'Salvando...' : 'Salvar configuracoes da AC'}
        </Button>
      </Card>

      {/* 5. Secao Curta "Como Colocar em Operacao" (Requisitos FACESP) */}
      <Card className="bg-[#FAF7F0] border-2 border-emerald-900/20 rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h2 className="font-serif-title text-2xl text-[#125435] font-normal">
            Como colocar em operacao na rede FACESP
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <div className="p-4 bg-white rounded-lg border border-stone-200 space-y-1.5">
            <strong className="text-stone-900 block font-serif-title text-base">
              Fase 1: Piloto com Dois Perfis
            </strong>
            <p>
              Validar primeiro com duas associacoes comerciais de perfis diferentes (uma de equipe
              pequena e outra com nucleo de inovacao), um grupo de 15 lojistas e 3 startups do
              ecossistema Connect.
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-stone-200 space-y-1.5">
            <strong className="text-stone-900 block font-serif-title text-base">
              Sustentabilidade Financeira
            </strong>
            <p>
              Hipotese de sustentabilidade baseada em licenca institucional para as associacoes
              filiadas a FACESP mais contratacao voluntaria das solucoes pelos lojistas apos o
              piloto de 7 dias.
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-stone-200 space-y-1.5">
            <strong className="text-stone-900 block font-serif-title text-base">
              Integridade do Catalogo
            </strong>
            <p>
              Preservar estritamente a ordenacao por compatibilidade tecnica e preco — sem taxa de
              leilao ou destaque pago que distorca a confianca do comerciante.
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-stone-200 space-y-1.5">
            <strong className="text-stone-900 block font-serif-title text-base">
              Hipoteses a Validar
            </strong>
            <ul className="list-disc pl-4 space-y-0.5 text-xs">
              <li>Adesao do comerciante ao diagnostico sem apoio presencial;</li>
              <li>Capacidade de mediacao e agrupamento pelas associacoes;</li>
              <li>Disposicao das startups para atender demandas coletivas agrupadas.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
