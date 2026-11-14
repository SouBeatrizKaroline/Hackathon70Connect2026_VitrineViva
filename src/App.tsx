import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import DiagnosticoPage from '@/pages/Diagnostico'
import RecomendacoesPage from '@/pages/Recomendacoes'
import SolucaoDetalhePage from '@/pages/SolucaoDetalhe'
import TesteInterativoPage from '@/pages/TesteInterativo'
import PilotoPage from '@/pages/Piloto'
import MinhasSolicitacoesPage from '@/pages/MinhasSolicitacoes'
import AssociacaoPage from '@/pages/Associacao'
import AssociacaoConfiguracaoPage from '@/pages/AssociacaoConfiguracao'
import StartupPage from '@/pages/Startup'
import DesafioDetalhePage from '@/pages/DesafioDetalhe'
import EntrarPage from '@/pages/Entrar'
import CriarContaPage from '@/pages/CriarConta'
import EsqueciSenhaPage from '@/pages/EsqueciSenha'
import RelatarPage from '@/pages/Relatar'
import EntendimentoPage from '@/pages/Entendimento'
import CaminhosPage from '@/pages/Caminhos'
import CompararPage from '@/pages/Comparar'
import AcompanharPage from '@/pages/Acompanhar'
import RadarPage from '@/pages/Radar'
import NotFound from '@/pages/NotFound'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/AuthContext'
import { TourProvider } from '@/context/TourContext'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TourProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="relatar" element={<RelatarPage />} />
              <Route path="entendimento" element={<EntendimentoPage />} />
              <Route path="caminhos" element={<CaminhosPage />} />
              <Route path="comparar" element={<CompararPage />} />
              <Route path="acompanhar" element={<AcompanharPage />} />
              <Route path="radar" element={<RadarPage />} />
              <Route path="diagnostico" element={<DiagnosticoPage />} />
              <Route path="recomendacoes" element={<RecomendacoesPage />} />
              <Route path="solucao/:id" element={<SolucaoDetalhePage />} />
              <Route path="teste/:id" element={<TesteInterativoPage />} />
              <Route path="piloto" element={<PilotoPage />} />
              <Route path="minhas-solicitacoes" element={<MinhasSolicitacoesPage />} />
              <Route path="associacao" element={<AssociacaoPage />} />
              <Route path="associacao/configuracao" element={<AssociacaoConfiguracaoPage />} />
              <Route path="startup" element={<StartupPage />} />
              <Route path="desafio/:id" element={<DesafioDetalhePage />} />
              <Route path="entrar" element={<EntrarPage />} />
              <Route path="criar-conta" element={<CriarContaPage />} />
              <Route path="esqueci-senha" element={<EsqueciSenhaPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Toaster />
        </TourProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
