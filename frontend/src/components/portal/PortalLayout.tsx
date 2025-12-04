// PortalLayout - Versão limpa sem debug
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { usePortalAuth } from '../../contexts/PortalAuthContext'
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Building2,
  LogOut,
  User
} from 'lucide-react'
import AtlasLogo from '../AtlasLogo'
import './PortalLayout.css'

const PortalLayout = () => {
  const { usuario, logout, isAuthenticated, loading } = usePortalAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Redirecionamentos baseados no estado de autenticação
  useEffect(() => {
    // Não fazer nada enquanto estiver carregando
    if (loading) return
    
    // Se não estiver autenticado e não estiver na página de login, redirecionar
    if (!isAuthenticated) {
      if (location.pathname !== '/portal/login') {
        navigate('/portal/login', { replace: true })
      }
      return
    }
    
    // Se estiver autenticado e estiver na página de login, redirecionar para dashboard
    if (isAuthenticated && location.pathname === '/portal/login') {
      navigate('/portal/dashboard', { replace: true })
    }
  }, [isAuthenticated, loading, location.pathname, navigate])
  
  // Se estiver carregando, mostrar loading
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Carregando...
      </div>
    )
  }
  
  // Se não estiver autenticado, mostrar apenas o login (sem sidebar)
  if (!isAuthenticated) {
    return <Outlet />
  }

  const menuItems = [
    { path: '/portal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/portal/apolices', icon: FileText, label: 'Apólices' },
    { path: '/portal/sub-estipulantes', icon: Building2, label: 'Sub-Estipulantes' },
    { path: '/portal/atendimento', icon: MessageSquare, label: 'Atendimento' }
  ]

  const handleLogout = () => {
    logout()
    navigate('/portal/login')
  }

  return (
    <div className="portal-layout">
      <aside className="portal-sidebar">
        <div className="portal-sidebar-header">
          <AtlasLogo size={48} variant="full" />
          <h2>Portal RH</h2>
        </div>
        <nav className="portal-sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path !== '/portal/dashboard' && location.pathname.startsWith(item.path))
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`portal-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="portal-sidebar-footer">
          <div className="portal-user-info">
            <div className="portal-user-avatar">
              <User size={20} />
            </div>
            <div className="portal-user-details">
              <div className="portal-user-name">{usuario?.nome}</div>
              <div className="portal-user-email">{usuario?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="portal-logout-btn">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
      <main className="portal-main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default PortalLayout

