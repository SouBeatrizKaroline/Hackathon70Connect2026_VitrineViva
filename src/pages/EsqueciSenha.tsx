import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function EsqueciSenhaPage() {
  return (
    <div className="max-w-md mx-auto space-y-6 py-12 text-center animate-fade-in">
      <Card className="p-8 bg-white border border-stone-200 rounded-xl space-y-4">
        <h1 className="font-serif-title text-2xl text-stone-900">Recuperação de Senha</h1>
        <p className="text-xs text-stone-600">
          Para esta versão de demonstração do Hackathon, as contas de demonstração não exigem
          recuperação de senha. Você pode acessar qualquer perfil em 1 clique na página de login ou
          no topo do site.
        </p>
        <Button asChild className="bg-[#125435] text-white">
          <Link to="/entrar">Ir para o login rápido</Link>
        </Button>
      </Card>
    </div>
  )
}
