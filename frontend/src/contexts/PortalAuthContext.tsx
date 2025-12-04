// PortalAuthContext - Versão limpa sem debug
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import axios from 'axios'

interface UsuarioCliente {
  id: string
  nome: string
  email: string
  cargo?: string
  telefone?: string
  ativo: boolean
  tenant: {
    id: string
    name: string
  }
  apolices: Array<{
    apolice: {
      id: string
      numero: string
      empresa: {
        razaoSocial: string
        cnpj: string
      }
    }
  }>
  subEstipulantes: Array<{
    subEstipulante: {
      id: string
      codigoEstipulante: string
      razaoSocial: string
    }
  }>
}

interface PortalAuthContextType {
  usuario: UsuarioCliente | null
  token: string | null
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  loading: boolean
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined)

export const usePortalAuth = () => {
  const context = useContext(PortalAuthContext)
  if (!context) {
    throw new Error('usePortalAuth deve ser usado dentro de PortalAuthProvider')
  }
  return context
}

interface PortalAuthProviderProps {
  children: ReactNode
}

export const PortalAuthProvider = ({ children }: PortalAuthProviderProps) => {
  const [usuario, setUsuario] = useState<UsuarioCliente | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const initializedRef = useRef(false)

  const fetchUsuario = async (tokenToUse: string) => {
    try {
      const response = await axios.get('/api/v1/portal/auth/me', {
        headers: {
          Authorization: `Bearer ${tokenToUse}`
        }
      })
      if (response.data) {
        setUsuario(response.data)
        setToken(tokenToUse)
        return true
      } else {
        throw new Error('Resposta inválida')
      }
    } catch (error: any) {
      console.error('Erro ao buscar usuário:', error)
      // Se for erro 401, o token é inválido - limpar tudo
      if (error.response?.status === 401) {
        localStorage.removeItem('portal_token')
        setToken(null)
        setUsuario(null)
      }
      return false
    }
  }

  useEffect(() => {
    // Verificar se há token salvo apenas uma vez na inicialização
    if (initializedRef.current) return
    initializedRef.current = true
    
    const savedToken = localStorage.getItem('portal_token')
    if (savedToken) {
      fetchUsuario(savedToken).finally(() => {
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, senha: string) => {
    try {
      setLoading(true)
      const response = await axios.post('/api/v1/portal/auth/login', {
        email,
        senha
      })

      const { token: newToken, usuario: newUsuario } = response.data

      if (!newToken || !newUsuario) {
        throw new Error('Resposta inválida do servidor')
      }

      // Salvar token primeiro
      localStorage.setItem('portal_token', newToken)
      
      // Atualizar estado de forma síncrona
      setToken(newToken)
      setUsuario(newUsuario)
      
      setLoading(false)
    } catch (error: any) {
      console.error('Erro no login:', error)
      setLoading(false)
      setToken(null)
      setUsuario(null)
      localStorage.removeItem('portal_token')
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao fazer login'
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    localStorage.removeItem('portal_token')
    setToken(null)
    setUsuario(null)
  }

  return (
    <PortalAuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!usuario,
        loading
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  )
}

