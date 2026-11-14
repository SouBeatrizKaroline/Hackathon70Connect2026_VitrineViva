// Tipos da jornada mobile-first (voz/texto → demanda → caminhos → propostas → acompanhamento).
// Tudo aqui é dado local de DEMONSTRAÇÃO: catálogo fictício, propostas simuladas.

export type TemaId = 'estoque_canais' | 'atendimento' | 'pedidos_entregas' | 'vender_digital' | 'gestao'

export type CategoriaId =
  | 'integracao_estoque'
  | 'catalogo_digital'
  | 'automacao_atendimento'
  | 'gestao_pedidos'
  | 'sistema_gestao'
  | 'presenca_digital'

export type Urgencia = 'alta' | 'media' | 'nao_informada'
export type OrigemRelato = 'audio' | 'texto'

export interface Rascunho {
  origem: OrigemRelato
  texto: string
  /** true quando o texto veio do exemplo pronto (transcrição de demonstração). */
  exemplo: boolean
  temaSugerido?: TemaId
}

export interface Entendimento {
  tema: TemaId
  objetivo: string
  situacaoAtual: string
  tipoSolucao: string
  restricoes: string
  urgencia: Urgencia
  resultadoEsperado: string
  /** id da opção escolhida na pergunta de confirmação (ou null se não respondida). */
  respostaPergunta: string | null
}

export type StatusDemanda =
  | 'criada'
  | 'revisada'
  | 'fornecedores_convidados'
  | 'propostas_recebidas'
  | 'em_avaliacao'
  | 'piloto'
  | 'concluida'
  | 'cancelada'

export interface EventoDemanda {
  status: StatusDemanda
  em: string
  nota: string
}

export interface Proposta {
  fornecedorId: string
  situacao: 'aguardando' | 'recebida'
  recebidaEm?: string
}

export interface Demanda {
  id: string
  codigo: string
  criadaEm: string
  origem: OrigemRelato
  relatoExemplo: boolean
  /** Relato original: fica só neste aparelho; nunca vai para o Radar agregado. */
  relato: string
  entendimento: Entendimento
  status: StatusDemanda
  historico: EventoDemanda[]
  categoriaEscolhida: CategoriaId | null
  propostas: Proposta[]
  autorizouFornecedores: boolean
  autorizouRadar: boolean
  pilotoFornecedorId: string | null
}

export interface Fornecedor {
  id: string
  nome: string
  categorias: CategoriaId[]
  perfil: string
  funcionalidades: string[]
  /** null = não informado pelo fornecedor (nunca estimar em silêncio). */
  precoMensal: number | null
  implantacao: number | null
  treinamento: string | null
  custosVariaveis: string | null
  integracoes: string | null
  prazoDias: number | null
  suporte: string | null
  fidelidade: string | null
  requisitos: string | null
  naoIncluido: string | null
  exigeTrocaSistema: boolean | null
  validadeProposta: string | null
}

export interface CriterioAdequacao {
  criterio: string
  situacao: 'atende' | 'nao_atende' | 'confirmar'
  detalhe: string
}
