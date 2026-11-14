import { useEffect, useState } from 'react'
import { History, Store, Building2, Rocket, Cpu, CheckCircle2, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

interface DemandHistoryTimelineProps {
  demand: DemandRecord
  /** Recarrega os eventos quando este valor muda (ex.: contador de atualização). */
  refreshKey?: number
}

/**
 * Linha do tempo do histórico de uma demanda (DEM-XXXX), lida do PocketBase.
 * Botão que abre um dialog com a linha do tempo vertical.
 */
export function DemandHistoryTimeline({ demand, refreshKey }: DemandHistoryTimelineProps) {
  const [events, setEvents] = useState<DemandEventRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || !demand.id) return
    let cancelled = false
    setLoading(true)
    listDemandEvents(demand.id)
      .then((evs) => {
        if (!cancelled) setEvents(evs)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, demand.id, refreshKey])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs bg-white">
          <History className="w-3.5 h-3.5 mr-1" />
          Histórico
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif-title text-xl text-[#125435] flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico da demanda{' '}
            <Badge variant="outline" className="font-mono text-xs border-stone-300">
              {demand.code || 'SEM CÓDIGO'}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-600">{demand.problem}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-stone-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando histórico...
          </div>
        ) : events.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500">
            Nenhum evento registrado para esta demanda ainda.
          </div>
        ) : (
          <ol className="relative border-l-2 border-stone-200 ml-3 space-y-5 py-1">
            {events.map((ev, idx) => {
              const meta = ACTOR_META[ev.actor] || ACTOR_META.sistema
              const Icon = meta.icon
              const isLast = idx === events.length - 1
              return (
                <li key={ev.id} className="ml-6 relative">
                  {/* Marcador circular */}
                  <span
                    className={`absolute -left-[31px] top-0 flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white ${
                      isLast ? 'border-[#125435]' : 'border-stone-300'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isLast ? 'text-[#125435]' : 'text-stone-400'}`} />
                  </span>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span
                      className={`font-semibold text-sm ${
                        isLast ? 'text-[#125435]' : 'text-stone-900'
                      }`}
                    >
                      {ev.title || demandEventTitle(ev.event_type)}
                    </span>
                    {ev.status_after && (
                      <Badge
                        variant="outline"
                        className="text-[10px] w-fit capitalize bg-stone-50 border-stone-300"
                      >
                        Status: {demandStatusLabel(ev.status_after)}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 mt-0.5">{ev.description}</p>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                    <span className={`inline-flex items-center gap-1 font-medium ${meta.color}`}>
                      <Icon className="w-3 h-3" />
                      {ev.actor_label || meta.label}
                    </span>
                    {ev.created && (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          {new Date(ev.created).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 pt-1 border-t border-stone-100">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Histórico persistido no PocketBase — visível para lojista, associação e startup.
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DemandHistoryTimeline
