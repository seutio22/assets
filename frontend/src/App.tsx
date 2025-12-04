import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PortalAuthProvider } from './contexts/PortalAuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import GrupoEconomicoDetalhes from './pages/GrupoEconomicoDetalhes'
import Fornecedores from './pages/Fornecedores'
import FornecedorDetalhes from './pages/FornecedorDetalhes'
import Apolices from './pages/Apolices'
import ApoliceDetalhes from './pages/ApoliceDetalhes'
import Usuarios from './pages/Usuarios'
import PerfisAcesso from './pages/PerfisAcesso'
import MatrizPermissoes from './pages/MatrizPermissoes'
import Dados from './pages/Dados'
import Chamados from './pages/Chamados'
import Implantacoes from './pages/Implantacoes'
import Solicitacoes from './pages/Solicitacoes'
import SolicitacaoDetalhes from './pages/SolicitacaoDetalhes'
import PlacementGestao from './pages/PlacementGestao'
import PlacementFila from './pages/PlacementFila'
import PlacementDemandas from './pages/PlacementDemandas'
import UsuariosPortal from './pages/UsuariosPortal'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import PortalLogin from './pages/portal/PortalLogin'
import PortalLayout from './components/portal/PortalLayout'
import PortalDashboard from './pages/portal/PortalDashboard'
import PortalApolices from './pages/portal/PortalApolices'
import PortalAtendimento from './pages/portal/PortalAtendimento'
import PortalErrorBoundary from './components/portal/PortalErrorBoundary'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="grupos-economicos/:id" element={<GrupoEconomicoDetalhes />} />
            <Route path="fornecedores" element={<Fornecedores />} />
            <Route path="fornecedores/:id" element={<FornecedorDetalhes />} />
            <Route path="apolices" element={<Apolices />} />
            <Route 
              path="apolices/:id" 
              element={
                <ErrorBoundary>
                  <ApoliceDetalhes />
                </ErrorBoundary>
              } 
            />
            <Route path="chamados" element={<Chamados />} />
            <Route path="chamados/novo" element={<Chamados />} />
            <Route path="chamados/:id" element={<Chamados />} />
            <Route path="chamados/:id/editar" element={<Chamados />} />
            <Route path="solicitacoes" element={<Solicitacoes />} />
            <Route path="solicitacoes/minhas" element={<Solicitacoes />} />
            <Route path="solicitacoes/placement" element={<Solicitacoes />} />
            <Route path="solicitacoes/implantacao" element={<Solicitacoes />} />
            <Route path="solicitacoes/nova" element={<Solicitacoes />} />
            <Route path="solicitacoes/:id" element={<SolicitacaoDetalhes />} />
            <Route path="solicitacoes/:id/editar" element={<Solicitacoes />} />
            <Route path="placements/gestao" element={<PlacementGestao />} />
            <Route path="placements/gestao/:id" element={<PlacementGestao />} />
            <Route path="placements/fila" element={<PlacementFila />} />
            <Route path="placements/demandas" element={<PlacementDemandas />} />
            <Route path="placements/demandas/:id" element={<PlacementDemandas />} />
            <Route path="implantacoes" element={<Implantacoes />} />
            <Route path="implantacoes/:id" element={<Implantacoes />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="usuarios-portal" element={<UsuariosPortal />} />
            <Route path="usuarios-portal/:id" element={<UsuariosPortal />} />
            <Route path="perfis-acesso" element={<PerfisAcesso />} />
            <Route path="matriz-permissoes" element={<MatrizPermissoes />} />
            <Route path="dados" element={<Dados />} />
          </Route>

          {/* Rotas do Portal RH */}
          <Route
            path="/portal"
            element={
              <PortalErrorBoundary>
                <PortalAuthProvider>
                  <PortalLayout />
                </PortalAuthProvider>
              </PortalErrorBoundary>
            }
          >
            <Route path="login" element={<PortalLogin />} />
            <Route path="dashboard" element={<PortalDashboard />} />
            <Route path="apolices" element={<PortalApolices />} />
            <Route path="apolices/:id" element={<PortalApolices />} />
            <Route path="sub-estipulantes" element={<PortalApolices />} />
            <Route path="atendimento" element={<PortalAtendimento />} />
            <Route path="atendimento/novo" element={<PortalAtendimento />} />
            <Route path="atendimento/:id" element={<PortalAtendimento />} />
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

