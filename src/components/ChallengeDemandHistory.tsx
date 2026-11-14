// Linha do tempo compacta (inline) das demandas agrupadas em um desafio,
// para o perfil Startup. Busca demand_events do PocketBase.
import { useEffect, useState } from 'react'
import { History, Store, Building2, Rocket, Cpu, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import {
  listDemandEvents,
  demandEventTitle,
  demandStatusLabel,
} from '@/services/demandHistoryService'
import type { DemandEventActor, DemandEventRecord, DemandRecord } from '@/types/vitrine'

const ACTOR_META: Record<DemandEventActor, { label: string; icon: typeof Store; color: string }> = {
  lojista: { label: 'Lojista', icon: Store, color: 'text-[#125435]' },
  associacao: { label: 'Associação Comercial', icon: Building2, color: 'text-blue-700' },
  startup: { label: 'Startup', icon: Rocket, color: 'text-amber-700' },
  sistema: { label: 'Sistema', icon: Cpu, color: 'text-stone-600' },
}

interface ChallengeDemandHistoryProps {
  challengeId?: string
  refreshKey?: number
}

export function ChallengeDemandHistory({ challengeId, refreshKey }: ChallengeDemandHistoryProps) {
  const [demands, setDemands] = useState<DemandRecord[]>([])
  const [events, setEvents] = useState<Record<string, DemandEventRecord[]>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!challengeId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const linked = await pb.collection('demands').getFullList<DemandRecord>({
          filter: `group_key = "${challengeId}"`,
          sort: 'created',
        })
        if (cancelled) return
        setDemands(linked)
        const all: Record<string, DemandEventRecord[]> = {}
        for (const d of linked) {
          if (d.id) all[d.id] = await listDemandEvents(d.id)
        }
        if (!cancelled) setEvents(all)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [challengeId, refreshKey])

  if (!challengeId) return null

  return (
    <div className="p-4 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/60 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
        <History className="w-4 h-4 text-[#125435]" />
        Histórico coletivo das demandas deste desafio
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-stone-500 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando histórico...
        </div>
      ) : demands.length === 0 ? (
        <p className="text-xs text-stone-500">
          Nenhuma demanda individual está vinculada a este desafio ainda. O histórico aparece assim
          que a Associação Comercial agrupar demandas nele.
        </p>
      ) : (
        <div className="space-y-4">
          {demands.map((d) => (
            <div key={d.id} className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="font-mono text-[11px] border-[#125435]/40 text-[#125435] bg-emerald-50"
                >
                  {d.code || 'Código pendente'}
                </Badge>
                <span className="text-xs text-stone-600 line-clamp-1">{d.problem}</span>
              </div>
              <ol className="relative border-l-2 border-stone-200 ml-3 space-y-2 py-0.5">
                {(events[d.id || ''] || []).map((ev) => {
                  const meta = ACTOR_META[ev.actor] || ACTOR_META.sistema
                  const Icon = meta.icon
                  return (
                    <li key={ev.id} className="ml-4 relative">
                      <span className="absolute -left-[23px] top-0.5 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-white border border-stone-300">
                        <Icon className="w-2.5 h-2.5 text-stone-500" />
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium text-stone-900">
                          {ev.title || demandEventTitle(ev.event_type)}
                        </span>
                        {ev.status_after && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-white border-stone-300 text-stone-600"
                          >
                            {demandStatusLabel(ev.status_after)}
                          </Badge>
                        )}
                        <span className={`text-[10px] font-medium ${meta.color}`}>
                          {ev.actor_label || meta.label}
                        </span>
                        {ev.created && (
                          <span className="text-[10px] text-stone-400">
                            {new Date(ev.created).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChallengeDemandHistory
