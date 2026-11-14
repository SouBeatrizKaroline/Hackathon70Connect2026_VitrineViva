import pb from '@/lib/pocketbase/client'
import type {
  SolutionItem,
  DiagnosticRecord,
  TestRecord,
  PilotRecord,
  DemandRecord,
  ChallengeRecord,
  ProposalRecord,
  AppConfigRecord,
} from '@/types/vitrine'

// 1. Solucoes
export async function listSolutions(): Promise<SolutionItem[]> {
  try {
    const records = await pb.collection('solutions').getFullList<SolutionItem>({
      filter: 'is_active = true',
      sort: 'price_monthly',
    })
    return records
  } catch (err) {
    console.error('Erro ao listar solucoes:', err)
    return []
  }
}

export async function getSolutionById(id: string): Promise<SolutionItem | null> {
  try {
    const record = await pb.collection('solutions').getOne<SolutionItem>(id)
    return record
  } catch (err) {
    console.error('Erro ao buscar solucao:', err)
    return null
  }
}

// 2. Diagnosticos
export async function saveDiagnostic(data: Partial<DiagnosticRecord>): Promise<DiagnosticRecord> {
  try {
    if (data.id) {
      return await pb.collection('diagnostics').update<DiagnosticRecord>(data.id, data)
    }
    return await pb.collection('diagnostics').create<DiagnosticRecord>({
      ...data,
      is_demo: true,
      status: data.status || 'rascunho',
    })
  } catch (err) {
    console.error('Erro ao salvar diagnostico:', err)
    throw err
  }
}

export async function getLatestDiagnostic(): Promise<DiagnosticRecord | null> {
  try {
    const records = await pb.collection('diagnostics').getList<DiagnosticRecord>(1, 1, {
      sort: '-created',
    })
    return records.items[0] || null
  } catch {
    return null
  }
}

// 3. Teste interativo (RetomaZap)
export async function saveTest(data: Partial<TestRecord>): Promise<TestRecord> {
  try {
    if (data.id) {
      return await pb.collection('tests').update<TestRecord>(data.id, data)
    }
    return await pb.collection('tests').create<TestRecord>({
      ...data,
      is_demo: true,
    })
  } catch (err) {
    console.error('Erro ao salvar teste:', err)
    throw err
  }
}

export async function getTestByDiagnostic(diagnosticId: string): Promise<TestRecord | null> {
  try {
    const rec = await pb
      .collection('tests')
      .getFirstListItem<TestRecord>(`diagnostic = "${diagnosticId}"`)
    return rec
  } catch {
    return null
  }
}

// 4. Pilotos
export async function savePilot(data: Partial<PilotRecord>): Promise<PilotRecord> {
  try {
    if (data.id) {
      return await pb.collection('pilots').update<PilotRecord>(data.id, data)
    }
    return await pb.collection('pilots').create<PilotRecord>({
      ...data,
      is_simulated: true,
      is_demo: true,
    })
  } catch (err) {
    console.error('Erro ao salvar piloto:', err)
    throw err
  }
}

export async function listPilots(): Promise<PilotRecord[]> {
  try {
    return await pb.collection('pilots').getFullList<PilotRecord>({
      sort: '-created',
    })
  } catch {
    return []
  }
}

// 5. Demandas (Radar)
export async function createDemand(data: Partial<DemandRecord>): Promise<DemandRecord> {
  try {
    return await pb.collection('demands').create<DemandRecord>({
      ...data,
      status: 'recebida',
      is_demo: true,
    })
  } catch (err) {
    console.error('Erro ao criar demanda:', err)
    throw err
  }
}

export async function listDemands(filter?: string): Promise<DemandRecord[]> {
  try {
    return await pb.collection('demands').getFullList<DemandRecord>({
      filter: filter || '',
      sort: '-created',
    })
  } catch {
    return []
  }
}

export async function updateDemand(id: string, data: Partial<DemandRecord>): Promise<DemandRecord> {
  return await pb.collection('demands').update<DemandRecord>(id, data)
}

// 6. Desafios Coletivos
export async function createChallenge(data: Partial<ChallengeRecord>): Promise<ChallengeRecord> {
  return await pb.collection('challenges').create<ChallengeRecord>({
    ...data,
    status: 'aberto',
    is_demo: true,
  })
}

export async function listChallenges(): Promise<ChallengeRecord[]> {
  try {
    return await pb.collection('challenges').getFullList<ChallengeRecord>({
      sort: '-created',
    })
  } catch {
    return []
  }
}

export async function getChallengeById(id: string): Promise<ChallengeRecord | null> {
  try {
    return await pb.collection('challenges').getOne<ChallengeRecord>(id)
  } catch {
    return null
  }
}

export async function updateChallenge(
  id: string,
  data: Partial<ChallengeRecord>,
): Promise<ChallengeRecord> {
  return await pb.collection('challenges').update<ChallengeRecord>(id, data)
}

// 7. Propostas de Startups
export async function createProposal(data: Partial<ProposalRecord>): Promise<ProposalRecord> {
  return await pb.collection('proposals').create<ProposalRecord>({
    ...data,
    status: 'enviada',
    is_demo: true,
  })
}

export async function listProposals(challengeId?: string): Promise<ProposalRecord[]> {
  try {
    const filter = challengeId ? `challenge = "${challengeId}"` : ''
    return await pb.collection('proposals').getFullList<ProposalRecord>({
      filter,
      sort: '-created',
    })
  } catch {
    return []
  }
}

export async function updateProposal(
  id: string,
  data: Partial<ProposalRecord>,
): Promise<ProposalRecord> {
  return await pb.collection('proposals').update<ProposalRecord>(id, data)
}

// 8. Configuracoes da Associacao
export async function getAppConfig(): Promise<AppConfigRecord | null> {
  try {
    return await pb
      .collection('app_configs')
      .getFirstListItem<AppConfigRecord>('key = "main_config"')
  } catch {
    return null
  }
}

export async function updateAppConfig(data: Partial<AppConfigRecord>): Promise<AppConfigRecord> {
  try {
    const current = await getAppConfig()
    if (current?.id) {
      return await pb.collection('app_configs').update<AppConfigRecord>(current.id, data)
    }
    return await pb.collection('app_configs').create<AppConfigRecord>({
      key: 'main_config',
      ...data,
    })
  } catch (err) {
    console.error('Erro ao atualizar app_configs:', err)
    throw err
  }
}

// 9. Reset Geral da Demonstracao
export async function resetDemoState(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await pb.send<{ ok: boolean; message: string }>(
      '/backend/v1/vitrine-viva/reset-demo',
      {
        method: 'POST',
      },
    )
    return res
  } catch (err: any) {
    console.error('Erro ao resetar demo:', err)
    return { ok: false, message: err?.message || 'Falha ao restaurar dados semente.' }
  }
}
