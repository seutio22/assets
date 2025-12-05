import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Search, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'
import './Implantacoes.css'

interface Implantacao {
  id: string
  status: string
  percentualConclusao: number
  dataInicio?: string
  dataPrevistaFim?: string
  dataFim?: string
  apolice: {
    id: string
    numero: string
    empresa: {
      razaoSocial: string
      cnpj: string
    }
  }
  chamado?: {
    id: string
    numero: string
    titulo: string
  }
  cronogramaItens: Array<{
    id: string
    titulo: string
    status: string
    ordem: number
  }>
}

const Implantacoes = () => {
  const navigate = useNavigate()
  const [implantacoes, setImplantacoes] = useState<Implantacao[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit] = useState(25) // Reduzido de 100 para 25
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Debounce da busca
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    setPage(1) // Resetar página quando busca ou filtro mudar
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    fetchImplantacoes()
  }, [debouncedSearch, statusFilter, page])

  const fetchImplantacoes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim())
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      
      const response = await api.get(`/implantacoes?${params.toString()}`)
      const implantacoesData = response.data.data || []
      const pagination = response.data.pagination || {}
      
      setImplantacoes(implantacoesData)
      setTotal(pagination.total || 0)
      setTotalPages(pagination.totalPages || 0)
    } catch (error: any) {
      console.error('Erro ao carregar implantações:', error)
      alert(`Erro ao carregar implantações: ${error.response?.data?.error || error.message}`)
      setImplantacoes([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      PENDENTE: { label: 'Pendente', class: 'status-pendente' },
      EM_ANDAMENTO: { label: 'Em Andamento', class: 'status-andamento' },
      CONCLUIDA: { label: 'Concluída', class: 'status-concluida' },
      CANCELADA: { label: 'Cancelada', class: 'status-cancelada' }
    }
    const statusInfo = statusMap[status] || { label: status, class: 'status-default' }
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  return (
    <div className="implantacoes-page">
      <div className="page-header">
        <h1>Implantações</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/implantacoes/nova')}
        >
          <Plus size={20} />
          Nova Implantação
        </button>
      </div>

      <div className="page-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por apólice, cliente ou chamado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="EM_ANDAMENTO">Em Andamento</option>
          <option value="CONCLUIDA">Concluída</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>

      {!loading && total > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          padding: '0 8px'
        }}>
          <span style={{ color: '#666', fontSize: '14px' }}>
            Mostrando {implantacoes.length} de {total} implantações
          </span>
        </div>
      )}

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : implantacoes.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma implantação encontrada</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Apólice</th>
                <th>Cliente</th>
                <th>Chamado</th>
                <th>Status</th>
                <th>Progresso</th>
                <th>Data Início</th>
                <th>Previsão Fim</th>
                <th>Etapas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {implantacoes.map((implantacao) => (
                <tr key={implantacao.id}>
                  <td>{implantacao.apolice.numero}</td>
                  <td>{implantacao.apolice.empresa.razaoSocial}</td>
                  <td>{implantacao.chamado?.numero || '-'}</td>
                  <td>{getStatusBadge(implantacao.status)}</td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${implantacao.percentualConclusao}%` }}
                        />
                      </div>
                      <span className="progress-text">{implantacao.percentualConclusao}%</span>
                    </div>
                  </td>
                  <td>{formatDate(implantacao.dataInicio)}</td>
                  <td>{formatDate(implantacao.dataPrevistaFim)}</td>
                  <td>
                    {implantacao.cronogramaItens.length} etapa(s)
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        title="Visualizar"
                        onClick={() => navigate(`/implantacoes/${implantacao.id}`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Editar"
                        onClick={() => navigate(`/implantacoes/${implantacao.id}/editar`)}
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '24px',
          padding: '16px'
        }}>
          <button
            className="btn"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            style={{
              opacity: page === 1 ? 0.5 : 1,
              cursor: page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={18} />
            Anterior
          </button>
          
          <span style={{ 
            padding: '8px 16px',
            fontSize: '14px',
            color: '#333'
          }}>
            Página {page} de {totalPages}
          </span>
          
          <button
            className="btn"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            style={{
              opacity: page === totalPages ? 0.5 : 1,
              cursor: page === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Próxima
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

export default Implantacoes

