import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Search, Eye, UserCheck, CheckCircle } from 'lucide-react'
import './PlacementFila.css'

interface Placement {
  id: string
  numero: string
  status: string
  dataInicio?: string
  analista?: {
    id: string
    name: string
    email: string
  }
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
  itens?: Array<{
    id: string
    descricao: string
    quantidade?: number
    valorUnitario?: number
    valorTotal?: number
  }>
  _count?: {
    anexos: number
  }
}

const PlacementFila = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [placements, setPlacements] = useState<Placement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroAnalista, setFiltroAnalista] = useState<'todos' | 'meus' | 'disponiveis'>('disponiveis')

  useEffect(() => {
    fetchPlacements()
  }, [filtroAnalista])

  const fetchPlacements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('status', 'EM_ANDAMENTO')
      
      if (filtroAnalista === 'meus' && user?.id) {
        params.append('analistaId', user.id)
      } else if (filtroAnalista === 'disponiveis') {
        // Não passar analistaId para buscar apenas os disponíveis
      }
      
      params.append('limit', '100')
      
      const response = await api.get(`/placements/fila?${params.toString()}`)
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
      
      // Se for "disponíveis", filtrar apenas os sem analista
      if (filtroAnalista === 'disponiveis') {
        filtered = filtered.filter((p: Placement) => !p.analista)
      }
      
      setPlacements(filtered)
    } catch (error: any) {
      console.error('Erro ao carregar fila:', error)
      alert(`Erro ao carregar fila: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAssumir = async (placementId: string) => {
    try {
      await api.post(`/placements/fila/${placementId}/assumir`)
      fetchPlacements()
      alert('Processo assumido com sucesso!')
    } catch (error: any) {
      console.error('Erro ao assumir processo:', error)
      alert(`Erro ao assumir processo: ${error.response?.data?.error || error.message}`)
    }
  }

  const handleFinalizar = async (placementId: string) => {
    const itensFinais = window.prompt('Informe os itens finais (JSON ou texto):')
    const observacoes = window.prompt('Observações (opcional):')
    
    if (itensFinais === null) return
    
    try {
      await api.put(`/placements/fila/${placementId}/finalizar`, {
        itensFinais,
        observacoes: observacoes || null
      })
      fetchPlacements()
      alert('Cotação finalizada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao finalizar cotação:', error)
      alert(`Erro ao finalizar cotação: ${error.response?.data?.error || error.message}`)
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

  return (
    <div className="placement-fila-page">
      <div className="page-header">
        <h1>Placement - Fila de Processos</h1>
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
          <select
            value={filtroAnalista}
            onChange={(e) => setFiltroAnalista(e.target.value as 'todos' | 'meus' | 'disponiveis')}
            className="filter-select"
          >
            <option value="disponiveis">Disponíveis</option>
            <option value="meus">Meus Processos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : placements.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum processo encontrado na fila</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Solicitação</th>
                <th>Descrição</th>
                <th>Apólice</th>
                <th>Solicitante</th>
                <th>Analista</th>
                <th>Data Início</th>
                <th>Itens</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((placement) => (
                <tr key={placement.id}>
                  <td>
                    <strong>{placement.numero}</strong>
                  </td>
                  <td>{placement.solicitacao?.numero || '-'}</td>
                  <td>
                    <div className="descricao-cell">
                      {placement.solicitacao?.descricao?.substring(0, 50)}
                      {placement.solicitacao?.descricao && placement.solicitacao.descricao.length > 50 ? '...' : ''}
                    </div>
                  </td>
                  <td>
                    {placement.solicitacao?.apolice ? (
                      <div>
                        <div>{placement.solicitacao.apolice.numero}</div>
                        <div className="sub-text">{placement.solicitacao.apolice.empresa.razaoSocial}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{placement.solicitacao?.solicitante?.name || '-'}</td>
                  <td>
                    {placement.analista ? (
                      <span className="analista-badge">
                        <UserCheck size={14} />
                        {placement.analista.name}
                      </span>
                    ) : (
                      <span className="disponivel-badge">Disponível</span>
                    )}
                  </td>
                  <td>{formatDate(placement.dataInicio)}</td>
                  <td>{placement.itens?.length || 0} itens</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => navigate(`/placements/gestao/${placement.id}`)}
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      {!placement.analista && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAssumir(placement.id)}
                          title="Assumir processo"
                        >
                          <UserCheck size={16} />
                          Assumir
                        </button>
                      )}
                      {placement.analista?.id === user?.id && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            if (window.confirm('Deseja finalizar esta cotação?')) {
                              handleFinalizar(placement.id)
                            }
                          }}
                          title="Finalizar cotação"
                        >
                          <CheckCircle size={16} />
                          Finalizar
                        </button>
                      )}
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

export default PlacementFila

