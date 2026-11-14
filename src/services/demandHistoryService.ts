import pb from '@/lib/pocketbase/client'
import type {
  DemandRecord,
  DemandStatus,
  DemandEventRecord,
  DemandEventType,
  DemandEventActor,
} from '@/types/vitrine'

// ============================================================
// Histórico de demandas — código legível (DEM-XXXX) + eventos
// ============================================================

const DEMAND_CODE_PREFIX = 'DEM'
const DEMAND_CODE_PAD = 4

/** Próximo código de demanda (DEM-0001, DEM-0002...), considerando as já persistidas. */
export async function nextDemandCode(): Promise<string> {
  try {
    const records = await pb.collection('demands').getFullList<{ code?: string }>({
      filter: "code ~ 'DEM-'",
      sort: '-code',
      fields: 'code',
    })
    let max = 0
    for (const r of records) {
      const m = /^DEM-(\d+)$/.exec(r.code || '')
      if (m) {
        const n = parseInt(m[1], 10)
        if (n > max) max = n
      }
    }
    return formatDemandCode(max + 1)
  } catch {
    // Fallback: usa timestamp para não colidir
    return formatDemandCode(Date.now() % 10000)
  }
}

function formatDemandCode(n: number): string {
  return `${DEMAND_CODE_PREFIX}-${String(n).padStart(DEMAND_CODE_PAD, '0')}`
}

const PT_LABELS: Record<DemandStatus, string> = {
  recebida: 'Recebida',
  agrupada: 'Agrupada',
  publicada: 'Desafio publicado',
  proposta_recebida: 'Proposta recebida',
  piloto_aprovado: 'Piloto aprovado',
  encerrada: 'Encerrada',
}

export function demandStatusLabel(status: DemandStatus): string {
  return PT_LABELS[status] || status
}

// ---------- Tipos de evento ----------
export const DEMAND_EVENT_TYPES: { type: DemandEventType; actor: DemandEventActor }[] = [
  { type: 'demand_enviada', actor: 'lojista' },
  { type: 'demand_recebida', actor: 'associacao' },
  { type: 'demand_agrupada', actor: 'associacao' },
  { type: 'desafio_publicado', actor: 'associacao' },
  { type: 'proposta_enviada', actor: 'startup' },
  { type: 'proposta_aprovada', actor: 'associacao' },
  { type: 'piloto_iniciado', actor: 'sistema' },
  { type: 'piloto_aprovado', actor: 'associacao' },
  { type: 'piloto_concluido', actor: 'sistema' },
]

const EVENT_TITLES: Record<DemandEventType, string> = {
  demand_enviada: 'Demanda enviada',
  demand_recebida: 'Recebida e revisada',
  demand_agrupada: 'Agrupada com outras demandas',
  desafio_publicado: 'Desafio coletivo publicado',
  proposta_enviada: 'Proposta enviada pela startup',
  proposta_aprovada: 'Proposta aprovada',
  piloto_iniciado: 'Piloto iniciado',
  piloto_aprovado: 'Piloto aprovado',
  piloto_concluido: 'Piloto concluído',
}

export function demandEventTitle(type: DemandEventType): string {
  return EVENT_TITLES[type] || type
}

// ---------- Eventos ----------
export interface DemandEventInput {
  demand: string
  event_type: DemandEventType
  actor: DemandEventActor
  actor_label?: string
  title?: string
  description?: string
  status_after?: DemandStatus
}

const ACTOR_FALLBACK_LABELS: Record<DemandEventActor, string> = {
  lojista: 'Lojista',
  associacao: 'Associação Comercial',
  startup: 'Startup',
  sistema: 'Sistema',
}

/** Grava (persiste) um evento no histórico da demanda. Nunca quebra o fluxo do chamador. */
export async function recordDemandEvent(input: DemandEventInput): Promise<void> {
  try {
    await pb.collection('demand_events').create({
      demand: input.demand,
      event_type: input.event_type,
      actor: input.actor,
      actor_label: input.actor_label || ACTOR_FALLBACK_LABELS[input.actor],
      title: input.title || demandEventTitle(input.event_type),
      description: input.description || EVENT_TITLES[input.event_type],
      status_after: input.status_after,
    })
  } catch (err) {
    console.error('Erro ao gravar evento de demanda:', err)
  }
}

/** Lista os eventos de uma demanda (linha do tempo completa, do mais antigo ao mais novo). */
export async function listDemandEvents(demandId: string): Promise<DemandEventRecord[]> {
  if (!demandId) return []
  try {
    return await pb.collection('demand_events').getFullList<DemandEventRecord>({
      filter: `demand = "${demandId}"`,
      sort: 'created',
    })
  } catch (err) {
    console.error('Erro ao listar eventos da demanda:', err)
    return []
  }
}

/** Busca os eventos de várias demandas de uma vez, agrupados por id de demanda. */
export async function listDemandEventsGrouped(
  demandIds: string[],
): Promise<Record<string, DemandEventRecord[]>> {
  const grouped: Record<string, DemandEventRecord[]> = {}
  if (demandIds.length === 0) return grouped

  try {
    const records = await pb.collection('demand_events').getFullList<DemandEventRecord>({
      filter:
        `demand = "${demandIds[0]}"` +
        (demandIds.length > 1
          ? ` || demand = "${demandIds.slice(1).join('" || demand = "')}"`
          : ''),
      sort: 'created',
    })
    for (const rec of records) {
      const key = typeof rec.demand === 'string' ? rec.demand : (rec.demand as any)?.id
      if (!key) continue
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(rec)
    }
  } catch (err) {
    console.error('Erro ao listar eventos agrupados:', err)
  }
  return grouped
}

// ---------- Demandas: criar/encaminhar com código + evento ----------
export async function createDemandWithHistory(data: Partial<DemandRecord>): Promise<DemandRecord> {
  const code = await nextDemandCode()
  const created = await pb.collection('demands').create<DemandRecord>({
    ...data,
    code,
    status: 'recebida',
    is_demo: true,
  })
  if (created.id) {
    await recordDemandEvent({
      demand: created.id,
      event_type: 'demand_enviada',
      actor: 'lojista',
      description: `O lojista enviou a solicitação ${code} para a Associação Comercial.`,
      status_after: 'recebida',
    })
  }
  return created
}

export async function updateDemandWithHistory(
  id: string,
  data: Partial<DemandRecord>,
  event: Omit<DemandEventInput, 'demand'>,
): Promise<DemandRecord> {
  const updated = await pb.collection('demands').update<DemandRecord>(id, data)
  await recordDemandEvent({ ...event, demand: id })
  return updated
}

// ---------- Proposta da startup: propaga o evento para as demandas do desafio ----------
/**
 * Quando a startup envia uma proposta para um desafio coletivo, registra o
 * evento "proposta_enviada" em cada demanda agrupada naquele desafio
 * (o vínculo é demands.group_key = challenge.id) e avança o status delas.
 */
export async function recordProposalEventsForChallenge(
  challengeId: string,
  startupName = 'Startup',
): Promise<void> {
  try {
    const linked = await pb.collection('demands').getFullList<DemandRecord>({
      filter: `group_key = "${challengeId}"`,
    })
    for (const d of linked) {
      if (!d.id) continue
      await pb.collection('demands').update<DemandRecord>(d.id, { status: 'proposta_recebida' })
      await recordDemandEvent({
        demand: d.id,
        event_type: 'proposta_enviada',
        actor: 'startup',
        description: `A startup ${startupName} enviou uma proposta com os 5 campos técnicos para o desafio coletivo.`,
        status_after: 'proposta_recebida',
      })
    }
  } catch (err) {
    console.error('Erro ao registrar evento de proposta para as demandas:', err)
  }
}
