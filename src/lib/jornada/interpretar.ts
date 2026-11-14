// Motor DEMONSTRATIVO de regras: converte o relato em um rascunho estruturado.
// Não é um modelo de linguagem. O resultado é sempre tratado como rascunho
// e precisa ser confirmado (ou corrigido) pelo próprio lojista.
import { CATEGORIAS, fornecedoresDaCategoria } from './catalogo'
import type {
  CategoriaId,
  CriterioAdequacao,
  Entendimento,
  Fornecedor,
  TemaId,
  Urgencia,
} from './types'

export const RELATO_EXEMPLO =
  'Eu vendo pelo Instagram e pelo WhatsApp, mas quando chega uma peça nova eu tenho que atualizar tudo na mão. Às vezes o estoque não bate, vendo uma peça que já acabou e perco tempo respondendo se ainda tem tamanho. Queria algo simples, que não custasse caro e que não exigisse trocar todo meu sistema.'

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const PALAVRAS_TEMA: Record<TemaId, string[]> = {
  estoque_canais: [
    'estoque',
    'nao bate',
    'ja acabou',
    'esgot',
    'tamanho',
    'disponib',
    'atualizar tudo',
    'na mao',
    'catalogo',
    'peca nova',
    'sincroniz',
  ],
  atendimento: [
    'respond',
    'demoro',
    'mensage',
    'retorn',
    'sem resposta',
    'atendimento',
    'orcamento',
    'sumiu',
    'esqueco',
  ],
  pedidos_entregas: ['pedido', 'entrega', 'entregador', 'anoto', 'caderno', 'encomenda', 'atras'],
  vender_digital: [
    'vender mais',
    'vender melhor',
    'divulg',
    'cliente novo',
    'clientes novos',
    'site',
    'loja virtual',
    'online',
    'anuncio',
    'digital',
  ],
  gestao: ['sistema', 'caixa', 'nota fiscal', 'financeiro', 'controle', 'fiado', 'planilha'],
}

export interface OpcaoPergunta {
  id: string
  rotulo: string
}

interface DefinicaoTema {
  objetivo: string
  situacao: string
  tipoSolucao: string
  resultado: string
  pergunta: { texto: string; opcoes: OpcaoPergunta[] }
  caminhos: { categoria: CategoriaId; porque: string; limite?: string }[]
  naoRecomendado: string[]
}

const OPCOES_CONTROLE: OpcaoPergunta[] = [
  { id: 'planilha', rotulo: 'Planilha' },
  { id: 'sistema', rotulo: 'Sistema' },
  { id: 'caderno', rotulo: 'Caderno' },
  { id: 'outro', rotulo: 'Outro' },
]

export const TEMAS: Record<TemaId, DefinicaoTema> = {
  estoque_canais: {
    objetivo: 'Sincronizar catálogo e estoque entre os canais de venda',
    situacao: 'Atualização manual a cada novidade e divergência de disponibilidade entre canais',
    tipoSolucao: 'Integração de catálogo e estoque, ou catálogo digital de atualização simples',
    resultado: 'Reduzir retrabalho e evitar vender item indisponível',
    pergunta: {
      texto: 'Você já usa algum sistema para controlar o estoque?',
      opcoes: OPCOES_CONTROLE,
    },
    caminhos: [
      {
        categoria: 'integracao_estoque',
        porque:
          'Você descreveu estoque que não bate entre canais. Uma fonte única de estoque ataca a causa, sem trocar o que já usa.',
        limite: 'Melhor aderência se o controle atual tiver como ser conectado.',
      },
      {
        categoria: 'catalogo_digital',
        porque:
          'Alternativa de menor complexidade e custo: um único lugar para atualizar, em vez de vários.',
        limite: 'Indicada quando não há sistema compatível com integração.',
      },
      {
        categoria: 'automacao_atendimento',
        porque: 'Pode reduzir as perguntas repetidas sobre tamanho e disponibilidade.',
        limite: 'Não resolve a divergência de estoque sem uma fonte confiável de informação.',
      },
    ],
    naoRecomendado: [
      'Trocar todo o sistema de gestão agora: seu relato pede algo simples e sem substituir o que já usa.',
      'Contratar um chatbot antes de resolver a consistência do estoque: ele responderia com informação errada.',
    ],
  },
  atendimento: {
    objetivo: 'Responder clientes mais rápido e não perder pedidos por falta de retorno',
    situacao: 'Mensagens se acumulam e parte dos clientes fica sem resposta ou retorno',
    tipoSolucao: 'Organização do atendimento por mensagens, com lembretes e respostas prontas',
    resultado: 'Menos clientes sem resposta e mais pedidos retomados',
    pergunta: {
      texto: 'Quantas pessoas respondem as mensagens do negócio?',
      opcoes: [
        { id: 'uma', rotulo: 'Só eu' },
        { id: 'duas_tres', rotulo: '2 ou 3' },
        { id: 'quatro_mais', rotulo: '4 ou mais' },
        { id: 'outro', rotulo: 'Varia' },
      ],
    },
    caminhos: [
      {
        categoria: 'automacao_atendimento',
        porque: 'Você relatou demora e retornos esquecidos. Fila, lembretes e respostas prontas atacam isso.',
      },
      {
        categoria: 'gestao_pedidos',
        porque: 'Se o que se perde são pedidos em andamento, registrar cada pedido evita o esquecimento.',
      },
      {
        categoria: 'catalogo_digital',
        porque: 'Um catálogo com preço e disponibilidade reduz as perguntas repetidas.',
        limite: 'Ajuda no volume de mensagens, não na organização dos retornos.',
      },
    ],
    naoRecomendado: [
      'Robô que responde tudo sozinho, sem revisão: pode informar preço ou disponibilidade errados.',
      'Mudar de canal de venda: o problema relatado é organização, não o canal.',
    ],
  },
  pedidos_entregas: {
    objetivo: 'Organizar pedidos e entregas para não esquecer nem atrasar',
    situacao: 'Pedidos anotados em lugares diferentes e entregas combinadas sem registro único',
    tipoSolucao: 'Gestão simples de pedidos, com status e roteiro de entregas',
    resultado: 'Saber o que está pendente e entregar no prazo combinado',
    pergunta: {
      texto: 'Onde você anota os pedidos hoje?',
      opcoes: [
        { id: 'caderno', rotulo: 'Caderno ou papel' },
        { id: 'conversas', rotulo: 'Nas conversas' },
        { id: 'planilha', rotulo: 'Planilha' },
        { id: 'sistema', rotulo: 'Sistema' },
      ],
    },
    caminhos: [
      {
        categoria: 'gestao_pedidos',
        porque: 'Um quadro único de pedidos com status resolve o que você descreveu.',
      },
      {
        categoria: 'automacao_atendimento',
        porque: 'Se os pedidos chegam por mensagem, organizar as conversas evita que algum se perca.',
      },
      {
        categoria: 'sistema_gestao',
        porque: 'Só faz sentido se você também precisa de estoque e caixa no mesmo lugar.',
        limite: 'Implantação mais longa e, em geral, exige trocar o que usa hoje.',
      },
    ],
    naoRecomendado: [
      'Sistema completo de gestão apenas para organizar entregas: custo e esforço maiores que o problema.',
    ],
  },
  vender_digital: {
    objetivo: 'Vender melhor pelos canais digitais',
    situacao: 'Divulgação depende de postagens manuais e o cliente não tem um lugar simples para ver os produtos',
    tipoSolucao: 'Catálogo ou vitrine online simples, ligada aos canais que a loja já usa',
    resultado: 'Mais clientes encontrando os produtos e pedindo sem depender de conversa longa',
    pergunta: {
      texto: 'O cliente já tem um lugar online para ver seus produtos?',
      opcoes: [
        { id: 'redes', rotulo: 'Só redes sociais' },
        { id: 'catalogo', rotulo: 'Catálogo ou link' },
        { id: 'site', rotulo: 'Site próprio' },
        { id: 'nao', rotulo: 'Ainda não' },
      ],
    },
    caminhos: [
      {
        categoria: 'catalogo_digital',
        porque: 'É o passo de menor custo para o cliente ver produtos e preços sem perguntar um a um.',
      },
      {
        categoria: 'presenca_digital',
        porque: 'Indicada se você quer receber pedido e pagamento sem conversa.',
        limite: 'Exige manter fotos, preços e estoque atualizados.',
      },
      {
        categoria: 'automacao_atendimento',
        porque: 'Ajuda a dar conta das conversas quando o volume de interessados cresce.',
        limite: 'Não traz clientes novos por si só.',
      },
    ],
    naoRecomendado: [
      'Investir em anúncios pagos antes de ter um lugar claro para o cliente ver e pedir os produtos.',
    ],
  },
  gestao: {
    objetivo: 'Encontrar um sistema simples para organizar vendas, estoque e caixa',
    situacao: 'Controle feito em papel, planilha ou de memória, sem visão única do negócio',
    tipoSolucao: 'Sistema de gestão simples para pequeno comércio',
    resultado: 'Saber o que entra, o que sai e o que precisa repor',
    pergunta: { texto: 'Como você controla vendas e estoque hoje?', opcoes: OPCOES_CONTROLE },
    caminhos: [
      {
        categoria: 'sistema_gestao',
        porque: 'Você procura um sistema: esta categoria reúne vendas, estoque e caixa.',
        limite: 'Confirme implantação, migração dos dados e cancelamento antes de decidir.',
      },
      {
        categoria: 'integracao_estoque',
        porque: 'Se o principal incômodo é o estoque, dá para resolver sem trocar tudo.',
      },
      {
        categoria: 'gestao_pedidos',
        porque: 'Se o principal incômodo são pedidos e entregas, uma ferramenta menor pode bastar.',
      },
    ],
    naoRecomendado: [
      'Sistema grande, com módulos que a loja não usa: paga-se por complexidade desnecessária.',
    ],
  },
}

export interface Restricoes {
  simples: boolean
  baixoCusto: boolean
  semTrocar: boolean
  celular: boolean
}

export function detectarRestricoes(texto: string): Restricoes {
  const t = normalizar(texto)
  const tem = (...p: string[]) => p.some((x) => t.includes(x))
  return {
    simples: tem('simples', 'facil', 'descomplic'),
    baixoCusto: tem('barat', 'caro', 'custo', 'em conta', 'pouco dinheiro', 'apertad'),
    semTrocar: tem('trocar', 'substituir', 'mudar de sistema', 'mudar todo'),
    celular: tem('celular'),
  }
}

function textoRestricoes(r: Restricoes): string {
  const itens: string[] = []
  if (r.simples) itens.push('solução simples')
  if (r.baixoCusto) itens.push('baixo custo')
  if (r.semTrocar) itens.push('sem substituir o sistema atual')
  if (r.celular) itens.push('funcionar no celular')
  if (itens.length === 0) return 'Nenhuma restrição citada no relato'
  const s = itens.join(', ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function detectarUrgencia(t: string): Urgencia {
  const tem = (...p: string[]) => p.some((x) => t.includes(x))
  if (tem('urgente', 'perdendo venda', 'perco venda', 'todo dia', 'todos os dias', 'nao aguento'))
    return 'alta'
  if (tem('as vezes', 'perco tempo', 'toda semana', 'sempre', 'frequen')) return 'media'
  return 'nao_informada'
}

export const URGENCIA_LABEL: Record<Urgencia, string> = {
  alta: 'Alta — afeta as vendas com frequência',
  media: 'Média — acontece de forma recorrente e gera retrabalho',
  nao_informada: 'Não informada no relato',
}

function canaisCitados(t: string): string[] {
  const c: string[] = []
  if (t.includes('instagram')) c.push('Instagram')
  if (t.includes('whatsapp') || t.includes('zap')) c.push('WhatsApp')
  if (t.includes('loja fisica') || t.includes('balcao')) c.push('loja física')
  if (t.includes('site')) c.push('site')
  return c
}

export interface ResultadoInterpretacao {
  /** null quando o motor de regras não reconheceu o assunto: o usuário escolhe. */
  entendimento: Entendimento | null
  sinais: number
}

export function montarEntendimento(tema: TemaId, relato: string): Entendimento {
  const t = normalizar(relato)
  const def = TEMAS[tema]
  const canais = canaisCitados(t)
  return {
    tema,
    objetivo: def.objetivo,
    situacaoAtual: canais.length
      ? `${def.situacao}. Canais citados: ${canais.join(', ')}.`
      : `${def.situacao}.`,
    tipoSolucao: def.tipoSolucao,
    restricoes: textoRestricoes(detectarRestricoes(relato)),
    urgencia: detectarUrgencia(t),
    resultadoEsperado: def.resultado,
    respostaPergunta: null,
  }
}

export function interpretar(relato: string, temaSugerido?: TemaId): ResultadoInterpretacao {
  const t = normalizar(relato)
  let melhor: TemaId | null = null
  let melhorPontos = 0
  for (const tema of Object.keys(PALAVRAS_TEMA) as TemaId[]) {
    let pontos = PALAVRAS_TEMA[tema].filter((p) => t.includes(p)).length
    if (tema === temaSugerido) pontos += 2
    if (pontos > melhorPontos) {
      melhor = tema
      melhorPontos = pontos
    }
  }
  if (!melhor) return { entendimento: null, sinais: 0 }
  return { entendimento: montarEntendimento(melhor, relato), sinais: melhorPontos }
}

/** Aviso de privacidade: o relato parece conter telefone ou documento? */
export function pareceTerDadoPessoal(texto: string): boolean {
  return /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(texto) || /\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/.test(texto)
}

export interface CaminhoRecomendado {
  categoria: CategoriaId
  nome: string
  oQueResolve: string
  porQueCombina: string
  limite?: string
  oQueConfirmar: string
  proximoPasso: string
  fornecedores: number
}

/** Até três caminhos, ordenados por adequação ao relato (nunca por pagamento). */
export function recomendarCaminhos(e: Entendimento): CaminhoRecomendado[] {
  const lista = [...TEMAS[e.tema].caminhos]
  // Regra de ordenação: sem sistema/planilha para conectar, o caminho mais simples sobe.
  if (
    e.tema === 'estoque_canais' &&
    (e.respostaPergunta === 'caderno' || e.respostaPergunta === 'outro')
  ) {
    const i = lista.findIndex((c) => c.categoria === 'catalogo_digital')
    if (i > 0) lista.unshift(lista.splice(i, 1)[0])
  }
  return lista.slice(0, 3).map((c) => {
    const info = CATEGORIAS[c.categoria]
    return {
      categoria: c.categoria,
      nome: info.nome,
      oQueResolve: info.oQueResolve,
      porQueCombina: c.porque,
      limite: c.limite,
      oQueConfirmar: info.oQueConfirmar,
      proximoPasso: info.proximoPasso,
      fornecedores: fornecedoresDaCategoria(c.categoria).length,
    }
  })
}

export const REFERENCIA_BAIXO_CUSTO = 100
export const REFERENCIA_SIMPLES_DIAS = 7

/** Adequação explicada por critério — não é uma nota sem evidência. */
export function avaliarAdequacao(f: Fornecedor, e: Entendimento): CriterioAdequacao[] {
  const r = detectarRestricoes(e.restricoes)
  const out: CriterioAdequacao[] = [
    { criterio: 'Atua na categoria recomendada', situacao: 'atende', detalhe: 'Consta no perfil.' },
  ]
  if (r.baixoCusto) {
    out.push(
      f.precoMensal === null
        ? { criterio: 'Baixo custo', situacao: 'confirmar', detalhe: 'Preço não informado.' }
        : f.precoMensal <= REFERENCIA_BAIXO_CUSTO
          ? {
              criterio: 'Baixo custo',
              situacao: 'atende',
              detalhe: `Mensalidade até R$ ${REFERENCIA_BAIXO_CUSTO} (referência da demo).`,
            }
          : {
              criterio: 'Baixo custo',
              situacao: 'nao_atende',
              detalhe: `Mensalidade acima de R$ ${REFERENCIA_BAIXO_CUSTO} (referência da demo).`,
            },
    )
  }
  if (r.semTrocar) {
    out.push(
      f.exigeTrocaSistema === null
        ? {
            criterio: 'Sem trocar o sistema atual',
            situacao: 'confirmar',
            detalhe: 'Compatibilidade não informada.',
          }
        : f.exigeTrocaSistema
          ? {
              criterio: 'Sem trocar o sistema atual',
              situacao: 'nao_atende',
              detalhe: 'Substitui o controle atual.',
            }
          : {
              criterio: 'Sem trocar o sistema atual',
              situacao: 'atende',
              detalhe: 'Funciona junto com o que você já usa.',
            },
    )
  }
  if (r.simples) {
    out.push(
      f.prazoDias === null
        ? { criterio: 'Implantação simples', situacao: 'confirmar', detalhe: 'Prazo não informado.' }
        : f.prazoDias <= REFERENCIA_SIMPLES_DIAS
          ? {
              criterio: 'Implantação simples',
              situacao: 'atende',
              detalhe: `Prazo estimado de ${f.prazoDias} dia(s).`,
            }
          : {
              criterio: 'Implantação simples',
              situacao: 'nao_atende',
              detalhe: `Prazo estimado de ${f.prazoDias} dias.`,
            },
    )
  }
  return out
}

export function ordenarPorAdequacao(lista: Fornecedor[], e: Entendimento): Fornecedor[] {
  const nota = (f: Fornecedor) => {
    const c = avaliarAdequacao(f, e)
    return (
      c.filter((x) => x.situacao === 'atende').length * 10 -
      c.filter((x) => x.situacao === 'nao_atende').length * 10 -
      c.filter((x) => x.situacao === 'confirmar').length
    )
  }
  return [...lista].sort((a, b) => nota(b) - nota(a))
}
