import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  UserCog, 
  Database,
  LogOut,
  Ticket,
  Rocket,
  ChevronDown,
  ChevronRight,
  FileSearch,
  ClipboardList,
  ListTodo,
  CheckCircle,
  User,
  Shield,
  Table2
} from 'lucide-react'
import AtlasLogo from './AtlasLogo'
import './Layout.css'

interface MenuItem {
  path?: string
  icon: any
  label: string
  roles?: string[]
  subItems?: MenuItem[]
}

const Layout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['solicitacoes', 'placement', 'implantacao'])

  const menuItems: MenuItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/clientes', icon: Building2, label: 'Clientes' },
    { path: '/fornecedores', icon: Building2, label: 'Parceiros' },
    { path: '/apolices', icon: FileText, label: 'Apólices' },
    { 
      icon: Ticket, 
      label: 'Solicitações',
      subItems: [
        { path: '/solicitacoes', icon: ListTodo, label: 'Todas' },
        { path: '/solicitacoes/minhas', icon: User, label: 'Minhas Solicitações' },
        { path: '/solicitacoes/placement', icon: FileSearch, label: 'Placement' },
        { path: '/solicitacoes/implantacao', icon: Rocket, label: 'Implantação' }
      ]
    },
    { 
      icon: FileSearch, 
      label: 'Placement',
      subItems: [
        { path: '/placements/gestao', icon: ClipboardList, label: 'Gestão' },
        { path: '/placements/fila', icon: ListTodo, label: 'Fila de Processos' },
        { path: '/placements/demandas', icon: CheckCircle, label: 'Demandas' }
      ]
    },
    { 
      icon: Rocket, 
      label: 'Implantação',
      subItems: [
        { path: '/chamados', icon: Ticket, label: 'Chamados' },
        { path: '/implantacoes', icon: Rocket, label: 'Implantações' }
      ]
    },
    { 
      icon: UserCog, 
      label: 'Usuários',
      roles: ['ADMIN'],
      subItems: [
        { path: '/usuarios', icon: UserCog, label: 'Usuários Internos' },
        { path: '/usuarios-portal', icon: Users, label: 'Usuários Portal RH' },
        { path: '/perfis-acesso', icon: Shield, label: 'Perfis de Acesso' },
        { path: '/matriz-permissoes', icon: Table2, label: 'Matriz de Permissões' }
      ]
    },
    { path: '/dados', icon: Database, label: 'Dados', roles: ['ADMIN'] }
  ]

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user?.role || '')
  })

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(m => m !== label)
        : [...prev, label]
    )
  }

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.path) {
      return location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    }
    if (item.subItems) {
      return item.subItems.some(subItem => isMenuActive(subItem))
    }
    return false
  }

  const renderMenuItem = (item: MenuItem, index: number) => {
    const Icon = item.icon
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isExpanded = expandedMenus.includes(item.label)
    const isActive = isMenuActive(item)

    if (hasSubItems) {
      return (
        <div key={`${item.label}-${index}`} className="nav-group">
          <button
            className={`nav-item nav-group-header ${isExpanded ? 'expanded' : ''}`}
            onClick={() => toggleMenu(item.label)}
          >
            <Icon size={20} />
            <span>{item.label}</span>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isExpanded && (
            <div className="nav-submenu">
              {item.subItems!.map((subItem, subIndex) => {
                const SubIcon = subItem.icon
                const isSubActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/')
                return (
                  <Link
                    key={`${subItem.path}-${subIndex}`}
                    to={subItem.path!}
                    className={`nav-item nav-subitem ${isSubActive ? 'active' : ''}`}
                  >
                    <SubIcon size={18} />
                    <span>{subItem.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.path}
        to={item.path!}
        className={`nav-item ${isActive ? 'active' : ''}`}
      >
        <Icon size={20} />
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <AtlasLogo size={48} variant="full" />
        </div>
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item, index) => renderMenuItem(item, index))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

