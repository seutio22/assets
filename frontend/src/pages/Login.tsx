import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import AtlasLogo from '../components/AtlasLogo'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        // Registrar novo tenant
        const response = await api.post('/auth/register', {
          tenantName,
          email,
          password,
          name
        })
        const { token, user } = response.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        navigate('/dashboard')
      } else {
        await login(email, password)
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-background"></div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <div className="login-logo-container">
            <AtlasLogo size={60} variant="full" />
          </div>
          <h2 className="login-title">Entrar</h2>
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            
            {isRegister && (
              <div className="form-group">
                <label htmlFor="tenantName" className="label">Nome da Empresa</label>
                <input
                  id="tenantName"
                  type="text"
                  className="input"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  required={isRegister}
                  placeholder="Minha Empresa"
                />
              </div>
            )}

            {isRegister && (
              <div className="form-group">
                <label htmlFor="name" className="label">Seu Nome</label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegister}
                  placeholder="João Silva"
                />
              </div>
            )}

            <div className="form-group">
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="E-mail"
                />
                <button type="button" className="input-action-btn">
                  <span>⋯</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Senha"
                />
                <button 
                  type="button" 
                  className="input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Lembrar-me</span>
              </label>
              <a href="#" className="forgot-password">Esqueceu a senha?</a>
            </div>

            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? (isRegister ? 'Registrando...' : 'Entrando...') : 'ENTRAR'}
            </button>

            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="btn-register"
            >
              {isRegister ? 'Já tenho uma conta' : 'Criar nova conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

