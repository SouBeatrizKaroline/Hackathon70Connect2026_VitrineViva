// Migration 0004 — Backfill do histórico de demandas
// 1) Popula o campo "code" (DEM-0001, DEM-0002, ...) em toda demanda existente
//    que ainda não o tenha, em ordem de criação.
// 2) Cria o evento inicial "demand_enviada" para cada demanda que não tenha
//    nenhum evento, para que o histórico exista desde o primeiro acesso.
const ACTOR_LABELS = {
  lojista: 'Lojista',
  associacao: 'Associação Comercial',
  startup: 'Startup',
  sistema: 'Sistema',
}

migrate(
  (app) => {
    // --- 1. Backfill do campo "code" ---
    const demands = app.findCollectionByNameOrId('demands')
    const existing = app.findRecordsByFilter('demands', "code != ''", '-created', -1, 0)
    let maxSeq = 0
    for (const d of existing) {
      const m = /^DEM-(\d+)$/.exec(d.code)
      if (m) {
        const n = parseInt(m[1], 10)
        if (n > maxSeq) maxSeq = n
      }
    }

    const missing = app.findRecordsByFilter(
      'demands',
      "code = '' || code = null",
      '-created',
      -1,
      0,
    )
    for (const d of missing) {
      maxSeq += 1
      d.set('code', 'DEM-' + String(maxSeq).padStart(4, '0'))
      app.save(d)
    }

    // --- 2. Backfill do evento inicial ---
    const events = app.findCollectionByNameOrId('demand_events')
    const allDemands = app.findRecordsByFilter('demands', '', '-created', -1, 0)
    for (const d of allDemands) {
      const already = app.findRecordsByFilter(
        'demand_events',
        "demand = '" + d.id + "'",
        '-created',
        1,
        0,
      )
      if (already > 0) continue
      const ev = new Record(events)
      ev.set('demand', d.id)
      ev.set('event_type', 'demand_enviada')
      ev.set('actor', 'lojista')
      ev.set('actor_label', ACTOR_LABELS.lojista)
      ev.set('title', 'Demanda enviada')
      ev.set(
        'description',
        'O lojista enviou a solicitação ' + (d.code || '') + ' para a Associação Comercial.',
      )
      ev.set('status_after', d.status)
      app.save(ev)
    }
  },
  (app) => {
    // Down: não faz nada — os códigos e eventos são dados, não estrutura.
  },
)
