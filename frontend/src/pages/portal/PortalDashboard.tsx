import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth } from '../../contexts/PortalAuthContext'
import { portalApi } from '../../services/portal-api'
import { FileText, MessageSquare, Building2, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import './PortalDashboard.css'

interface Stats {
  totalApolices: number
  totalSubEstipulantes: number
  solicitacoesAbertas: number
  solicitacoesResolvidas: number
  solicitacoesEmAtendimento: number
}

const PortalDashboard = () => {
  const navigate = useNavigate()
  const portalAuth = usePortalAuth()
  
  if (!portalAuth) {
    return <div>Carregando...</div>
  }
  
  const { usuario } = portalAuth
  const [stats, setStats] = useState<Stats>({
    totalApolices: 0,
    totalSubEstipulantes: 0,
    solicitacoesAbertas: 0,
    solicitacoesResolvidas: 0,
    solicitacoesEmAtendimento: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Usar rotas específicas do portal
      const [apolicesRes, subEstipulantesRes, solicitacoesRes] = await Promise.all([
        portalApi.get('/portal/apolices'),
        portalApi.get('/portal/sub-estipulantes'),
        portalApi.get('/portal?limit=100')
      ])

      const solicitacoes = solicitacoesRes.data.data || []

      setStats({
        totalApolices: apolicesRes.data.data?.length || 0,
        totalSubEstipulantes: subEstipulantesRes.data.data?.length || 0,
        solicitacoesAbertas: solicitacoes.filter((s: any) => s.status === 'ABERTA').length,
        solicitacoesResolvidas: solicitacoes.filter((s: any) => s.status === 'RESOLVIDA' || s.status === 'FECHADA').length,
        solicitacoesEmAtendimento: solicitacoes.filter((s: any) => s.status === 'EM_ATENDIMENTO').length
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Bem-vindo, {usuario?.nome}!</h1>
          <p>Gerencie suas apólices e solicitações de atendimento</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card" onClick={() => navigate('/portal/apolices')}>
              <div className="stat-icon" style={{ background: 'rgba(0, 34, 95, 0.1)' }}>
                <FileText size={24} color="#00225f" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalApolices}</div>
                <div className="stat-label">Apólices</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate('/portal/sub-estipulantes')}>
              <div className="stat-icon" style={{ background: 'rgba(61, 155, 142, 0.1)' }}>
                <Building2 size={24} color="#3d9b8e" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalSubEstipulantes}</div>
                <div className="stat-label">Sub-Estipulantes</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate('/portal/atendimento?status=ABERTA')}>
              <div className="stat-icon" style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                <Clock size={24} color="#ffc107" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.solicitacoesAbertas}</div>
                <div className="stat-label">Solicitações Abertas</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate('/portal/atendimento?status=EM_ATENDIMENTO')}>
              <div className="stat-icon" style={{ background: 'rgba(33, 150, 243, 0.1)' }}>
                <AlertCircle size={24} color="#2196f3" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.solicitacoesEmAtendimento}</div>
                <div className="stat-label">Em Atendimento</div>
              </div>
            </div>

            <div className="stat-card" onClick={() => navigate('/portal/atendimento?status=RESOLVIDA')}>
              <div className="stat-icon" style={{ background: 'rgba(61, 155, 142, 0.1)' }}>
                <CheckCircle size={24} color="#3d9b8e" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.solicitacoesResolvidas}</div>
                <div className="stat-label">Resolvidas</div>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <h2>Ações Rápidas</h2>
            <div className="actions-grid">
              <button
                className="action-card"
                onClick={() => navigate('/portal/atendimento/novo')}
              >
                <MessageSquare size={24} />
                <span>Nova Solicitação</span>
              </button>
              <button
                className="action-card"
                onClick={() => navigate('/portal/apolices')}
              >
                <FileText size={24} />
                <span>Ver Apólices</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default PortalDashboard

