import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { ArrowLeft, Edit, Clock, User, FileText, History } from 'lucide-react'
import './SolicitacaoDetalhes.css'

interface Solicitacao {
  id: string
  numero: string
  tipo: string
  tipoImplantacao?: string
  descricao: string
  itensServicos?: string
  nivelUrgencia: string
  observacoes?: string
  prazoDesejado?: string
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
    fornecedor?: {
      razaoSocial: string
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
  anexos?: Array<{
    id: string
    nomeArquivo: string
    tipoArquivo?: string
    tamanho?: number
    createdAt: string
  }>
  historico?: Array<{
    id: string
    acao: string
    observacoes?: string
    createdAt: string
    usuario?: {
      id: string
      name: string
      email: string
    }
  }>
}

const SolicitacaoDetalhes = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dados' | 'historico' | 'anexos'>('dados')

  useEffect(() => {
    if (id) {
      fetchSolicitacao()
    }
  }, [id])

  const fetchSolicitacao = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/solicitacoes/${id}`)
      setSolicitacao(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar solicitação:', error)
      alert(`Erro ao carregar solicitação: ${error.response?.data?.error || error.message}`)
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
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

  const getAcaoLabel = (acao: string) => {
    const acoesMap: Record<string, string> = {
      CRIADA: 'Solicitação Criada',
      ATUALIZADA: 'Solicitação Atualizada',
      ENVIADA_PLACEMENT: 'Enviada para Placement',
      ENVIADA_IMPLANTACAO: 'Enviada para Implantação',
      CANCELADA: 'Solicitação Cancelada',
      ANEXO_ADICIONADO: 'Anexo Adicionado'
    }
    return acoesMap[acao] || acao
  }

  if (loading) {
    return (
      <div className="solicitacao-detalhes-page">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  if (!solicitacao) {
    return (
      <div className="solicitacao-detalhes-page">
        <div className="error">Solicitação não encontrada</div>
      </div>
    )
  }

  return (
    <div className="solicitacao-detalhes-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/solicitacoes')}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div className="header-actions">
          <button
            className="btn btn-outline"
            onClick={() => navigate(`/solicitacoes/${id}/editar`)}
          >
            <Edit size={18} />
            Editar
          </button>
        </div>
      </div>

      <div className="solicitacao-header">
        <div className="solicitacao-title">
          <FileText size={24} />
          <div>
            <h1>{solicitacao.numero}</h1>
            <p className="solicitacao-subtitle">
              {solicitacao.tipo === 'PLACEMENT' ? 'Placement' : 
               solicitacao.tipo === 'IMPLANTACAO' && solicitacao.tipoImplantacao === 'NOMEACAO' ? 'Implantação - Nomeação' :
               solicitacao.tipo === 'IMPLANTACAO' && solicitacao.tipoImplantacao === 'NOVA_APOLICE' ? 'Implantação - Nova Apólice' :
               'Implantação'}
            </p>
          </div>
        </div>
        <div>
          {getStatusBadge(solicitacao.status)}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveTab('dados')}
        >
          Dados
        </button>
        <button
          className={`tab ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          <History size={18} />
          Histórico
        </button>
        <button
          className={`tab ${activeTab === 'anexos' ? 'active' : ''}`}
          onClick={() => setActiveTab('anexos')}
        >
          <FileText size={18} />
          Anexos ({solicitacao.anexos?.length || 0})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dados' && (
          <div className="form-section">
            <h3 className="section-title">Informações da Solicitação</h3>
            <div className="form-grid">
              <div className="form-group small-field">
                <label className="label">Número</label>
                <div className="field-value">{solicitacao.numero}</div>
              </div>

              <div className="form-group small-field">
                <label className="label">Tipo</label>
                <div className="field-value">
                  {solicitacao.tipo === 'PLACEMENT' ? 'Placement' : 'Implantação'}
                </div>
              </div>

              {solicitacao.tipo === 'IMPLANTACAO' && (
                <div className="form-group small-field">
                  <label className="label">Tipo de Implantação</label>
                  <div className="field-value">
                    {solicitacao.tipoImplantacao === 'NOMEACAO' ? 'Nomeação' : 'Nova Apólice'}
                  </div>
                </div>
              )}

              <div className="form-group small-field">
                <label className="label">Status</label>
                <div className="field-value">{getStatusBadge(solicitacao.status)}</div>
              </div>

              <div className="form-group small-field">
                <label className="label">Nível de Urgência</label>
                <div className="field-value">{getUrgenciaBadge(solicitacao.nivelUrgencia)}</div>
              </div>

              <div className="form-group small-field">
                <label className="label">Data de Abertura</label>
                <div className="field-value">
                  <Clock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  {formatDate(solicitacao.dataAbertura)}
                </div>
              </div>

              {solicitacao.prazoDesejado && (
                <div className="form-group small-field">
                  <label className="label">Prazo Desejado</label>
                  <div className="field-value">{formatDate(solicitacao.prazoDesejado)}</div>
                </div>
              )}

              <div className="form-group">
                <label className="label">Solicitante</label>
                <div className="field-value">
                  <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  {solicitacao.solicitante?.name || '-'}
                  {solicitacao.solicitante?.email && (
                    <div className="sub-text">{solicitacao.solicitante.email}</div>
                  )}
                </div>
              </div>

              {solicitacao.apolice && (
                <>
                  <div className="form-group">
                    <label className="label">Apólice</label>
                    <div className="field-value">
                      {solicitacao.apolice.numero}
                      <div className="sub-text">{solicitacao.apolice.empresa.razaoSocial}</div>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group full-width">
                <label className="label">Descrição</label>
                <div className="field-value" style={{ whiteSpace: 'pre-wrap' }}>
                  {solicitacao.descricao}
                </div>
              </div>

              {solicitacao.itensServicos && (
                <div className="form-group full-width">
                  <label className="label">Itens/Serviços Solicitados</label>
                  <div className="field-value" style={{ whiteSpace: 'pre-wrap' }}>
                    {solicitacao.itensServicos}
                  </div>
                </div>
              )}

              {solicitacao.observacoes && (
                <div className="form-group full-width">
                  <label className="label">Observações</label>
                  <div className="field-value" style={{ whiteSpace: 'pre-wrap' }}>
                    {solicitacao.observacoes}
                  </div>
                </div>
              )}

              {solicitacao.placement && (
                <div className="form-group">
                  <label className="label">Placement Relacionado</label>
                  <div className="field-value">
                    <button
                      className="btn-link"
                      onClick={() => navigate(`/placements/gestao/${solicitacao.placement?.id}`)}
                    >
                      {solicitacao.placement.numero}
                    </button>
                    <div className="sub-text">Status: {solicitacao.placement.status}</div>
                  </div>
                </div>
              )}

              {solicitacao.implantacao && (
                <div className="form-group">
                  <label className="label">Implantação Relacionada</label>
                  <div className="field-value">
                    <button
                      className="btn-link"
                      onClick={() => navigate(`/implantacoes/${solicitacao.implantacao?.id}`)}
                    >
                      Ver Implantação
                    </button>
                    <div className="sub-text">
                      Status: {solicitacao.implantacao.status} - 
                      {solicitacao.implantacao.percentualConclusao}% concluído
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="form-section">
            <h3 className="section-title">Histórico de Movimentações</h3>
            {solicitacao.historico && solicitacao.historico.length > 0 ? (
              <div className="historico-timeline">
                {solicitacao.historico.map((item) => (
                  <div key={item.id} className="historico-item">
                    <div className="historico-dot"></div>
                    <div className="historico-content">
                      <div className="historico-header">
                        <span className="historico-acao">{getAcaoLabel(item.acao)}</span>
                        <span className="historico-date">{formatDate(item.createdAt)}</span>
                      </div>
                      {item.usuario && (
                        <div className="historico-usuario">
                          Por: {item.usuario.name} ({item.usuario.email})
                        </div>
                      )}
                      {item.observacoes && (
                        <div className="historico-observacoes">{item.observacoes}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Nenhum histórico registrado</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'anexos' && (
          <div className="form-section">
            <h3 className="section-title">Anexos</h3>
            {solicitacao.anexos && solicitacao.anexos.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome do Arquivo</th>
                    <th>Tipo</th>
                    <th>Tamanho</th>
                    <th>Data de Upload</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitacao.anexos.map((anexo) => (
                    <tr key={anexo.id}>
                      <td>{anexo.nomeArquivo}</td>
                      <td>{anexo.tipoArquivo || '-'}</td>
                      <td>{formatFileSize(anexo.tamanho)}</td>
                      <td>{formatDate(anexo.createdAt)}</td>
                      <td>
                        <button
                          className="btn-icon"
                          onClick={() => {
                            // TODO: Implementar download
                            alert('Download será implementado')
                          }}
                        >
                          <FileText size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>Nenhum anexo adicionado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SolicitacaoDetalhes

