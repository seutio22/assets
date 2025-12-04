import { Navigate } from 'react-router-dom'
import { usePortalAuth } from '../../contexts/PortalAuthContext'

interface PortalPrivateRouteProps {
  children: React.ReactNode
}

const PortalPrivateRoute = ({ children }: PortalPrivateRouteProps) => {
  const { isAuthenticated, loading } = usePortalAuth()

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      Carregando...
    </div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />
  }

  return <>{children}</>
}

export default PortalPrivateRoute

