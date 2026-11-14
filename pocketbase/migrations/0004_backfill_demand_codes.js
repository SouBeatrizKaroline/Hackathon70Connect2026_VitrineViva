// Migration 0004 — Backfill e reparo do histórico de demandas
// 0) REPARO: a migração 0003 (já aplicada, imutável) criou a coleção
//    demand_events, mas o PocketBase descartou silenciosamente o array de
//    campos — a coleção existe sem NENHUM campo. Aqui os campos são
//    (re)adicionados de forma idempotente com construtores tipados.
// 1) Garante o campo "code" em demands (idempotente).
// 2) Backfill do código DEM-XXXX em toda demanda existente que não o tenha.
// 3) Cria o evento inicial "demand_enviada" para cada demanda sem eventos.
// Roda em banco vazio (no-op) e é idempotente ao reexecutar.

const EVENT_TYPES = [
  'demand_enviada',
  'demand_recebida',
  'demand_agrupada',
  'desafio_publicado',
  'proposta_enviada',
  'proposta_aprovada',
  'piloto_iniciado',
  'piloto_aprovado',
  'piloto_concluido',
]

const DEMAND_STATUSES = [
  'recebida',
  'agrupada',
  'publicada',
  'proposta_recebida',
  'piloto_aprovado',
  'encerrada',
]

const ACTOR_LABELS = {
  lojista: 'Lojista',
  associacao: 'Associação Comercial',
  startup: 'Startup',
  sistema: 'Sistema',
}

migrate(
  (app) => {
    // --- 0/1. Campo "code" em demands (idempotente) ---
    const demands = app.findCollectionByNameOrId('demands')
    if (!demands.fields.getByName('code')) {
      demands.fields.add(new TextField({ name: 'code', max: 20 }))
      app.save(demands)
    }

    // --- 0/2. Reparo dos campos da coleção demand_events ---
    const events = app.findCollectionByNameOrId('demand_events')
    if (!events.fields.getByName('demand')) {
      events.fields.add(
        new RelationField({
          name: 'demand',
          required: true,
          collectionId: demands.id,
          maxSelect: 1,
          cascadeDelete: true,
        }),
      )
    }
    if (!events.fields.getByName('event_type')) {
      events.fields.add(
        new SelectField({
          name: 'event_type',
          required: true,
          maxSelect: 1,
          values: EVENT_TYPES,
        }),
      )
    }
    if (!events.fields.getByName('actor')) {
      events.fields.add(
        new SelectField({
          name: 'actor',
          required: true,
          maxSelect: 1,
          values: ['lojista', 'associacao', 'startup', 'sistema'],
        }),
      )
    }
    if (!events.fields.getByName('actor_label')) {
      events.fields.add(new TextField({ name: 'actor_label', required: true, max: 80 }))
    }
    if (!events.fields.getByName('title')) {
      events.fields.add(new TextField({ name: 'title', required: true, max: 120 }))
    }
    if (!events.fields.getByName('description')) {
      events.fields.add(new TextField({ name: 'description', required: true, max: 400 }))
    }
    if (!events.fields.getByName('status_after')) {
      events.fields.add(
        new SelectField({
          name: 'status_after',
          required: false,
          maxSelect: 1,
          values: DEMAND_STATUSES,
        }),
      )
    }
    if (!events.fields.getByName('created')) {
      events.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
    }
    if (!events.fields.getByName('updated')) {
      events.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
    }

    // Índices (addIndex é idempotente)
    events.addIndex('idx_demand_events_demand', false, 'demand', '')
    events.addIndex('idx_demand_events_created', false, 'created', '')
    app.save(events)

    // --- 2. Backfill do campo "code" (DEM-0001, DEM-0002, ...) ---
    const existing = app.findRecordsByFilter('demands', "code != ''", '-code', -1, 0)
    let maxSeq = 0
    for (const d of existing) {
      const m = /^DEM-(\d+)$/.exec(d.getString('code'))
      if (m) {
        const n = parseInt(m[1], 10)
        if (n > maxSeq) maxSeq = n
      }
    }

    const missing = app.findRecordsByFilter('demands', "code = ''", 'created', -1, 0)
    for (const d of missing) {
      maxSeq += 1
      d.set('code', 'DEM-' + String(maxSeq).padStart(4, '0'))
      app.save(d)
    }

    // --- 3. Backfill do evento inicial ---
    const allDemands = app.findRecordsByFilter('demands', '', 'created', -1, 0)
    for (const d of allDemands) {
      const already = app.findRecordsByFilter(
        'demand_events',
        "demand = '" + d.id + "'",
        '-created',
        1,
        0,
      )
      if (already.length > 0) continue
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
      if (d.status) {
        ev.set('status_after', d.status)
      }
      app.save(ev)
    }
  },
  (app) => {
    // Down: não faz nada — os códigos e eventos são dados, não estrutura.
  },
)
