// Migration 0003 — Histórico de demandas
// 1) Adiciona o campo legível "code" (ex.: DEM-0001) na coleção demands.
// 2) Cria a coleção demand_events (coleção de histórico ligada a uma demanda),
//    com tipo de evento, autor pelo perfil demo, descrição e timestamp.

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

migrate(
  (app) => {
    // --- 1. Campo "code" em demands (idempotente) ---
    const demands = app.findCollectionByNameOrId('demands')
    if (!demands.fields.getByName('code')) {
      demands.fields.add(new TextField({ name: 'code', max: 20 }))
      app.save(demands)
    }

    // --- 2. Coleção demand_events ---
    // Já existe (re-execução defensiva)? então nada a fazer.
    try {
      app.findCollectionByNameOrId('demand_events')
      return
    } catch (_) {}

    const eventTypes = new SelectField({
      name: 'event_type',
      required: true,
      maxSelect: 1,
      values: EVENT_TYPES,
    })
    const actor = new SelectField({
      name: 'actor',
      required: true,
      maxSelect: 1,
      values: ['lojista', 'associacao', 'startup', 'sistema'],
    })
    const statusAfter = new SelectField({
      name: 'status_after',
      required: false,
      maxSelect: 1,
      values: DEMAND_STATUSES,
    })
    const demandRel = new RelationField({
      name: 'demand',
      required: true,
      collectionId: demands.id,
      maxSelect: 1,
      cascadeDelete: true,
    })

    const events = new Collection({
      name: 'demand_events',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        demandRel,
        eventTypes,
        actor,
        new TextField({ name: 'actor_label', required: true, max: 80 }),
        new TextField({ name: 'title', required: true, max: 120 }),
        new TextField({ name: 'description', required: true, max: 400 }),
        statusAfter,
        new AutodateField({ name: 'created', onCreate: true, onUpdate: false }),
        new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
      ],
      indexes: ['CREATE INDEX idx_demand_events_created ON demand_events (created)'],
    })
    app.save(events)
  },
  (app) => {
    try {
      const events = app.findCollectionByNameOrId('demand_events')
      app.delete(events)
    } catch (_) {}
    try {
      const demands = app.findCollectionByNameOrId('demands')
      const f = demands.fields.getByName('code')
      if (f) {
        demands.fields.removeByName('code')
        app.save(demands)
      }
    } catch (_) {}
  },
)
