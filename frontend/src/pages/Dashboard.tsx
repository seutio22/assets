import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { Users, Building2, FileText, TrendingUp } from 'lucide-react'
import './Dashboard.css'

interface DashboardStats {
  clientes: number
  fornecedores: number
  apolices: number
  apolicesAtivas: number
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    clientes: 0,
    fornecedores: 0,
    apolices: 0,
    apolicesAtivas: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Timeout de 10 segundos para não travar a interface
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )

        const statsPromise = Promise.all([
          api.get('/grupos-economicos?limit=1'),
          api.get('/empresas?limit=1'),
          api.get('/fornecedores?limit=1'),
          api.get('/apolices?limit=1&status=ATIVA')
        ])

        const [gruposRes, empresasRes, fornecedoresRes, apolicesRes] = await Promise.race([
          statsPromise,
          timeoutPromise
        ]) as any[]

        setStats({
          clientes: empresasRes.data.pagination?.total || 0,
          fornecedores: fornecedoresRes.data.pagination?.total || 0,
          apolices: apolicesRes.data.pagination?.total || 0,
          apolicesAtivas: apolicesRes.data.pagination?.total || 0
        })
      } catch (error: any) {
        console.error('Erro ao carregar estatísticas:', error)
        // Em caso de erro, mostrar zeros mas não travar
        setStats({
          clientes: 0,
          fornecedores: 0,
          apolices: 0,
          apolicesAtivas: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="dashboard-loading">Carregando...</div>
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(164, 35, 64, 0.1)' }}>
            <Users size={32} color="#a42340" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.clientes}</div>
            <div className="stat-label">Empresas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(61, 155, 142, 0.1)' }}>
            <Building2 size={32} color="#3d9b8e" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.fornecedores}</div>
            <div className="stat-label">Fornecedores</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 34, 95, 0.1)' }}>
            <FileText size={32} color="#00225f" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.apolices}</div>
            <div className="stat-label">Apólices</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(61, 155, 142, 0.1)' }}>
            <TrendingUp size={32} color="#3d9b8e" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.apolicesAtivas}</div>
            <div className="stat-label">Apólices Ativas</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

