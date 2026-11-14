import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export default function CriarContaPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await pb.collection('users').create({
        name,
        email,
        password,
        passwordConfirm: password,
        role: 'lojista',
      })
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Faça login com seu e-mail e senha.',
      })
      navigate('/entrar')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: err?.message || 'Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-8 animate-fade-in">
      <div className="text-center space-y-1">
        <h1 className="font-serif-title text-3xl text-stone-900 font-normal">
          Criar conta na Vitrine Viva
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Você também pode testar 100% da plataforma sem cadastro na página inicial.
        </p>
      </div>

      <Card className="bg-white border border-stone-200 p-6 rounded-xl space-y-4">
        <form onSubmit={handleSignup} className="space-y-3 text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="font-semibold text-stone-700">Seu nome ou nome da loja:</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Loja da Ana"
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-stone-700">E-mail:</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@exemplo.com.br"
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
              placeholder="Mínimo 8 caracteres"
              className="text-xs"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#125435] text-white hover:bg-emerald-900 text-xs"
          >
            {loading ? 'Criando conta...' : 'Cadastrar e começar'}
          </Button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Já tem conta?{' '}
          <Link to="/entrar" className="text-[#125435] font-semibold hover:underline">
            Fazer login
          </Link>
        </div>
      </Card>
    </div>
  )
}
