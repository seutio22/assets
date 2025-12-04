import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Search, Eye, CheckCircle } from 'lucide-react'
import './PlacementDemandas.css'

interface Demanda {
  id: string
  status: string
  dataFechamento: string
  responsavelFechamento: string
  observacoesEncerramento?: string
  placement: {
    id: string
    numero: string
    solicitacao?: {
      numero: string
      solicitante?: {
        name: string
        email: string
      }
      apolice?: {
        numero: string
        empresa: {
          razaoSocial: string
        }
      }
    }
  }
  implantacao?: {
    id: string
    status: string
    percentualConclusao: number
  }
}

const PlacementDemandas = () => {
  const navigate = useNavigate()
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    fetchDemandas()
  }, [statusFilter])

  const fetchDemandas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      params.append('limit', '100')
      
      const response = await api.get(`/placements/demandas?${params.toString()}`)
      const demandasData = response.data.data || []
      
      // Filtrar por busca local se necessário
      let filtered = demandasData
      if (search.trim()) {
        filtered = demandasData.filter((d: Demanda) => 
          d.placement.numero.toLowerCase().includes(search.toLowerCase()) ||
          d.placement.solicitacao?.numero.toLowerCase().includes(search.toLowerCase()) ||
          d.placement.solicitacao?.apolice?.numero.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      setDemandas(filtered)
    } catch (error: any) {
      console.error('Erro ao carregar demandas:', error)
      alert(`Erro ao carregar demandas: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      FECHADO: { label: 'Fechado', class: 'status-fechado' },
      ENVIADO_IMPLANTACAO: { label: 'Enviado para Implantação', class: 'status-enviado' }
    }
    const statusInfo = statusMap[status] || { label: status, class: 'status-default' }
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  return (
    <div className="placement-demandas-page">
      <div className="page-header">
        <h1>Placement - Demandas</h1>
        <div className="header-actions">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar demandas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchDemandas()
                }
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos os Status</option>
            <option value="FECHADO">Fechado</option>
            <option value="ENVIADO_IMPLANTACAO">Enviado para Implantação</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : demandas.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma demanda encontrada</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Placement</th>
                <th>Solicitação</th>
                <th>Apólice</th>
                <th>Solicitante</th>
                <th>Status</th>
                <th>Data Fechamento</th>
                <th>Responsável</th>
                <th>Implantação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {demandas.map((demanda) => (
                <tr key={demanda.id}>
                  <td>
                    <strong>{demanda.placement.numero}</strong>
                  </td>
                  <td>{demanda.placement.solicitacao?.numero || '-'}</td>
                  <td>
                    {demanda.placement.solicitacao?.apolice ? (
                      <div>
                        <div>{demanda.placement.solicitacao.apolice.numero}</div>
                        <div className="sub-text">{demanda.placement.solicitacao.apolice.empresa.razaoSocial}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{demanda.placement.solicitacao?.solicitante?.name || '-'}</td>
                  <td>{getStatusBadge(demanda.status)}</td>
                  <td>{formatDate(demanda.dataFechamento)}</td>
                  <td>{demanda.responsavelFechamento}</td>
                  <td>
                    {demanda.implantacao ? (
                      <div>
                        <button
                          className="btn-link"
                          onClick={() => navigate(`/implantacoes/${demanda.implantacao?.id}`)}
                        >
                          Ver Implantação
                        </button>
                        <div className="sub-text">
                          {demanda.implantacao.status} - {demanda.implantacao.percentualConclusao}%
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/placements/demandas/${demanda.id}`)}
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PlacementDemandas

