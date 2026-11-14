import type { Demanda } from './types'

/** Demanda indicada na URL ou, na falta dela, a mais recente ainda ativa. */
export function demandaAtual(demandas: Demanda[], id?: string | null): Demanda | undefined {
  if (id) return demandas.find((d) => d.id === id)
  return demandas.find((d) => d.status !== 'cancelada' && d.status !== 'concluida') ?? demandas[0]
}
