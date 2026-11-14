import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, UserCheck, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types/vitrine'

export default function EntrarPage() {
  const navigate = useNavigate()
  const { switchDemoRole, loginWithPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDemoQuick = async (role: UserRole) => {
    await switchDemoRole(role)
    if (role === 'lojista') navigate('/diagnostico')
    else if (role === 'associacao') navigate('/associacao')
    else if (role === 'startup') navigate('/startup')
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const ok = await loginWithPassword(email, password)
    setLoading(false)
    if (ok) navigate('/')
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-8 animate-fade-in">
      <div className="text-center space-y-1">
        <h1 className="font-serif-title text-3xl text-stone-900 font-normal">
          Acesso à Vitrine Viva
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Navegue com perfis de demonstração pré-configurados em 1 clique ou entre com sua conta.
        </p>
      </div>

      {/* Entradas Rápidas de Demonstração (Sem Cadastro) */}
      <Card className="bg-[#FAF7F0] border-2 border-[#125435] p-5 rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#125435]">
          <UserCheck className="w-4 h-4 text-amber-600" />
          Acesso rápido para avaliação da banca (sem senha)
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => handleDemoQuick('lojista')}
            className="w-full bg-[#125435] text-white hover:bg-emerald-900 justify-between text-xs"
          >
            <span>Entrar como Lojista (Marina Ribeiro)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleDemoQuick('associacao')}
            className="w-full border-blue-700 text-blue-900 hover:bg-blue-50 justify-between text-xs bg-white"
          >
            <span>Entrar como Associação Comercial (AC Marília / FACESP)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleDemoQuick('startup')}
            className="w-full border-amber-700 text-amber-950 hover:bg-amber-50 justify-between text-xs bg-white"
          >
            <span>Entrar como Startup (ConectaVarejo Labs)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>

      {/* Formulário Tradicional de Login */}
      <Card className="bg-white border border-stone-200 p-6 rounded-xl space-y-4">
        <form onSubmit={handlePasswordLogin} className="space-y-3 text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="font-semibold text-stone-700">E-mail:</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com.br"
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-stone-700">Senha:</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="text-xs"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white hover:bg-stone-800 text-xs"
          >
            {loading ? 'Entrando...' : 'Entrar com e-mail'}
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
          <Link to="/criar-conta" className="hover:underline">
            Criar conta gratuita
          </Link>
          <Link to="/esqueci-senha" className="hover:underline">
            Esqueci a senha
          </Link>
        </div>
      </Card>
    </div>
  )
}
