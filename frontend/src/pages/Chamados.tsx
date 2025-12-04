import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Search, Eye, Edit } from 'lucide-react'
import ChamadoForm from '../components/ChamadoForm'
import './Chamados.css'

interface Chamado {
  id: string
  numero: string
  titulo: string
  descricao?: string
  status: string
  prioridade: string
  dataSolicitacao: string
  dataPrazo?: string
  apolice: {
    id: string
    numero: string
    empresa: {
      razaoSocial: string
      cnpj: string
    }
  }
  implantacao?: {
    id: string
    status: string
    percentualConclusao: number
  }
}

const Chamados = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Verificar se está na rota de novo chamado ou edição
  const isNewChamado = location.pathname === '/chamados/novo'
  const isEditChamado = id && location.pathname.includes('/editar')
  const showForm = isNewChamado || isEditChamado

  useEffect(() => {
    if (!showForm) {
      fetchChamados()
    } else {
      setLoading(false)
    }
  }, [statusFilter, showForm])

  const fetchChamados = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('limit', '100')
      
      const response = await api.get(`/chamados-implantacao?${params.toString()}`)
      const chamadosData = response.data.data || []
      
      // Filtrar por busca local se necessário
      let filtered = chamadosData
      if (search.trim()) {
        filtered = chamadosData.filter((c: Chamado) => 
          c.numero.toLowerCase().includes(search.toLowerCase()) ||
          c.titulo.toLowerCase().includes(search.toLowerCase()) ||
          c.apolice.numero.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      setChamados(filtered)
    } catch (error: any) {
      console.error('Erro ao carregar chamados:', error)
      alert(`Erro ao carregar chamados: ${error.response?.data?.error || error.message}`)
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
      ABERTO: { label: 'Aberto', class: 'status-aberto' },
      EM_ANDAMENTO: { label: 'Em Andamento', class: 'status-andamento' },
      CONCLUIDO: { label: 'Concluído', class: 'status-concluido' },
      CANCELADO: { label: 'Cancelado', class: 'status-cancelado' }
    }
    const statusInfo = statusMap[status] || { label: status, class: 'status-default' }
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeMap: Record<string, { label: string; class: string }> = {
      BAIXA: { label: 'Baixa', class: 'prioridade-baixa' },
      MEDIA: { label: 'Média', class: 'prioridade-media' },
      ALTA: { label: 'Alta', class: 'prioridade-alta' },
      URGENTE: { label: 'Urgente', class: 'prioridade-urgente' }
    }
    const prioridadeInfo = prioridadeMap[prioridade] || { label: prioridade, class: 'prioridade-default' }
    return <span className={`prioridade-badge ${prioridadeInfo.class}`}>{prioridadeInfo.label}</span>
  }

  if (showForm) {
    return (
      <ChamadoForm
        chamadoId={isEditChamado ? id : undefined}
        onSuccess={() => navigate('/chamados')}
        onCancel={() => navigate('/chamados')}
      />
    )
  }

  return (
    <div className="chamados-page">
      <div className="page-header">
        <h1>Chamados de Implantação</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/chamados/novo')}
        >
          <Plus size={20} />
          Novo Chamado
        </button>
      </div>

      <div className="page-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por número, título ou apólice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchChamados()}
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="ABERTO">Aberto</option>
          <option value="EM_ANDAMENTO">Em Andamento</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : chamados.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum chamado encontrado</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Título</th>
                <th>Apólice</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Data Solicitação</th>
                <th>Prazo</th>
                <th>Implantacao</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {chamados.map((chamado) => (
                <tr key={chamado.id}>
                  <td>{chamado.numero}</td>
                  <td>{chamado.titulo}</td>
                  <td>{chamado.apolice.numero}</td>
                  <td>{chamado.apolice.empresa.razaoSocial}</td>
                  <td>{getStatusBadge(chamado.status)}</td>
                  <td>{getPrioridadeBadge(chamado.prioridade)}</td>
                  <td>{formatDate(chamado.dataSolicitacao)}</td>
                  <td>{formatDate(chamado.dataPrazo)}</td>
                  <td>
                    {chamado.implantacao ? (
                      <span className="status-badge status-andamento">
                        {chamado.implantacao.percentualConclusao}%
                      </span>
                    ) : (
                      <span className="status-badge status-cancelado">Não iniciada</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        title="Visualizar"
                        onClick={() => navigate(`/chamados/${chamado.id}`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Editar"
                        onClick={() => navigate(`/chamados/${chamado.id}/editar`)}
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
    </div>
  )
}

export default Chamados

