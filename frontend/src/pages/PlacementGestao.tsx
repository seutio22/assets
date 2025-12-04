import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Search, Eye, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import './PlacementGestao.css'

interface Placement {
  id: string
  numero: string
  status: string
  dataTriagem?: string
  dataInicio?: string
  dataEntrega?: string
  solicitacao?: {
    id: string
    numero: string
    descricao: string
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
  gestor?: {
    name: string
  }
  analista?: {
    name: string
  }
  solicitante?: {
    name: string
  }
  itens?: Array<{
    id: string
    descricao: string
    quantidade?: number
    valorUnitario?: number
    valorTotal?: number
  }>
  _count?: {
    anexos: number
    historico: number
  }
}

const PlacementGestao = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [placements, setPlacements] = useState<Placement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Colunas do Kanban
  const [triagem, setTriagem] = useState<Placement[]>([])
  const [emAndamento, setEmAndamento] = useState<Placement[]>([])
  const [entregue, setEntregue] = useState<Placement[]>([])

  useEffect(() => {
    if (!id) {
      fetchPlacements()
    }
  }, [statusFilter])

  useEffect(() => {
    // Organizar placements nas colunas do Kanban
    setTriagem(placements.filter(p => p.status === 'TRIAGEM'))
    setEmAndamento(placements.filter(p => p.status === 'EM_ANDAMENTO'))
    setEntregue(placements.filter(p => p.status === 'ENTREGUE'))
  }, [placements])

  const fetchPlacements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      // Não passar statusFilter se não especificado - a API retorna todos os status do Kanban
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      params.append('limit', '100')
      
      const response = await api.get(`/placements/gestao?${params.toString()}`)
      const placementsData = response.data.data || []
      
      // Filtrar por busca local se necessário
      let filtered = placementsData
      if (search.trim()) {
        filtered = placementsData.filter((p: Placement) => 
          p.numero.toLowerCase().includes(search.toLowerCase()) ||
          p.solicitacao?.numero.toLowerCase().includes(search.toLowerCase()) ||
          p.solicitacao?.descricao.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      setPlacements(filtered)
    } catch (error: any) {
      console.error('Erro ao carregar placements:', error)
      alert(`Erro ao carregar placements: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTriagemAction = async (placementId: string, acao: 'APROVAR' | 'REJEITAR' | 'SOLICITAR_INFO', observacoes?: string) => {
    try {
      await api.put(`/placements/gestao/${placementId}/triagem`, {
        acao,
        observacoes
      })
      fetchPlacements()
    } catch (error: any) {
      console.error('Erro ao processar triagem:', error)
      alert(`Erro ao processar triagem: ${error.response?.data?.error || error.message}`)
    }
  }

  const handleEntregaAction = async (placementId: string, acao: 'APROVAR' | 'REPIQUE', observacoes?: string) => {
    try {
      await api.put(`/placements/gestao/${placementId}/entregue`, {
        acao,
        observacoes
      })
      fetchPlacements()
    } catch (error: any) {
      console.error('Erro ao processar entrega:', error)
      alert(`Erro ao processar entrega: ${error.response?.data?.error || error.message}`)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const KanbanCard = ({ placement }: { placement: Placement }) => (
    <div className="kanban-card" onClick={() => navigate(`/placements/gestao/${placement.id}`)}>
      <div className="card-header">
        <strong>{placement.numero}</strong>
        <span className="card-badge">{placement.solicitacao?.numero}</span>
      </div>
      <div className="card-body">
        <div className="card-description">
          {placement.solicitacao?.descricao?.substring(0, 100)}
          {placement.solicitacao?.descricao && placement.solicitacao.descricao.length > 100 ? '...' : ''}
        </div>
        {placement.solicitacao?.apolice && (
          <div className="card-info">
            <strong>Apólice:</strong> {placement.solicitacao.apolice.numero}
          </div>
        )}
        {placement.solicitacao?.solicitante && (
          <div className="card-info">
            <strong>Solicitante:</strong> {placement.solicitacao.solicitante.name}
          </div>
        )}
        {placement.analista && (
          <div className="card-info">
            <strong>Analista:</strong> {placement.analista.name}
          </div>
        )}
        {placement.dataTriagem && (
          <div className="card-date">
            Triagem: {formatDate(placement.dataTriagem)}
          </div>
        )}
      </div>
      <div className="card-footer">
        {placement._count && (
          <div className="card-stats">
            <span>{placement._count.anexos} anexos</span>
            <span>{placement._count.historico} movimentações</span>
          </div>
        )}
      </div>
    </div>
  )

  const TriagemColumn = () => (
    <div className="kanban-column">
      <div className="column-header">
        <h3>Triagem</h3>
        <span className="column-count">{triagem.length}</span>
      </div>
      <div className="column-content">
        {triagem.map(placement => (
          <div key={placement.id} className="kanban-card-wrapper">
            <KanbanCard placement={placement} />
            <div className="card-actions">
              <button
                className="btn-action btn-approve"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('Deseja aprovar este placement?')) {
                    handleTriagemAction(placement.id, 'APROVAR')
                  }
                }}
                title="Aprovar"
              >
                <CheckCircle size={18} />
              </button>
              <button
                className="btn-action btn-reject"
                onClick={(e) => {
                  e.stopPropagation()
                  const observacoes = window.prompt('Motivo da rejeição:')
                  if (observacoes !== null) {
                    handleTriagemAction(placement.id, 'REJEITAR', observacoes)
                  }
                }}
                title="Rejeitar"
              >
                <XCircle size={18} />
              </button>
              <button
                className="btn-action btn-info"
                onClick={(e) => {
                  e.stopPropagation()
                  const observacoes = window.prompt('Informações solicitadas:')
                  if (observacoes !== null) {
                    handleTriagemAction(placement.id, 'SOLICITAR_INFO', observacoes)
                  }
                }}
                title="Solicitar Informações"
              >
                <MessageSquare size={18} />
              </button>
            </div>
          </div>
        ))}
        {triagem.length === 0 && (
          <div className="empty-column">Nenhum placement em triagem</div>
        )}
      </div>
    </div>
  )

  const EmAndamentoColumn = () => (
    <div className="kanban-column">
      <div className="column-header">
        <h3>Em Andamento</h3>
        <span className="column-count">{emAndamento.length}</span>
      </div>
      <div className="column-content">
        {emAndamento.map(placement => (
          <KanbanCard key={placement.id} placement={placement} />
        ))}
        {emAndamento.length === 0 && (
          <div className="empty-column">Nenhum placement em andamento</div>
        )}
      </div>
    </div>
  )

  const EntregueColumn = () => (
    <div className="kanban-column">
      <div className="column-header">
        <h3>Entregue</h3>
        <span className="column-count">{entregue.length}</span>
      </div>
      <div className="column-content">
        {entregue.map(placement => (
          <div key={placement.id} className="kanban-card-wrapper">
            <KanbanCard placement={placement} />
            <div className="card-actions">
              <button
                className="btn-action btn-approve"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('Deseja aprovar e fechar este placement?')) {
                    handleEntregaAction(placement.id, 'APROVAR')
                  }
                }}
                title="Aprovar e Fechar"
              >
                <CheckCircle size={18} />
                Aprovar
              </button>
              <button
                className="btn-action btn-repique"
                onClick={(e) => {
                  e.stopPropagation()
                  const observacoes = window.prompt('Motivo do repique:')
                  if (observacoes !== null) {
                    handleEntregaAction(placement.id, 'REPIQUE', observacoes)
                  }
                }}
                title="Solicitar Repique"
              >
                <MessageSquare size={18} />
                Repique
              </button>
            </div>
          </div>
        ))}
        {entregue.length === 0 && (
          <div className="empty-column">Nenhum placement entregue</div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="placement-gestao-page">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="placement-gestao-page">
      <div className="page-header">
        <h1>Placement - Gestão</h1>
        <div className="header-actions">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar placements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchPlacements()
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="kanban-board">
        <TriagemColumn />
        <EmAndamentoColumn />
        <EntregueColumn />
      </div>
    </div>
  )
}

export default PlacementGestao

