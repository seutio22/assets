import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Edit, Trash2, ArrowLeft, Building2, User, MapPin, Save, FileText } from 'lucide-react'
import Modal from '../components/Modal'
import EnderecoFornecedorForm from '../components/EnderecoFornecedorForm'
import ContatoFornecedorForm from '../components/ContatoFornecedorForm'
import './FornecedorDetalhes.css'

interface Fornecedor {
  id: string
  tipo?: string
  cnpj?: string
  registroANS?: string
  razaoSocial: string
  nomeFantasia?: string
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  iof?: string
  tipoProduto?: string
  produtos?: string
  planosComReembolso?: string
  divulgacaoIndiceFinanceiro?: string
  vidasEmpresarialANS?: string
  custoMedioANS?: number
  compAtualizacaoANS?: string
  observacao?: string
  situacaoOperadora?: string
}

interface Endereco {
  id: string
  tipo: string
  cep?: string
  tipoLogradouro?: string
  logradouro: string
  semNumero?: boolean
  numero?: string
  complemento?: string
  bairro?: string
  uf: string
  cidade: string
  observacoes?: string
}

interface Contato {
  id: string
  nome: string
  cargo?: string
  email?: string
  telefone?: string
  ativo?: boolean
  observacoes?: string
}

const FornecedorDetalhes = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [enderecos, setEnderecos] = useState<Endereco[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEnderecoModal, setShowEnderecoModal] = useState(false)
  const [showContatoModal, setShowContatoModal] = useState(false)
  const [editingEnderecoId, setEditingEnderecoId] = useState<string | null>(null)
  const [editingContatoId, setEditingContatoId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dados' | 'enderecos' | 'contatos'>('dados')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Fornecedor>>({})

  useEffect(() => {
    if (id) {
      fetchFornecedor()
      fetchEnderecos()
      fetchContatos()
    }
  }, [id])

  const fetchFornecedor = async () => {
    try {
      const response = await api.get(`/fornecedores/${id}`)
      const data = response.data
      setFornecedor(data)
      setFormData(data)
    } catch (error) {
      console.error('Erro ao carregar fornecedor:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEnderecos = async () => {
    try {
      const response = await api.get(`/enderecos-fornecedores?fornecedorId=${id}`)
      setEnderecos(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar endereços:', error)
    }
  }

  const fetchContatos = async () => {
    try {
      const response = await api.get(`/contatos-fornecedores?fornecedorId=${id}`)
      setContatos(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.put(`/fornecedores/${id}`, formData)
      await fetchFornecedor()
      setIsEditing(false)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao salvar fornecedor')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEndereco = async (enderecoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este endereço?')) return
    try {
      await api.delete(`/enderecos-fornecedores/${enderecoId}`)
      fetchEnderecos()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir endereço')
    }
  }

  const handleDeleteContato = async (contatoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este contato?')) return
    try {
      await api.delete(`/contatos-fornecedores/${contatoId}`)
      fetchContatos()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir contato')
    }
  }

  if (loading) {
    return (
      <div className="fornecedor-detalhes-page">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  if (!fornecedor) {
    return (
      <div className="fornecedor-detalhes-page">
        <div className="error">Fornecedor não encontrado</div>
      </div>
    )
  }

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '-'
    const numbers = cnpj.toString().replace(/\D/g, '')
    if (numbers.length === 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    }
    return cnpj.toString()
  }

  return (
    <div className="fornecedor-detalhes-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/fornecedores')}>
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button className="btn btn-outline" onClick={() => {
                setIsEditing(false)
                setFormData(fornecedor)
              }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={20} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit size={20} />
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="fornecedor-header">
        <div className="fornecedor-title">
          <Building2 size={32} />
          <div>
            <h1>{fornecedor.razaoSocial}</h1>
            <p className="fornecedor-subtitle">
              {fornecedor.nomeFantasia || formatCNPJ(fornecedor.cnpj)}
            </p>
          </div>
        </div>
        {fornecedor.situacaoOperadora && (
          <div className={`status-badge status-${fornecedor.situacaoOperadora.toLowerCase().replace(/\s+/g, '-')}`}>
            {fornecedor.situacaoOperadora}
          </div>
        )}
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveTab('dados')}
        >
          Dados Básicos
        </button>
        <button 
          className={`tab ${activeTab === 'enderecos' ? 'active' : ''}`}
          onClick={() => setActiveTab('enderecos')}
        >
          Endereços
        </button>
        <button 
          className={`tab ${activeTab === 'contatos' ? 'active' : ''}`}
          onClick={() => setActiveTab('contatos')}
        >
          Contatos (Mailing)
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dados' && (
          <div className="form-section">
            <div className="section-title">Dados Básicos</div>
            <div className="form-grid">
              <div className="form-group">
                <label>CNPJ</label>
                {isEditing ? (
                  <input
                    name="cnpj"
                    type="text"
                    className="input"
                    value={formData.cnpj || ''}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{formatCNPJ(fornecedor.cnpj)}</div>
                )}
              </div>

              <div className="form-group">
                <label>Registro ANS</label>
                {isEditing ? (
                  <input
                    name="registroANS"
                    type="text"
                    className="input"
                    value={formData.registroANS || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.registroANS || '-'}</div>
                )}
              </div>

              <div className="form-group full-width">
                <label>Razão Social *</label>
                {isEditing ? (
                  <input
                    name="razaoSocial"
                    type="text"
                    className="input"
                    value={formData.razaoSocial || ''}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.razaoSocial}</div>
                )}
              </div>

              <div className="form-group">
                <label>Nome Fantasia</label>
                {isEditing ? (
                  <input
                    name="nomeFantasia"
                    type="text"
                    className="input"
                    value={formData.nomeFantasia || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.nomeFantasia || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Inscrição Estadual</label>
                {isEditing ? (
                  <input
                    name="inscricaoEstadual"
                    type="text"
                    className="input"
                    value={formData.inscricaoEstadual || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.inscricaoEstadual || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Inscrição Municipal</label>
                {isEditing ? (
                  <input
                    name="inscricaoMunicipal"
                    type="text"
                    className="input"
                    value={formData.inscricaoMunicipal || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.inscricaoMunicipal || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>IOF</label>
                {isEditing ? (
                  <input
                    name="iof"
                    type="text"
                    className="input"
                    value={formData.iof || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.iof || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Tipo de Produto</label>
                {isEditing ? (
                  <input
                    name="tipoProduto"
                    type="text"
                    className="input"
                    value={formData.tipoProduto || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.tipoProduto || '-'}</div>
                )}
              </div>

              <div className="form-group full-width">
                <label>Produtos</label>
                {isEditing ? (
                  <textarea
                    name="produtos"
                    className="input"
                    value={formData.produtos || ''}
                    onChange={handleChange}
                    rows={3}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.produtos || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Planos com Reembolso</label>
                {isEditing ? (
                  <input
                    name="planosComReembolso"
                    type="text"
                    className="input"
                    value={formData.planosComReembolso || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.planosComReembolso || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Divulgação do Índice Financeiro</label>
                {isEditing ? (
                  <input
                    name="divulgacaoIndiceFinanceiro"
                    type="text"
                    className="input"
                    value={formData.divulgacaoIndiceFinanceiro || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.divulgacaoIndiceFinanceiro || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Vidas do Empresarial na ANS</label>
                {isEditing ? (
                  <input
                    name="vidasEmpresarialANS"
                    type="text"
                    className="input"
                    value={formData.vidasEmpresarialANS || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.vidasEmpresarialANS || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Custo Médio ANS</label>
                {isEditing ? (
                  <input
                    name="custoMedioANS"
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.custoMedioANS || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.custoMedioANS ? fornecedor.custoMedioANS.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Comp. Atualização ANS</label>
                {isEditing ? (
                  <input
                    name="compAtualizacaoANS"
                    type="text"
                    className="input"
                    value={formData.compAtualizacaoANS || ''}
                    onChange={handleChange}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.compAtualizacaoANS || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Situação da Operadora</label>
                {isEditing ? (
                  <select
                    name="situacaoOperadora"
                    className="input"
                    value={formData.situacaoOperadora || 'ATIVA'}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="ATIVA">Ativa</option>
                    <option value="INATIVA">Inativa</option>
                    <option value="SUSPENSA">Suspensa</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                ) : (
                  <div className="field-value">{fornecedor.situacaoOperadora || '-'}</div>
                )}
              </div>

              <div className="form-group full-width">
                <label>Observação</label>
                {isEditing ? (
                  <textarea
                    name="observacao"
                    className="input"
                    value={formData.observacao || ''}
                    onChange={handleChange}
                    rows={4}
                    disabled={loading}
                  />
                ) : (
                  <div className="field-value">{fornecedor.observacao || '-'}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enderecos' && (
          <div className="form-section">
            <div className="section-header">
              <div className="section-title">Endereços</div>
              <button className="btn btn-primary" onClick={() => {
                setEditingEnderecoId(null)
                setShowEnderecoModal(true)
              }}>
                <Plus size={20} />
                Adicionar Endereço
              </button>
            </div>

          {enderecos.length === 0 ? (
            <div className="empty-state">
              <MapPin size={48} />
              <p>Nenhum endereço cadastrado</p>
            </div>
          ) : (
            <div className="enderecos-list">
              {enderecos.map((endereco) => (
                <div key={endereco.id} className="endereco-card">
                  <div className="card-header">
                    <div>
                      <span className="tipo-badge">{endereco.tipo}</span>
                      <h3>
                        {endereco.tipoLogradouro && `${endereco.tipoLogradouro} `}
                        {endereco.logradouro}
                        {endereco.numero && !endereco.semNumero && `, ${endereco.numero}`}
                        {endereco.complemento && ` - ${endereco.complemento}`}
                      </h3>
                      <p>{endereco.bairro && `${endereco.bairro}, `}{endereco.cidade}/{endereco.uf}</p>
                      {endereco.cep && <p>CEP: {endereco.cep}</p>}
                    </div>
                    <div className="card-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => {
                          setEditingEnderecoId(endereco.id)
                          setShowEnderecoModal(true)
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => handleDeleteEndereco(endereco.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}

        {activeTab === 'contatos' && (
          <div className="form-section">
            <div className="section-header">
              <div className="section-title">Contatos (Mailing)</div>
              <button className="btn btn-primary" onClick={() => {
                setEditingContatoId(null)
                setShowContatoModal(true)
              }}>
                <Plus size={20} />
                Adicionar Contato
              </button>
            </div>

          {contatos.length === 0 ? (
            <div className="empty-state">
              <User size={48} />
              <p>Nenhum contato cadastrado</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cargo</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {contatos.map((contato) => (
                  <tr key={contato.id}>
                    <td>{contato.nome}</td>
                    <td>{contato.cargo || '-'}</td>
                    <td>{contato.email || '-'}</td>
                    <td>{contato.telefone || '-'}</td>
                    <td>
                      <span className={`status-badge ${contato.ativo ? 'ativa' : 'inativa'}`}>
                        {contato.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon"
                          onClick={() => {
                            setEditingContatoId(contato.id)
                            setShowContatoModal(true)
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn-icon"
                          onClick={() => handleDeleteContato(contato.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showEnderecoModal}
        onClose={() => {
          setShowEnderecoModal(false)
          setEditingEnderecoId(null)
        }}
        title={editingEnderecoId ? 'Editar Endereço' : 'Novo Endereço'}
        size="large"
      >
        <EnderecoFornecedorForm
          enderecoId={editingEnderecoId || undefined}
          fornecedorId={id || undefined}
          onSuccess={() => {
            setShowEnderecoModal(false)
            setEditingEnderecoId(null)
            fetchEnderecos()
          }}
          onCancel={() => {
            setShowEnderecoModal(false)
            setEditingEnderecoId(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={showContatoModal}
        onClose={() => {
          setShowContatoModal(false)
          setEditingContatoId(null)
        }}
        title={editingContatoId ? 'Editar Contato' : 'Novo Contato'}
        size="medium"
      >
        <ContatoFornecedorForm
          contatoId={editingContatoId || undefined}
          fornecedorId={id || undefined}
          onSuccess={() => {
            setShowContatoModal(false)
            setEditingContatoId(null)
            fetchContatos()
          }}
          onCancel={() => {
            setShowContatoModal(false)
            setEditingContatoId(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default FornecedorDetalhes

