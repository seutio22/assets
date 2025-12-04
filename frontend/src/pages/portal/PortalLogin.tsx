import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth } from '../../contexts/PortalAuthContext'
import AtlasLogo from '../../components/AtlasLogo'
import './PortalLogin.css'

const PortalLogin = () => {
  const navigate = useNavigate()
  const portalAuth = usePortalAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Remover redirecionamento automático - será feito pelo PortalLayout

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!portalAuth) {
        throw new Error('Sistema de autenticação não disponível')
      }
      await portalAuth.login(email, senha)
      // O redirecionamento será feito automaticamente pelo PortalLayout
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-login">
      <div className="portal-login-container">
        <div className="portal-login-header">
          <AtlasLogo size={64} variant="full" />
          <h1>Portal RH</h1>
          <p>Entre com suas credenciais para acessar o portal</p>
        </div>

        <form onSubmit={handleSubmit} className="portal-login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="portal-login-footer">
          <p>Problemas para acessar? Entre em contato com o suporte.</p>
        </div>
      </div>
    </div>
  )
}

export default PortalLogin

