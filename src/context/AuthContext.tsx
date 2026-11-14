import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserRole } from '@/types/vitrine'
import { toast } from '@/hooks/use-toast'

interface DemoUser {
  id?: string
  email: string
  name: string
  role: UserRole
}

// Apenas perfis de demonstração limitados. A conta de administrador não fica no código.
type DemoRole = Exclude<UserRole, 'admin'>

const DEMO_ACCOUNTS: Record<DemoRole, DemoUser> = {
  lojista: {
    email: 'lojista.demo@vitrineviva.com.br',
    name: 'Marina Ribeiro (Lojista demo)',
    role: 'lojista',
  },
  associacao: {
    email: 'associacao.demo@vitrineviva.com.br',
    name: 'AC Marília / Inovação FACESP (Associação demo)',
    role: 'associacao',
  },
  startup: {
    email: 'startup.demo@vitrineviva.com.br',
    name: 'ConectaVarejo Labs (Startup demo)',
    role: 'startup',
  },
}

interface AuthContextType {
  role: UserRole
  userName: string
  userEmail: string
  isAuthenticated: boolean
  switchDemoRole: (role: UserRole, notify?: boolean) => Promise<void>
  loginWithPassword: (email: string, pass: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  role: 'lojista',
  userName: 'Marina Ribeiro (Lojista demo)',
  userEmail: 'lojista.demo@vitrineviva.com.br',
  isAuthenticated: true,
  switchDemoRole: async () => {},
  loginWithPassword: async () => false,
  logout: () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('lojista')
  const [userName, setUserName] = useState<string>('Marina Ribeiro (Lojista demo)')
  const [userEmail, setUserEmail] = useState<string>('lojista.demo@vitrineviva.com.br')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record
      const storedRole = (rec.role as UserRole) || 'lojista'
      setRole(storedRole)
      setUserName(rec.name || rec.email)
      setUserEmail(rec.email)
      setIsAuthenticated(true)
    } else {
      switchDemoRole('lojista', false)
    }
  }, [])

  const switchDemoRole = async (targetRole: UserRole, notify = true) => {
    if (targetRole === 'admin') return
    const account = DEMO_ACCOUNTS[targetRole]
    try {
      const authData = await pb.collection('users').authWithPassword(account.email, 'Skip@Pass')
      setRole(targetRole)
      setUserName(authData.record.name || account.name)
      setUserEmail(authData.record.email)
      setIsAuthenticated(true)
      if (notify) {
        toast({
          title: `Perfil alterado: ${account.name}`,
          description:
            'Navegação em modo de demonstração. O progresso do diagnóstico foi preservado.',
        })
      }
    } catch {
      setRole(targetRole)
      setUserName(account.name)
      setUserEmail(account.email)
      setIsAuthenticated(true)
      if (notify) {
        toast({
          title: `Perfil ativo: ${account.name}`,
          description: 'Modo demonstração rápido ativado.',
        })
      }
    }
  }

  const loginWithPassword = async (email: string, pass: string): Promise<boolean> => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, pass)
      const r = (authData.record.role as UserRole) || 'lojista'
      setRole(r)
      setUserName(authData.record.name || authData.record.email)
      setUserEmail(authData.record.email)
      setIsAuthenticated(true)
      toast({
        title: 'Bem-vindo(a)!',
        description: `Sessão iniciada como ${authData.record.name || authData.record.email}`,
      })
      return true
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Falha no login',
        description: err?.message || 'E-mail ou senha incorretos.',
      })
      return false
    }
  }

  const logout = () => {
    pb.authStore.clear()
    switchDemoRole('lojista', false)
  }

  return (
    <AuthContext.Provider
      value={{
        role,
        userName,
        userEmail,
        isAuthenticated,
        switchDemoRole,
        loginWithPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
