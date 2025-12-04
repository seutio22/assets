import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import Modal from './Modal'

interface Servico {
  id: string
  categoria: 'OPERACIONAL' | 'FERRAMENTAS' | 'GESTAO_SAUDE'
  nome: string
  descricao?: string
  valor?: number
  dataInicio?: string
  dataFim?: string
  status: string
  observacoes?: string
  createdAt: string
}

interface ServicosTabProps {
  apoliceId: string
}

const ServicosTab = ({ apoliceId }: ServicosTabProps) => {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    categoria: 'OPERACIONAL' as 'OPERACIONAL' | 'FERRAMENTAS' | 'GESTAO_SAUDE',
    nome: '',
    descricao: '',
    valor: '',
    dataInicio: '',
    dataFim: '',
    status: 'ATIVO',
    observacoes: ''
  })

  useEffect(() => {
    if (apoliceId) {
      fetchServicos()
    }
  }, [apoliceId])

  const fetchServicos = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/servicos-apolice?apoliceId=${apoliceId}`)
      setServicos(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (servico?: Servico) => {
    if (servico) {
      setEditingId(servico.id)
      setFormData({
        categoria: servico.categoria,
        nome: servico.nome,
        descricao: servico.descricao || '',
        valor: servico.valor?.toString() || '',
        dataInicio: servico.dataInicio ? new Date(servico.dataInicio).toISOString().split('T')[0] : '',
        dataFim: servico.dataFim ? new Date(servico.dataFim).toISOString().split('T')[0] : '',
        status: servico.status,
        observacoes: servico.observacoes || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        categoria: 'OPERACIONAL',
        nome: '',
        descricao: '',
        valor: '',
        dataInicio: '',
        dataFim: '',
        status: 'ATIVO',
        observacoes: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({
      categoria: 'OPERACIONAL',
      nome: '',
      descricao: '',
      valor: '',
      dataInicio: '',
      dataFim: '',
      status: 'ATIVO',
      observacoes: ''
    })
  }

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      alert('Nome do serviço é obrigatório')
      return
    }

    try {
      const data = {
        apoliceId,
        categoria: formData.categoria,
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || null,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        dataInicio: formData.dataInicio || null,
        dataFim: formData.dataFim || null,
        status: formData.status,
        observacoes: formData.observacoes.trim() || null
      }

      if (editingId) {
        await api.put(`/servicos-apolice/${editingId}`, data)
      } else {
        await api.post('/servicos-apolice', data)
      }

      handleCloseModal()
      fetchServicos()
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error)
      alert(error.response?.data?.error || 'Erro ao salvar serviço')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) {
      return
    }

    try {
      await api.delete(`/servicos-apolice/${id}`)
      fetchServicos()
    } catch (error: any) {
      console.error('Erro ao excluir serviço:', error)
      alert(error.response?.data?.error || 'Erro ao excluir serviço')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value?: number) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'OPERACIONAL':
        return 'Operacional'
      case 'FERRAMENTAS':
        return 'Ferramentas'
      case 'GESTAO_SAUDE':
        return 'Gestão de Saúde'
      default:
        return categoria
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'Ativo'
      case 'INATIVO':
        return 'Inativo'
      case 'CONCLUIDO':
        return 'Concluído'
      default:
        return status
    }
  }

  const servicosOperacional = servicos.filter(s => s.categoria === 'OPERACIONAL')
  const servicosFerramentas = servicos.filter(s => s.categoria === 'FERRAMENTAS')
  const servicosGestaoSaude = servicos.filter(s => s.categoria === 'GESTAO_SAUDE')

  const renderServicosList = (servicosList: Servico[], categoria: string) => {
    if (servicosList.length === 0) {
      return (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          background: '#f5f5f5',
          borderRadius: '6px',
          color: '#666'
        }}>
          Nenhum serviço cadastrado
        </div>
      )
    }

    return (
      <div style={{ display: 'grid', gap: '12px' }}>
        {servicosList.map((servico) => (
          <div
            key={servico.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #e9e9e9',
              gap: '16px'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontWeight: 600 }}>{servico.nome}</h4>
                <span style={{
                  padding: '4px 8px',
                  background: servico.status === 'ATIVO' ? '#e8f5e9' : servico.status === 'CONCLUIDO' ? '#e3f2fd' : '#f5f5f5',
                  color: servico.status === 'ATIVO' ? '#2e7d32' : servico.status === 'CONCLUIDO' ? '#1976d2' : '#666',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {getStatusLabel(servico.status)}
                </span>
              </div>
              {servico.descricao && (
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                  {servico.descricao}
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
                {servico.valor && (
                  <span>Valor: {formatCurrency(servico.valor)}</span>
                )}
                {servico.dataInicio && (
                  <span>Início: {formatDate(servico.dataInicio)}</span>
                )}
                {servico.dataFim && (
                  <span>Fim: {formatDate(servico.dataFim)}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-icon"
                onClick={() => handleOpenModal(servico)}
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
              <button
                className="btn-icon"
                onClick={() => handleDelete(servico.id)}
                title="Excluir"
                style={{ color: '#d32f2f' }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="form-section">
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div className="section-title">Serviços</div>
        <button
          className="btn btn-primary"
          onClick={() => handleOpenModal()}
        >
          <Plus size={20} />
          Adicionar Serviço
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>Carregando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Operacional */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              background: '#00225f', 
              color: 'white', 
              padding: '10px 14px', 
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '14px',
              marginBottom: 0
            }}>
              Operacional ({servicosOperacional.length})
            </div>
            <div style={{ 
              padding: '16px',
              background: '#f9f9f9',
              borderRadius: '0 0 6px 6px'
            }}>
              {renderServicosList(servicosOperacional, 'OPERACIONAL')}
            </div>
          </div>

          {/* Ferramentas */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              background: '#00225f', 
              color: 'white', 
              padding: '10px 14px', 
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '14px',
              marginBottom: 0
            }}>
              Ferramentas ({servicosFerramentas.length})
            </div>
            <div style={{ 
              padding: '16px',
              background: '#f9f9f9',
              borderRadius: '0 0 6px 6px'
            }}>
              {renderServicosList(servicosFerramentas, 'FERRAMENTAS')}
            </div>
          </div>

          {/* Gestão de Saúde */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              background: '#00225f', 
              color: 'white', 
              padding: '10px 14px', 
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '14px',
              marginBottom: 0
            }}>
              Gestão de Saúde ({servicosGestaoSaude.length})
            </div>
            <div style={{ 
              padding: '16px',
              background: '#f9f9f9',
              borderRadius: '0 0 6px 6px'
            }}>
              {renderServicosList(servicosGestaoSaude, 'GESTAO_SAUDE')}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar/Editar Serviço */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingId ? 'Editar Serviço' : 'Adicionar Serviço'}
        size="large"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="label">Categoria *</label>
            <select
              className="input"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
            >
              <option value="OPERACIONAL">Operacional</option>
              <option value="FERRAMENTAS">Ferramentas</option>
              <option value="GESTAO_SAUDE">Gestão de Saúde</option>
            </select>
          </div>

          <div>
            <label className="label">Nome do Serviço *</label>
            <input
              type="text"
              className="input"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome do serviço"
            />
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do serviço"
              rows={3}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label">Valor</label>
              <input
                type="number"
                className="input"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="CONCLUIDO">Concluído</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label">Data de Início</label>
              <input
                type="date"
                className="input"
                value={formData.dataInicio}
                onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Data de Fim</label>
              <input
                type="date"
                className="input"
                value={formData.dataFim}
                onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea
              className="input"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais"
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleCloseModal}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
            >
              <Save size={18} />
              {editingId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ServicosTab

