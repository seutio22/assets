import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Search, Eye, Edit, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import SolicitacaoDetalhes from './SolicitacaoDetalhes'
import { useDebounce } from '../hooks/useDebounce'
import './Solicitacoes.css'

interface Solicitacao {
  id: string
  numero: string
  tipo: string
  tipoImplantacao?: string
  descricao: string
  nivelUrgencia: string
  status: string
  dataAbertura: string
  solicitante?: {
    id: string
    name: string
    email: string
  }
  apolice?: {
    id: string
    numero: string
    empresa: {
      razaoSocial: string
      cnpj: string
    }
  }
  placement?: {
    id: string
    numero: string
    status: string
  }
  implantacao?: {
    id: string
    status: string
    percentualConclusao: number
  }
  _count?: {
    anexos: number
    historico: number
  }
}

const Solicitacoes = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [tipoFilter, setTipoFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit] = useState(25) // Reduzido de 100 para 25
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Verificar qual submódulo está ativo
  const isDetailView = id && location.pathname.includes(`/solicitacoes/${id}`) && !location.pathname.includes('/editar')
  const isNewSolicitacao = location.pathname === '/solicitacoes/nova'
  const isEditSolicitacao = id && location.pathname.includes('/editar')
  const isMinhasSolicitacoes = location.pathname === '/solicitacoes/minhas'
  const isPlacement = location.pathname === '/solicitacoes/placement'
  const isImplantacao = location.pathname === '/solicitacoes/implantacao'
  const isTodas = location.pathname === '/solicitacoes' || (!isMinhasSolicitacoes && !isPlacement && !isImplantacao && !isDetailView && !isNewSolicitacao && !isEditSolicitacao)
  const showList = !isDetailView && !isNewSolicitacao && !isEditSolicitacao

  // Debounce da busca para evitar múltiplas requisições
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    setPage(1) // Resetar para primeira página quando busca ou filtros mudarem
  }, [debouncedSearch, statusFilter, tipoFilter])

  useEffect(() => {
    if (showList) {
      fetchSolicitacoes()
    } else {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, tipoFilter, page, showList, isMinhasSolicitacoes, isPlacement, isImplantacao])

  const fetchSolicitacoes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Aplicar filtros baseados no submódulo ativo
      if (isMinhasSolicitacoes && user?.id) {
        params.append('solicitanteId', user.id)
      } else if (isPlacement) {
        params.append('tipo', 'PLACEMENT')
      } else if (isImplantacao) {
        params.append('tipo', 'IMPLANTACAO')
      }
      
      if (statusFilter) params.append('status', statusFilter)
      if (tipoFilter && !isPlacement && !isImplantacao) params.append('tipo', tipoFilter)
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim())
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      
      const response = await api.get(`/solicitacoes?${params.toString()}`)
      const solicitacoesData = response.data.data || []
      const pagination = response.data.pagination || {}
      
      setSolicitacoes(solicitacoesData)
      setTotal(pagination.total || 0)
      setTotalPages(pagination.totalPages || 0)
    } catch (error: any) {
      console.error('Erro ao carregar solicitações:', error)
      alert(`Erro ao carregar solicitações: ${error.response?.data?.error || error.message}`)
      setSolicitacoes([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
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
      ABERTA: { label: 'Aberta', class: 'status-aberta' },
      ENVIADA_PLACEMENT: { label: 'Enviada Placement', class: 'status-enviada' },
      ENVIADA_IMPLANTACAO: { label: 'Enviada Implantação', class: 'status-enviada' },
      CANCELADA: { label: 'Cancelada', class: 'status-cancelada' }
    }
    const statusInfo = statusMap[status] || { label: status, class: 'status-default' }
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  const getUrgenciaBadge = (urgencia: string) => {
    const urgenciaMap: Record<string, { label: string; class: string }> = {
      BAIXA: { label: 'Baixa', class: 'urgencia-baixa' },
      MEDIA: { label: 'Média', class: 'urgencia-media' },
      ALTA: { label: 'Alta', class: 'urgencia-alta' },
      URGENTE: { label: 'Urgente', class: 'urgencia-urgente' }
    }
    const urgenciaInfo = urgenciaMap[urgencia] || { label: urgencia, class: 'urgencia-default' }
    return <span className={`urgencia-badge ${urgenciaInfo.class}`}>{urgenciaInfo.label}</span>
  }

  const getTipoLabel = (tipo: string, tipoImplantacao?: string) => {
    if (tipo === 'PLACEMENT') return 'Placement'
    if (tipo === 'IMPLANTACAO') {
      if (tipoImplantacao === 'NOMEACAO') return 'Implantação - Nomeação'
      if (tipoImplantacao === 'NOVA_APOLICE') return 'Implantação - Nova Apólice'
      return 'Implantação'
    }
    return tipo
  }

  // Se estiver na rota de detalhes, mostrar página de detalhes
  if (isDetailView && id) {
    return <SolicitacaoDetalhes />
  }

  // Se estiver criando nova solicitação, redirecionar para questionário (será implementado)
  if (isNewSolicitacao) {
    // TODO: Implementar página de questionário
    navigate('/solicitacoes')
    return null
  }

  const getPageTitle = () => {
    if (isMinhasSolicitacoes) return 'Minhas Solicitações'
    if (isPlacement) return 'Solicitações - Placement'
    if (isImplantacao) return 'Solicitações - Implantação'
    return 'Todas as Solicitações'
  }

  return (
    <div className="solicitacoes-page">
      <div className="page-header">
        <h1>{getPageTitle()}</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/solicitacoes/nova')}
        >
          <Plus size={20} />
          Nova Solicitação
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por número, descrição, apólice ou razão social..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos os Status</option>
            <option value="ABERTA">Aberta</option>
            <option value="ENVIADA_PLACEMENT">Enviada Placement</option>
            <option value="ENVIADA_IMPLANTACAO">Enviada Implantação</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          {!isPlacement && !isImplantacao && (
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos os Tipos</option>
              <option value="PLACEMENT">Placement</option>
              <option value="IMPLANTACAO">Implantação</option>
            </select>
          )}
        </div>
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
            Mostrando {solicitacoes.length} de {total} solicitações
          </span>
        </div>
      )}

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : solicitacoes.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Solicitante</th>
                <th>Apólice</th>
                <th>Urgência</th>
                <th>Status</th>
                <th>Data Abertura</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes.map((solicitacao) => (
                <tr key={solicitacao.id}>
                  <td>
                    <strong>{solicitacao.numero}</strong>
                  </td>
                  <td>{getTipoLabel(solicitacao.tipo, solicitacao.tipoImplantacao)}</td>
                  <td>
                    <div className="descricao-cell">
                      {solicitacao.descricao.length > 50
                        ? `${solicitacao.descricao.substring(0, 50)}...`
                        : solicitacao.descricao}
                    </div>
                  </td>
                  <td>
                    {solicitacao.solicitante?.name || '-'}
                  </td>
                  <td>
                    {solicitacao.apolice ? (
                      <div>
                        <div>{solicitacao.apolice.numero}</div>
                        <div className="sub-text">{solicitacao.apolice.empresa.razaoSocial}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{getUrgenciaBadge(solicitacao.nivelUrgencia)}</td>
                  <td>{getStatusBadge(solicitacao.status)}</td>
                  <td>{formatDate(solicitacao.dataAbertura)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/solicitacoes/${solicitacao.id}`)}
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/solicitacoes/${solicitacao.id}/editar`)}
                        title="Editar"
                      >
                        <Edit size={18} />
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

export default Solicitacoes

