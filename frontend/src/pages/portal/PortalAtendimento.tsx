import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { portalApi } from '../../services/portal-api'
import { Plus, Search, Eye, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Modal from '../../components/Modal'
import './PortalAtendimento.css'

interface SolicitacaoAtendimento {
  id: string
  numero: string
  tipo: string
  assunto: string
  descricao: string
  prioridade: string
  status: string
  dataAbertura: string
  dataResolucao?: string
  observacoesResolucao?: string
  apolice?: {
    numero: string
    empresa: {
      razaoSocial: string
    }
  }
  subEstipulante?: {
    codigoEstipulante: string
    razaoSocial: string
  }
  responsavel?: {
    name: string
    email: string
  }
  _count?: {
    anexos: number
    historico: number
  }
}

const PortalAtendimento = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAtendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [tipoFilter, setTipoFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    apoliceId: '',
    subEstipulanteId: '',
    tipo: 'DUVIDA',
    assunto: '',
    descricao: '',
    prioridade: 'MEDIA'
  })
  const [apolices, setApolices] = useState<any[]>([])
  const [subEstipulantes, setSubEstipulantes] = useState<any[]>([])

  useEffect(() => {
    fetchSolicitacoes()
    fetchApolices()
    fetchSubEstipulantes()
  }, [statusFilter, tipoFilter])

  const fetchSolicitacoes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (tipoFilter) params.append('tipo', tipoFilter)
      params.append('limit', '100')
      
      const response = await portalApi.get(`/portal?${params.toString()}`)
      let solicitacoesData = response.data.data || []
      
      // Filtrar por busca local
      if (search.trim()) {
        solicitacoesData = solicitacoesData.filter((s: SolicitacaoAtendimento) =>
          s.numero.toLowerCase().includes(search.toLowerCase()) ||
          s.assunto.toLowerCase().includes(search.toLowerCase()) ||
          s.descricao.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      setSolicitacoes(solicitacoesData)
    } catch (error: any) {
      console.error('Erro ao carregar solicitações:', error)
      alert(`Erro ao carregar solicitações: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchApolices = async () => {
    try {
      const response = await portalApi.get('/portal/apolices')
      setApolices(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar apólices:', error)
    }
  }

  const fetchSubEstipulantes = async () => {
    try {
      const response = await portalApi.get('/portal/sub-estipulantes')
      setSubEstipulantes(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar sub-estipulantes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await portalApi.post('/portal', formData)
      setShowModal(false)
      setFormData({
        apoliceId: '',
        subEstipulanteId: '',
        tipo: 'DUVIDA',
        assunto: '',
        descricao: '',
        prioridade: 'MEDIA'
      })
      fetchSolicitacoes()
      alert('Solicitação criada com sucesso!')
    } catch (error: any) {
      alert(`Erro ao criar solicitação: ${error.response?.data?.error || error.message}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return <Clock size={16} color="#ffc107" />
      case 'EM_ATENDIMENTO':
        return <AlertCircle size={16} color="#2196f3" />
      case 'RESOLVIDA':
      case 'FECHADA':
        return <CheckCircle size={16} color="#3d9b8e" />
      default:
        return <XCircle size={16} color="#a42340" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ABERTA': 'Aberta',
      'EM_ATENDIMENTO': 'Em Atendimento',
      'RESOLVIDA': 'Resolvida',
      'FECHADA': 'Fechada'
    }
    return labels[status] || status
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'DUVIDA': 'Dúvida',
      'SOLICITACAO': 'Solicitação',
      'RECLAMACAO': 'Reclamação',
      'SUGESTAO': 'Sugestão'
    }
    return labels[tipo] || tipo
  }

  const getPrioridadeLabel = (prioridade: string) => {
    const labels: Record<string, string> = {
      'BAIXA': 'Baixa',
      'MEDIA': 'Média',
      'ALTA': 'Alta',
      'URGENTE': 'Urgente'
    }
    return labels[prioridade] || prioridade
  }

  return (
    <div className="portal-atendimento">
      <div className="page-header">
        <div>
          <h1>Solicitações de Atendimento</h1>
          <p>Gerencie suas solicitações e acompanhe o status</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Nova Solicitação
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por número, assunto ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                fetchSolicitacoes()
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
          <option value="ABERTA">Aberta</option>
          <option value="EM_ATENDIMENTO">Em Atendimento</option>
          <option value="RESOLVIDA">Resolvida</option>
          <option value="FECHADA">Fechada</option>
        </select>

        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos os Tipos</option>
          <option value="DUVIDA">Dúvida</option>
          <option value="SOLICITACAO">Solicitação</option>
          <option value="RECLAMACAO">Reclamação</option>
          <option value="SUGESTAO">Sugestão</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : solicitacoes.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={48} color="#ccc" />
          <p>Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="solicitacoes-list">
          {solicitacoes.map((solicitacao) => (
            <div key={solicitacao.id} className="solicitacao-card">
              <div className="solicitacao-header">
                <div className="solicitacao-number">
                  <MessageSquare size={20} />
                  <span>{solicitacao.numero}</span>
                </div>
                <div className="solicitacao-badges">
                  <span className="badge badge-tipo">{getTipoLabel(solicitacao.tipo)}</span>
                  <span className={`badge badge-prioridade prioridade-${solicitacao.prioridade.toLowerCase()}`}>
                    {getPrioridadeLabel(solicitacao.prioridade)}
                  </span>
                  <span className={`status-badge status-${solicitacao.status.toLowerCase()}`}>
                    {getStatusIcon(solicitacao.status)}
                    {getStatusLabel(solicitacao.status)}
                  </span>
                </div>
              </div>
              
              <div className="solicitacao-body">
                <h3>{solicitacao.assunto}</h3>
                <p>{solicitacao.descricao}</p>
                
                <div className="solicitacao-info">
                  {solicitacao.apolice && (
                    <div className="info-item">
                      <strong>Apólice:</strong> {solicitacao.apolice.numero}
                    </div>
                  )}
                  {solicitacao.subEstipulante && (
                    <div className="info-item">
                      <strong>Sub-Estipulante:</strong> {solicitacao.subEstipulante.codigoEstipulante}
                    </div>
                  )}
                  {solicitacao.responsavel && (
                    <div className="info-item">
                      <strong>Responsável:</strong> {solicitacao.responsavel.name}
                    </div>
                  )}
                  <div className="info-item">
                    <strong>Data de Abertura:</strong> {new Date(solicitacao.dataAbertura).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              
              <div className="solicitacao-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => navigate(`/portal/atendimento/${solicitacao.id}`)}
                >
                  <Eye size={16} />
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Solicitação de Atendimento"
        size="large"
      >
        <form onSubmit={handleSubmit} className="solicitacao-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Apólice (Opcional)</label>
              <select
                value={formData.apoliceId}
                onChange={(e) => setFormData({ ...formData, apoliceId: e.target.value })}
              >
                <option value="">Selecione uma apólice</option>
                {apolices.map((apolice) => (
                  <option key={apolice.id} value={apolice.id}>
                    {apolice.numero} - {apolice.empresa.razaoSocial}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Sub-Estipulante (Opcional)</label>
              <select
                value={formData.subEstipulanteId}
                onChange={(e) => setFormData({ ...formData, subEstipulanteId: e.target.value })}
              >
                <option value="">Selecione um sub-estipulante</option>
                {subEstipulantes.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.codigoEstipulante} - {sub.razaoSocial}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tipo *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                required
              >
                <option value="DUVIDA">Dúvida</option>
                <option value="SOLICITACAO">Solicitação</option>
                <option value="RECLAMACAO">Reclamação</option>
                <option value="SUGESTAO">Sugestão</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prioridade</label>
              <select
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Assunto *</label>
              <input
                type="text"
                value={formData.assunto}
                onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                placeholder="Resumo da solicitação"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Descrição *</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva detalhadamente sua solicitação"
                rows={5}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Criar Solicitação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PortalAtendimento

