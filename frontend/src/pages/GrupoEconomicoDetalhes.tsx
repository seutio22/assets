import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Building2, ArrowLeft, User, MapPin } from 'lucide-react'
import Modal from '../components/Modal'
import EmpresaForm from '../components/EmpresaForm'
import ContatoForm from '../components/ContatoForm'
import EnderecoForm from '../components/EnderecoForm'
import './GrupoEconomicoDetalhes.css'

interface GrupoEconomico {
  id: string
  name: string
  createdAt: string
}

interface Empresa {
  id: string
  cnpj: string
  razaoSocial: string
  dataCadastro: string
  contatos: Contato[]
  enderecos: Endereco[]
}

interface Contato {
  id: string
  nome: string
  email?: string
  telefone?: string
  cargo?: string
  observacoes?: string
}

interface Endereco {
  id: string
  tipo: string
  logradouro: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade: string
  estado: string
  cep?: string
  observacoes?: string
}

const GrupoEconomicoDetalhes = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [grupo, setGrupo] = useState<GrupoEconomico | null>(null)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [showEmpresaModal, setShowEmpresaModal] = useState(false)
  const [showContatoModal, setShowContatoModal] = useState(false)
  const [showEnderecoModal, setShowEnderecoModal] = useState(false)
  const [editingEmpresaId, setEditingEmpresaId] = useState<string | null>(null)
  const [editingContatoId, setEditingContatoId] = useState<string | null>(null)
  const [editingEnderecoId, setEditingEnderecoId] = useState<string | null>(null)
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchGrupo()
      fetchEmpresas()
    }
  }, [id])

  const fetchGrupo = async () => {
    try {
      const response = await api.get(`/grupos-economicos/${id}`)
      setGrupo(response.data)
    } catch (error) {
      console.error('Erro ao carregar grupo:', error)
    }
  }

  const fetchEmpresas = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/empresas?grupoEconomicoId=${id}`)
      const empresasData = response.data.data || []
      
      // Carregar contatos e endereços para cada empresa
      const empresasCompleto = await Promise.all(
        empresasData.map(async (empresa: Empresa) => {
          const [contatosRes, enderecosRes] = await Promise.all([
            api.get(`/contatos?empresaId=${empresa.id}`),
            api.get(`/enderecos?empresaId=${empresa.id}`)
          ])
          return {
            ...empresa,
            contatos: contatosRes.data.data || [],
            enderecos: enderecosRes.data.data || []
          }
        })
      )
      
      setEmpresas(empresasCompleto)
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCNPJ = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, '')
    if (numbers.length === 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    }
    return cnpj
  }

  const handleDeleteEmpresa = async (empresaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      return
    }

    try {
      await api.delete(`/empresas/${empresaId}`)
      fetchEmpresas()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir empresa')
    }
  }

  const handleDeleteContato = async (contatoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este contato?')) {
      return
    }

    try {
      await api.delete(`/contatos/${contatoId}`)
      fetchEmpresas()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir contato')
    }
  }

  const handleDeleteEndereco = async (enderecoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este endereço?')) {
      return
    }

    try {
      await api.delete(`/enderecos/${enderecoId}`)
      fetchEmpresas()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir endereço')
    }
  }

  const handleEmpresaSuccess = () => {
    setShowEmpresaModal(false)
    setEditingEmpresaId(null)
    fetchEmpresas()
  }

  const handleContatoSuccess = () => {
    setShowContatoModal(false)
    setEditingContatoId(null)
    setSelectedEmpresaId(null)
    fetchEmpresas()
  }

  const handleEnderecoSuccess = () => {
    setShowEnderecoModal(false)
    setEditingEnderecoId(null)
    setSelectedEmpresaId(null)
    fetchEmpresas()
  }

  const openNewEmpresa = () => {
    setEditingEmpresaId(null)
    setShowEmpresaModal(true)
  }

  const openEditEmpresa = (empresaId: string) => {
    setEditingEmpresaId(empresaId)
    setShowEmpresaModal(true)
  }

  const openNewContato = (empresaId: string) => {
    setSelectedEmpresaId(empresaId)
    setEditingContatoId(null)
    setShowContatoModal(true)
  }

  const openEditContato = (contatoId: string, empresaId: string) => {
    setEditingContatoId(contatoId)
    setSelectedEmpresaId(empresaId)
    setShowContatoModal(true)
  }

  const openNewEndereco = (empresaId: string) => {
    setSelectedEmpresaId(empresaId)
    setEditingEnderecoId(null)
    setShowEnderecoModal(true)
  }

  const openEditEndereco = (enderecoId: string, empresaId: string) => {
    setEditingEnderecoId(enderecoId)
    setSelectedEmpresaId(empresaId)
    setShowEnderecoModal(true)
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="grupo-detalhes-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/clientes')}>
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div>
          <h1>{grupo?.name}</h1>
          <p className="grupo-subtitle">Cliente</p>
        </div>
        <button className="btn btn-primary" onClick={openNewEmpresa}>
          <Plus size={20} />
          Nova Empresa
        </button>
      </div>

      <div className="empresas-section">
        <h2>Empresas (CNPJs)</h2>
        {empresas.length === 0 ? (
          <div className="empty-state">
            <Building2 size={48} />
            <p>Nenhuma empresa cadastrada neste grupo</p>
            <button className="btn btn-primary" onClick={openNewEmpresa}>
              <Plus size={20} />
              Adicionar primeira empresa
            </button>
          </div>
        ) : (
          <div className="empresas-list">
            {empresas.map((empresa) => (
              <div key={empresa.id} className="empresa-card">
                <div className="empresa-header">
                  <div className="empresa-info">
                    <Building2 size={24} />
                    <div>
                      <h3>{empresa.razaoSocial}</h3>
                      <p className="empresa-cnpj">CNPJ: {formatCNPJ(empresa.cnpj)}</p>
                      <p className="empresa-data">Cadastrado em: {formatDate(empresa.dataCadastro)}</p>
                    </div>
                  </div>
                  <div className="empresa-actions">
                    <button 
                      className="btn-icon" 
                      title="Editar Empresa"
                      onClick={() => openEditEmpresa(empresa.id)}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="btn-icon" 
                      title="Excluir Empresa"
                      onClick={() => handleDeleteEmpresa(empresa.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="empresa-details">
                  <div className="contatos-section">
                    <div className="section-header">
                      <User size={20} />
                      <h4>Contatos</h4>
                      <button 
                        className="btn-link-small"
                        onClick={() => openNewContato(empresa.id)}
                      >
                        <Plus size={16} />
                        Adicionar
                      </button>
                    </div>
                    {empresa.contatos.length === 0 ? (
                      <p className="empty-subsection">Nenhum contato cadastrado</p>
                    ) : (
                      <table className="sub-table">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Cargo</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {empresa.contatos.map((contato) => (
                            <tr key={contato.id}>
                              <td>{contato.nome}</td>
                              <td>{contato.email || '-'}</td>
                              <td>{contato.telefone || '-'}</td>
                              <td>{contato.cargo || '-'}</td>
                              <td>
                                <div className="action-buttons">
                                  <button 
                                    className="btn-icon-small"
                                    onClick={() => openEditContato(contato.id, empresa.id)}
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button 
                                    className="btn-icon-small"
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

                  <div className="enderecos-section">
                    <div className="section-header">
                      <MapPin size={20} />
                      <h4>Endereços</h4>
                      <button 
                        className="btn-link-small"
                        onClick={() => openNewEndereco(empresa.id)}
                      >
                        <Plus size={16} />
                        Adicionar
                      </button>
                    </div>
                    {empresa.enderecos.length === 0 ? (
                      <p className="empty-subsection">Nenhum endereço cadastrado</p>
                    ) : (
                      <table className="sub-table">
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Endereço</th>
                            <th>Cidade/UF</th>
                            <th>CEP</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {empresa.enderecos.map((endereco) => (
                            <tr key={endereco.id}>
                              <td>
                                <span className="tipo-badge">{endereco.tipo}</span>
                              </td>
                              <td>
                                {endereco.logradouro}
                                {endereco.numero && `, ${endereco.numero}`}
                                {endereco.complemento && ` - ${endereco.complemento}`}
                                {endereco.bairro && `, ${endereco.bairro}`}
                              </td>
                              <td>{endereco.cidade}/{endereco.estado}</td>
                              <td>{endereco.cep || '-'}</td>
                              <td>
                                <div className="action-buttons">
                                  <button 
                                    className="btn-icon-small"
                                    onClick={() => openEditEndereco(endereco.id, empresa.id)}
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button 
                                    className="btn-icon-small"
                                    onClick={() => handleDeleteEndereco(endereco.id)}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showEmpresaModal}
        onClose={() => {
          setShowEmpresaModal(false)
          setEditingEmpresaId(null)
        }}
        title={editingEmpresaId ? 'Editar Empresa' : 'Nova Empresa'}
        size="large"
      >
        <EmpresaForm
          empresaId={editingEmpresaId || undefined}
          grupoEconomicoId={id || undefined}
          onSuccess={handleEmpresaSuccess}
          onCancel={() => {
            setShowEmpresaModal(false)
            setEditingEmpresaId(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={showContatoModal}
        onClose={() => {
          setShowContatoModal(false)
          setEditingContatoId(null)
          setSelectedEmpresaId(null)
        }}
        title={editingContatoId ? 'Editar Contato' : 'Novo Contato'}
        size="medium"
      >
        <ContatoForm
          contatoId={editingContatoId || undefined}
          empresaId={selectedEmpresaId || undefined}
          onSuccess={handleContatoSuccess}
          onCancel={() => {
            setShowContatoModal(false)
            setEditingContatoId(null)
            setSelectedEmpresaId(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={showEnderecoModal}
        onClose={() => {
          setShowEnderecoModal(false)
          setEditingEnderecoId(null)
          setSelectedEmpresaId(null)
        }}
        title={editingEnderecoId ? 'Editar Endereço' : 'Novo Endereço'}
        size="medium"
      >
        <EnderecoForm
          enderecoId={editingEnderecoId || undefined}
          empresaId={selectedEmpresaId || undefined}
          onSuccess={handleEnderecoSuccess}
          onCancel={() => {
            setShowEnderecoModal(false)
            setEditingEnderecoId(null)
            setSelectedEmpresaId(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default GrupoEconomicoDetalhes

