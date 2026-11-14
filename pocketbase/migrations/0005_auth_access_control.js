// Migration 0005 — Autenticação e controle de acesso (perfis + regras de API)
// 1) Campos de perfil em users (loja, associação, startup, status de acesso, demo).
// 2) Campos de posse: demands.store/association, challenges.association,
//    proposals.startup/association — base das regras de isolamento por conta.
// 3) Regras de API (API rules) em TODAS as coleções: registros demo (is_demo=true)
//    continuam públicos para a banca, registros reais ficam restritos ao dono.
// 4) Garante as contas de demonstração (senha Skip@Pass, demo=true).
// Idempotente e no-op em banco vazio.

const SEGMENTS = ['Vestuario', 'Alimentacao', 'Automecanica', 'Servicos', 'Farmacia', 'Outro']
const CHANNELS = ['whatsapp', 'instagram', 'loja_fisica', 'site', 'telefone']

const DEMO_USERS = [
  {
    email: 'lojista.demo@vitrineviva.com.br',
    name: 'Marina Ribeiro (Lojista demo)',
    role: 'lojista',
    extra: {
      store_name: 'Boutique Marina',
      municipality: 'Marília',
      segment: 'Vestuario',
      channel: 'whatsapp',
    },
  },
  {
    email: 'associacao.demo@vitrineviva.com.br',
    name: 'AC Marília / Inovação FACESP (Associação demo)',
    role: 'associacao',
    extra: { association_name: 'AC Marília / Rede FACESP', municipality: 'Marília' },
  },
  {
    email: 'startup.demo@vitrineviva.com.br',
    name: 'ConectaVarejo Labs (Startup demo)',
    role: 'startup',
    extra: {
      startup_name: 'ConectaVarejo Labs',
      startup_description: 'PDV com cupom não fiscal e sincronização de pedidos do WhatsApp.',
      municipality: 'Marília',
    },
  },
]

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // --- 1. Campos de perfil em users ---
    const addUserField = (f) => {
      if (!users.fields.getByName(f.name)) users.fields.add(f)
    }
    addUserField(new TextField({ name: 'store_name', max: 120 }))
    addUserField(new TextField({ name: 'municipality', max: 80 }))
    addUserField(new SelectField({ name: 'segment', maxSelect: 1, values: SEGMENTS }))
    addUserField(new SelectField({ name: 'channel', maxSelect: 1, values: CHANNELS }))
    addUserField(new TextField({ name: 'association_name', max: 120 }))
    addUserField(new TextField({ name: 'startup_name', max: 120 }))
    addUserField(new TextField({ name: 'startup_description', max: 500 }))
    addUserField(
      new SelectField({
        name: 'access_status',
        maxSelect: 1,
        values: ['aprovada', 'pendente', 'recusada'],
      }),
    )
    addUserField(new BoolField({ name: 'demo' }))
    app.save(users)

    // --- 2. Campos de posse/escopo ---
    const demands = app.findCollectionByNameOrId('demands')
    if (!demands.fields.getByName('store')) {
      demands.fields.add(new RelationField({ name: 'store', collectionId: users.id, maxSelect: 1 }))
    }
    if (!demands.fields.getByName('association')) {
      demands.fields.add(
        new RelationField({ name: 'association', collectionId: users.id, maxSelect: 1 }),
      )
    }
    app.save(demands)

    const challenges = app.findCollectionByNameOrId('challenges')
    if (!challenges.fields.getByName('association')) {
      challenges.fields.add(
        new RelationField({ name: 'association', collectionId: users.id, maxSelect: 1 }),
      )
    }
    app.save(challenges)

    const proposals = app.findCollectionByNameOrId('proposals')
    if (!proposals.fields.getByName('startup')) {
      proposals.fields.add(
        new RelationField({ name: 'startup', collectionId: users.id, maxSelect: 1 }),
      )
    }
    if (!proposals.fields.getByName('association')) {
      proposals.fields.add(
        new RelationField({ name: 'association', collectionId: users.id, maxSelect: 1 }),
      )
    }
    app.save(proposals)

    // --- 3. Regras de API ---
    // Padrão: "is_demo = true || <dono> = @request.auth.id || admin".
    // A demo (sem cadastro) lê/escreve apenas registros is_demo = true;
    // contas reais só acessam o que pertence à sua loja/entidade/perfil.
    const setRules = (c, rules) => {
      c.listRule = rules.list
      c.viewRule = rules.view
      c.createRule = rules.create
      c.updateRule = rules.update
      c.deleteRule = rules.delete
      app.save(c)
    }

    setRules(users, {
      list: "id = @request.auth.id || @request.auth.role = 'admin' || role = 'associacao'",
      view: "id = @request.auth.id || @request.auth.role = 'admin' || role = 'associacao'",
      create:
        "@request.body.role = 'lojista' || (@request.body.role = 'startup' && @request.body.access_status = 'pendente')",
      update: "id = @request.auth.id || @request.auth.role = 'admin'",
      delete: null,
    })

    setRules(app.findCollectionByNameOrId('solutions'), {
      list: '',
      view: '',
      create: "@request.auth.role = 'admin'",
      update: "@request.auth.role = 'admin'",
      delete: "@request.auth.role = 'admin'",
    })

    const ownerRules = {
      list: "is_demo = true || owner = @request.auth.id || @request.auth.role = 'admin'",
      view: "is_demo = true || owner = @request.auth.id || @request.auth.role = 'admin'",
      create: '@request.body.is_demo = true || @request.body.owner = @request.auth.id',
      update: "is_demo = true || owner = @request.auth.id || @request.auth.role = 'admin'",
      delete: "is_demo = true || @request.auth.role = 'admin'",
    }
    setRules(app.findCollectionByNameOrId('diagnostics'), ownerRules)

    const viaDiagnostic = {
      list: "is_demo = true || diagnostic.owner = @request.auth.id || @request.auth.role = 'admin'",
      view: "is_demo = true || diagnostic.owner = @request.auth.id || @request.auth.role = 'admin'",
      create: '@request.body.is_demo = true || @request.auth.id != ""',
      update:
        "is_demo = true || diagnostic.owner = @request.auth.id || @request.auth.role = 'admin'",
      delete: "is_demo = true || @request.auth.role = 'admin'",
    }
    setRules(app.findCollectionByNameOrId('tests'), viaDiagnostic)
    setRules(app.findCollectionByNameOrId('pilots'), viaDiagnostic)

    setRules(app.findCollectionByNameOrId('demands'), {
      list: "is_demo = true || diagnostic.owner = @request.auth.id || association = @request.auth.id || @request.auth.role = 'admin'",
      view: "is_demo = true || diagnostic.owner = @request.auth.id || association = @request.auth.id || @request.auth.role = 'admin'",
      create: '@request.body.is_demo = true || @request.auth.id != ""',
      update:
        "is_demo = true || diagnostic.owner = @request.auth.id || association = @request.auth.id || @request.auth.role = 'admin'",
      delete: "is_demo = true || @request.auth.role = 'admin'",
    })

    setRules(app.findCollectionByNameOrId('challenges'), {
      list: "is_demo = true || (@request.auth.id != '' && (@request.auth.access_status = 'aprovada' || @request.auth.role = 'associacao' || @request.auth.role = 'admin'))",
      view: "is_demo = true || (@request.auth.id != '' && (@request.auth.access_status = 'aprovada' || @request.auth.role = 'associacao' || @request.auth.role = 'admin'))",
      create:
        "@request.body.is_demo = true || @request.auth.role = 'associacao' || @request.auth.role = 'admin'",
      update: "is_demo = true || association = @request.auth.id || @request.auth.role = 'admin'",
      delete: "is_demo = true || @request.auth.role = 'admin'",
    })

    setRules(app.findCollectionByNameOrId('proposals'), {
      list: "is_demo = true || startup = @request.auth.id || association = @request.auth.id || @request.auth.role = 'admin'",
      view: "is_demo = true || startup = @request.auth.id || association = @request.auth.id || @request.auth.role = 'admin'",
      create:
        "@request.body.is_demo = true || (@request.auth.role = 'startup' && @request.auth.access_status = 'aprovada') || @request.auth.role = 'admin'",
      update:
        "is_demo = true || startup = @request.auth.id || association = @request.auth.id || @request.auth.role = 'admin'",
      delete: "is_demo = true || @request.auth.role = 'admin'",
    })

    setRules(app.findCollectionByNameOrId('demand_events'), {
      list: "demand.is_demo = true || demand.diagnostic.owner = @request.auth.id || demand.association = @request.auth.id || @request.auth.role = 'admin'",
      view: "demand.is_demo = true || demand.diagnostic.owner = @request.auth.id || demand.association = @request.auth.id || @request.auth.role = 'admin'",
      create: 'demand.is_demo = true || @request.auth.id != ""',
      update: 'demand.is_demo = true || @request.auth.id != ""',
      delete: "demand.is_demo = true || @request.auth.role = 'admin'",
    })

    setRules(app.findCollectionByNameOrId('app_configs'), {
      list: '',
      view: '',
      create: "@request.auth.role = 'associacao' || @request.auth.role = 'admin'",
      update: "@request.auth.role = 'associacao' || @request.auth.role = 'admin'",
      delete: "@request.auth.role = 'admin'",
    })

    // --- 4. Contas de demonstração (idempotente) ---
    for (const u of DEMO_USERS) {
      const found = app.findRecordsByFilter('users', "email = '" + u.email + "'", 'created', 1, 0)
      if (found.length > 0) continue
      const rec = new Record(users)
      rec.set('email', u.email)
      rec.set('name', u.name)
      rec.set('role', u.role)
      rec.set('password', 'Skip@Pass')
      rec.set('demo', true)
      rec.set('access_status', 'aprovada')
      for (const k in u.extra) rec.set(k, u.extra[k])
      app.save(rec)
    }
  },
  (app) => {
    // Down: regras anteriores não são restauradas (reversão manual via painel).
  },
)
