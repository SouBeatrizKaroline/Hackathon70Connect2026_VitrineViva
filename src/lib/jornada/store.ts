// Estado local da jornada de demonstração (localStorage do navegador).
// O áudio nunca é guardado; o relato em texto fica só neste aparelho.
import { useSyncExternalStore } from 'react'
import { NEGOCIO_DEMO, TEMA_LABEL } from './catalogo'
import type {
  CategoriaId,
  Demanda,
  Entendimento,
  Rascunho,
  StatusDemanda,
  TemaId,
} from './types'

const CHAVE = 'vv_jornada_demo_v1'

interface Estado {
  rascunho: Rascunho | null
  demandas: Demanda[]
  /** Ações simuladas da associação por grupo do Radar. */
  acoesRadar: Record<string, string[]>
}

const VAZIO: Estado = { rascunho: null, demandas: [], acoesRadar: {} }

function ler(): Estado {
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return VAZIO
    const dados = JSON.parse(bruto)
    return {
      rascunho: dados.rascunho ?? null,
      demandas: Array.isArray(dados.demandas) ? dados.demandas : [],
      acoesRadar: dados.acoesRadar ?? {},
    }
  } catch {
    return VAZIO
  }
}

let estado: Estado = typeof window === 'undefined' ? VAZIO : ler()
const ouvintes = new Set<() => void>()

function gravar(novo: Estado) {
  estado = novo
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(novo))
  } catch {
    // armazenamento indisponível: segue apenas em memória
  }
  ouvintes.forEach((f) => f())
}

export function useJornada(): Estado {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      return () => ouvintes.delete(f)
    },
    () => estado,
  )
}

export function obterEstado(): Estado {
  return estado
}

const agora = () => new Date().toISOString()

export function salvarRascunho(r: Rascunho | null) {
  gravar({ ...estado, rascunho: r })
}

function alterar(id: string, fn: (d: Demanda) => Demanda) {
  gravar({ ...estado, demandas: estado.demandas.map((d) => (d.id === id ? fn(d) : d)) })
}

function avancar(d: Demanda, status: StatusDemanda, nota: string): Demanda {
  return { ...d, status, historico: [...d.historico, { status, em: agora(), nota }] }
}

export function criarDemanda(entendimento: Entendimento, rascunho: Rascunho): Demanda {
  const n = estado.demandas.length + 1
  const quando = agora()
  const demanda: Demanda = {
    id: `d${Date.now()}`,
    codigo: `DEMO-${String(n).padStart(3, '0')}`,
    criadaEm: quando,
    origem: rascunho.origem,
    relatoExemplo: rascunho.exemplo,
    relato: rascunho.texto,
    entendimento,
    status: 'revisada',
    historico: [
      { status: 'criada', em: quando, nota: 'Relato organizado em um rascunho de demanda.' },
      { status: 'revisada', em: quando, nota: 'Você conferiu e confirmou o resumo.' },
    ],
    categoriaEscolhida: null,
    propostas: [],
    autorizouFornecedores: false,
    autorizouRadar: false,
    pilotoFornecedorId: null,
  }
  gravar({ ...estado, rascunho: null, demandas: [demanda, ...estado.demandas] })
  return demanda
}

export function corrigirDemanda(id: string, entendimento: Entendimento) {
  alterar(id, (d) => ({
    ...d,
    entendimento,
    historico: [
      ...d.historico,
      { status: d.status, em: agora(), nota: 'Você corrigiu o resumo da demanda.' },
    ],
  }))
}

export function pedirPropostas(
  id: string,
  categoria: CategoriaId,
  fornecedorIds: string[],
  autorizouRadar: boolean,
) {
  alterar(id, (d) =>
    avancar(
      {
        ...d,
        categoriaEscolhida: categoria,
        autorizouFornecedores: true,
        autorizouRadar,
        propostas: fornecedorIds.map((fornecedorId) => ({ fornecedorId, situacao: 'aguardando' })),
      },
      'fornecedores_convidados',
      `Resumo compartilhado com ${fornecedorIds.length} fornecedor(es) (envio simulado).`,
    ),
  )
}

/** Simula o retorno dos fornecedores. Com 3 convidados, um fica sem resposta. */
export function simularRetorno(id: string) {
  alterar(id, (d) => {
    const total = d.propostas.length
    const respondem = total >= 3 ? total - 1 : total
    const propostas = d.propostas.map((p, i) =>
      i < respondem ? { ...p, situacao: 'recebida' as const, recebidaEm: agora() } : p,
    )
    return avancar(
      { ...d, propostas },
      'propostas_recebidas',
      `${respondem} proposta(s) recebida(s) — retorno simulado para demonstração.`,
    )
  })
}

export function marcarEmAvaliacao(id: string) {
  alterar(id, (d) => avancar(d, 'em_avaliacao', 'Você está comparando as propostas.'))
}

export function iniciarPiloto(id: string, fornecedorId: string, nome: string) {
  alterar(id, (d) =>
    avancar(
      { ...d, pilotoFornecedorId: fornecedorId },
      'piloto',
      `Piloto combinado com ${nome} (simulação; nenhum resultado medido ainda).`,
    ),
  )
}

export function concluirDemanda(id: string) {
  alterar(id, (d) => avancar(d, 'concluida', 'Demanda encerrada por você.'))
}

export function cancelarDemanda(id: string) {
  alterar(id, (d) =>
    avancar(
      { ...d, autorizouRadar: false },
      'cancelada',
      'Solicitação cancelada por você. Fornecedores não receberão novos dados.',
    ),
  )
}

export function registrarAcaoRadar(grupo: string, acao: string) {
  const atuais = estado.acoesRadar[grupo] ?? []
  if (atuais.includes(acao)) return
  gravar({ ...estado, acoesRadar: { ...estado.acoesRadar, [grupo]: [...atuais, acao] } })
}

export function limparJornada() {
  gravar(VAZIO)
}

// ---------- Radar agregado ----------
export interface GrupoRadar {
  chave: string
  tema: TemaId
  temaRotulo: string
  segmento: string
  municipio: string
  total: number
}

/** Contagens FICTÍCIAS de base, para a visão agregada da demonstração. */
const BASE_RADAR: Omit<GrupoRadar, 'chave' | 'temaRotulo'>[] = [
  { tema: 'estoque_canais', segmento: 'Moda e acessórios', municipio: 'Marília', total: 6 },
  { tema: 'atendimento', segmento: 'Moda e acessórios', municipio: 'Marília', total: 4 },
  { tema: 'pedidos_entregas', segmento: 'Alimentação', municipio: 'Marília', total: 5 },
  { tema: 'pedidos_entregas', segmento: 'Alimentação', municipio: 'Tatuí', total: 3 },
  { tema: 'gestao', segmento: 'Autopeças', municipio: 'Ourinhos', total: 2 },
  { tema: 'vender_digital', segmento: 'Serviços e beleza', municipio: 'Marília', total: 3 },
  { tema: 'estoque_canais', segmento: 'Farmácia', municipio: 'Tatuí', total: 1 },
]

export const MINIMO_RADAR = 3

export function gruposDoRadar(demandas: Demanda[]): GrupoRadar[] {
  const mapa = new Map<string, GrupoRadar>()
  const somar = (tema: TemaId, segmento: string, municipio: string, n: number) => {
    const chave = `${tema}|${segmento}|${municipio}`
    const atual = mapa.get(chave)
    if (atual) atual.total += n
    else mapa.set(chave, { chave, tema, temaRotulo: TEMA_LABEL[tema], segmento, municipio, total: n })
  }
  BASE_RADAR.forEach((g) => somar(g.tema, g.segmento, g.municipio, g.total))
  demandas
    .filter((d) => d.autorizouRadar && d.status !== 'cancelada')
    .forEach((d) => somar(d.entendimento.tema, NEGOCIO_DEMO.segmento, NEGOCIO_DEMO.municipio, 1))
  return [...mapa.values()].sort((a, b) => b.total - a.total)
}
