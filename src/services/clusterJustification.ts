// Gerador de justificativa de agrupamento de demandas (PT-BR).
// A partir das demandas selecionadas no Radar, monta um texto em linguagem de
// comércio local explicando POR QUE elas foram agrupadas: objetivo/problema em
// comum, canal de vendas compartilhado e requisitos indispensáveis iguais.
// O texto é uma sugestão EDITÁVEL — a associação ajusta antes de publicar.
import type { DemandRecord, MandatoryRequirementKey } from '@/types/vitrine'

const NUMERAL_WORDS: Record<number, string> = {
  2: 'Duas',
  3: 'Três',
  4: 'Quatro',
  5: 'Cinco',
  6: 'Seis',
  7: 'Sete',
  8: 'Oito',
  9: 'Nove',
  10: 'Dez',
}

const SEGMENT_LABELS: Record<string, string> = {
  Vestuario: 'lojas de vestuário',
  Alimentacao: 'alimentação',
  Automecanica: 'oficinas mecânicas',
  Servicos: 'prestadores de serviço',
  Farmacia: 'farmácias',
  Outro: 'comércios',
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  loja_fisica: 'balcão da loja física',
  site: 'loja virtual (site)',
  telefone: 'telefone',
}

const REQUIREMENT_LABELS: Record<MandatoryRequirementKey, string> = {
  funciona_celular: 'funcionar no celular',
  suporte_portugues: 'ter suporte em português',
  opera_offline: 'operar mesmo quando a internet cai',
  dispensa_troca_sistema: 'não exigir a troca do sistema atual da loja',
}

function countLabel(n: number): string {
  if (n === 1) return 'Uma loja'
  const word = NUMERAL_WORDS[n]
  return word ? `${word} lojas` : `${n} lojas`
}

function countLabelLower(n: number): string {
  return countLabel(n).replace(/^Uma$/, 'uma')
}

function joinList(items: string[], lastSeparator = 'e'): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} ${lastSeparator} ${items[items.length - 1]}`
}

/** Interseção de requisitos indispensáveis de todas as demandas. */
export function commonRequirements(demands: DemandRecord[]): MandatoryRequirementKey[] {
  if (demands.length === 0) return []
  return (demands[0].requirements || []).filter((req) =>
    demands.every((d) => (d.requirements || []).includes(req)),
  )
}

/** Canais de venda citados pelas demandas (sem repetição). */
export function commonChannels(demands: DemandRecord[]): string[] {
  const seen = new Set<string>()
  for (const d of demands) {
    const ch = (d.channel || '').trim()
    if (ch) seen.add(ch)
  }
  return Array.from(seen)
}

function municipalities(demands: DemandRecord[]): string[] {
  const seen = new Set<string>()
  for (const d of demands) {
    const m = (d.municipality || '').trim()
    if (m) seen.add(m)
  }
  return Array.from(seen)
}

/** Extrai palavras-chave repetidas entre os problemas relatados (mínimo 4 letras). */
function repeatedProblemWords(demands: DemandRecord[]): string[] {
  if (demands.length < 2) return []
  const stop = new Set([
    'para',
    'como',
    'quando',
    'porque',
    'sobre',
    'isso',
    'mais',
    'muito',
    'estou',
    'temos',
    'todos',
    'cada',
    'nossa',
    'meu',
    'minha',
    'que',
    'sem',
    'com',
    'uma',
    'dos',
    'das',
    'nas',
    'nos',
    'pelo',
    'pela',
    'estar',
    'fica',
    'fica',
    'vender',
    'loja',
    'cliente',
    'clientes',
  ])
  const base = demands[0].problem || ''
  const others = demands.slice(1)
  const words = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stop.has(w))
  const hits: string[] = []
  for (const w of words) {
    if (hits.includes(w)) continue
    const appearsInAll = others.every((d) => {
      const norm = (d.problem || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z\s]/g, ' ')
      return norm.includes(w)
    })
    if (appearsInAll) hits.push(w)
  }
  return hits
}

/**
 * Gera a justificativa do agrupamento em linguagem de comércio local.
 * Ex.: "Três lojas de alimentação relatam vendas travadas: precisam registrar
 * pedidos no balcão da loja física e no WhatsApp mesmo com a conexão instável
 * (opera offline) e acompanhar o estoque em tempo real."
 */
export function buildClusterJustification(demands: DemandRecord[]): string {
  if (demands.length === 0) {
    return 'Nenhuma demanda selecionada para agrupar ainda.'
  }

  const n = demands.length
  const count = countLabel(n)
  const segKeys = Array.from(new Set(demands.map((d) => d.segment)))
  const segments = segKeys.map((s) => SEGMENT_LABELS[s] || 'comércios').filter(Boolean)
  const segmentPhrase =
    segments.length > 0 ? joinList(segments, 'e') : 'comércios do nosso município'

  const reqKeys = commonRequirements(demands)
  const reqPhrases = reqKeys.map((r) => REQUIREMENT_LABELS[r] || r)

  const channels = commonChannels(demands)
  const channelPhrase =
    channels.length > 0
      ? `vendem e atendem pelo ${joinList(channels, 'e pelo')}`
      : 'atendem pelos mesmos canais de venda'

  const cities = municipalities(demands)
  const placePhrase =
    cities.length > 1
      ? `de ${cities[0]} e região`
      : cities.length === 1
        ? `de ${cities[0]} e região`
        : ''

  const sharedWords = repeatedProblemWords(demands)
  const problemExample = (demands[0].problem || '').trim()

  // Montagem por partes — cada frase só entra quando existe dado real.
  const parts: string[] = []

  parts.push(
    `${count} ${segmentPhrase}${placePhrase ? ` ${placePhrase}` : ''} relatam a mesma dificuldade no dia a dia.`,
  )

  if (problemExample) {
    const shared =
      sharedWords.length > 0 ? ` O ponto em comum aparece na expressão "${sharedWords[0]}".` : ''
    parts.push(`Todas descrevem o problema assim: "${problemExample}".${shared}`)
  }

  parts.push(`Todas ${channelPhrase}.`)

  if (reqPhrases.length > 0) {
    parts.push(
      `Exigem da solução, como indispensável: ${joinList(reqPhrases)} — por isso, devem ser atendidas juntas em um único desafio.`,
    )
  } else {
    parts.push('Por isso, devem ser atendidas juntas em um único desafio.')
  }

  return parts.join(' ')
}

/** Versão curta (uma linha), usada em badges/resumos agregados. */
export function buildClusterJustificationShort(demands: DemandRecord[]): string {
  const n = demands.length
  if (n === 0) return ''
  const count = countLabelLower(n)
  const reqPhrases = commonRequirements(demands).map((r) => REQUIREMENT_LABELS[r] || r)
  const segments = Array.from(new Set(demands.map((d) => SEGMENT_LABELS[d.segment] || 'comércios')))
  const segPhrase = segments.length > 0 ? segments.join(' e ') : 'comércios'
  const reqPhrase = reqPhrases.length > 0 ? ` com exigência comum de ${joinList(reqPhrases)}` : ''
  return `${count} ${segPhrase} com a mesma dificuldade${reqPhrase}.`
}

/** Resumo agregado exibido na página do desafio (para startup e associação). */
export function buildChallengeSummary(demands: DemandRecord[]): {
  storesCount: number
  storesPhrase: string
  requirements: string[]
  channels: string[]
  desiredResults: string[]
} {
  const reqPhrases = commonRequirements(demands).map((r) => REQUIREMENT_LABELS[r] || r)
  const results = Array.from(
    new Set(demands.map((d) => (d.desired_result || '').trim()).filter(Boolean)),
  )
  return {
    storesCount: demands.length,
    storesPhrase: countLabel(demands.length),
    requirements: reqPhrases,
    channels: commonChannels(demands),
    desiredResults: results,
  }
}
