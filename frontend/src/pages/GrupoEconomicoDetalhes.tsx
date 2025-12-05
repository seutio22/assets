import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Building2, ArrowLeft, User, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
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
  contatos?: Contato[]
  enderecos?: Endereco[]
  contatosCount?: number
  enderecosCount?: number
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
  
  // Estado para controlar expansão de contatos e endereços por empresa
  // Formato: { empresaId: { contatos: boolean, enderecos: boolean } }
  const [expandedSections, setExpandedSections] = useState<Record<string, { contatos: boolean; enderecos: boolean }>>({})
  const [loadingSections, setLoadingSections] = useState<Record<string, { contatos: boolean; enderecos: boolean }>>({})
  const [loadedSections, setLoadedSections] = useState<Record<string, { contatos: boolean; enderecos: boolean }>>({})
  
  const toggleSection = async (empresaId: string, section: 'contatos' | 'enderecos') => {
    const isCurrentlyExpanded = expandedSections[empresaId]?.[section]
    
    // Se está fechando, apenas fechar
    if (isCurrentlyExpanded) {
      setExpandedSections(prev => ({
        ...prev,
        [empresaId]: {
          ...prev[empresaId],
          [section]: false
        }
      }))
      return
    }
    
    // Se está abrindo, verificar se precisa carregar dados
    const alreadyLoaded = loadedSections[empresaId]?.[section]
    
    if (!alreadyLoaded) {
      // Marcar como carregando
      setLoadingSections(prev => ({
        ...prev,
        [empresaId]: {
          ...prev[empresaId],
          [section]: true
        }
      }))
      
      try {
        let data: Contato[] | Endereco[] = []
        if (section === 'contatos') {
          const response = await api.get(`/contatos?empresaId=${empresaId}`)
          data = response.data.data || []
        } else {
          const response = await api.get(`/enderecos?empresaId=${empresaId}`)
          data = response.data.data || []
        }
        
        // Atualizar empresa com os dados carregados
        setEmpresas(prev => prev.map(emp => {
          if (emp.id === empresaId) {
            return {
              ...emp,
              [section]: data
            }
          }
          return emp
        }))
        
        // Marcar como carregado
        setLoadedSections(prev => ({
          ...prev,
          [empresaId]: {
            ...prev[empresaId],
            [section]: true
          }
        }))
      } catch (error) {
        console.error(`Erro ao carregar ${section}:`, error)
      } finally {
        setLoadingSections(prev => ({
          ...prev,
          [empresaId]: {
            ...prev[empresaId],
            [section]: false
          }
        }))
      }
    }
    
    // Expandir a seção
    setExpandedSections(prev => ({
      ...prev,
      [empresaId]: {
        ...prev[empresaId],
        [section]: true
      }
    }))
  }

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
      
      // Carregar APENAS dados básicos da empresa (não contatos/endereços)
      const empresasBasicas = empresasData.map((empresa: any) => ({
        ...empresa,
        contatos: [], // Array vazio - será carregado quando expandir
        enderecos: [] // Array vazio - será carregado quando expandir
      }))
      
      setEmpresas(empresasBasicas)
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

  const handleDeleteContato = async (contatoId: string, empresaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este contato?')) {
      return
    }

    try {
      await api.delete(`/contatos/${contatoId}`)
      // Recarregar apenas os contatos desta empresa se estiver expandido
      if (expandedSections[empresaId]?.contatos) {
        const response = await api.get(`/contatos?empresaId=${empresaId}`)
        setEmpresas(prev => prev.map(emp => {
          if (emp.id === empresaId) {
            return { ...emp, contatos: response.data.data || [] }
          }
          return emp
        }))
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir contato')
    }
  }

  const handleDeleteEndereco = async (enderecoId: string, empresaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este endereço?')) {
      return
    }

    try {
      await api.delete(`/enderecos/${enderecoId}`)
      // Recarregar apenas os endereços desta empresa se estiver expandido
      if (expandedSections[empresaId]?.enderecos) {
        const response = await api.get(`/enderecos?empresaId=${empresaId}`)
        setEmpresas(prev => prev.map(emp => {
          if (emp.id === empresaId) {
            return { ...emp, enderecos: response.data.data || [] }
          }
          return emp
        }))
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir endereço')
    }
  }

  const handleEmpresaSuccess = () => {
    setShowEmpresaModal(false)
    setEditingEmpresaId(null)
    fetchEmpresas()
  }

  const handleContatoSuccess = async () => {
    setShowContatoModal(false)
    setEditingContatoId(null)
    const empresaId = selectedEmpresaId
    setSelectedEmpresaId(null)
    
    // Recarregar apenas os contatos da empresa específica se estiver expandido
    if (empresaId && expandedSections[empresaId]?.contatos) {
      try {
        const response = await api.get(`/contatos?empresaId=${empresaId}`)
        setEmpresas(prev => prev.map(emp => {
          if (emp.id === empresaId) {
            return { ...emp, contatos: response.data.data || [] }
          }
          return emp
        }))
      } catch (error) {
        console.error('Erro ao recarregar contatos:', error)
      }
    } else if (empresaId) {
      // Se não está expandido, marcar como não carregado para carregar na próxima vez
      setLoadedSections(prev => ({
        ...prev,
        [empresaId]: {
          ...prev[empresaId],
          contatos: false
        }
      }))
    }
  }

  const handleEnderecoSuccess = async () => {
    setShowEnderecoModal(false)
    setEditingEnderecoId(null)
    const empresaId = selectedEmpresaId
    setSelectedEmpresaId(null)
    
    // Recarregar apenas os endereços da empresa específica se estiver expandido
    if (empresaId && expandedSections[empresaId]?.enderecos) {
      try {
        const response = await api.get(`/enderecos?empresaId=${empresaId}`)
        setEmpresas(prev => prev.map(emp => {
          if (emp.id === empresaId) {
            return { ...emp, enderecos: response.data.data || [] }
          }
          return emp
        }))
      } catch (error) {
        console.error('Erro ao recarregar endereços:', error)
      }
    } else if (empresaId) {
      // Se não está expandido, marcar como não carregado para carregar na próxima vez
      setLoadedSections(prev => ({
        ...prev,
        [empresaId]: {
          ...prev[empresaId],
          enderecos: false
        }
      }))
    }
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
                      <button
                        className="section-toggle"
                        onClick={() => toggleSection(empresa.id, 'contatos')}
                      >
                        <User size={20} />
                        <h4>Contatos {empresa.contatos && empresa.contatos.length > 0 && `(${empresa.contatos.length})`}</h4>
                        {loadingSections[empresa.id]?.contatos ? (
                          <span style={{ fontSize: '12px' }}>Carregando...</span>
                        ) : expandedSections[empresa.id]?.contatos ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                      <button 
                        className="btn-link-small"
                        onClick={() => openNewContato(empresa.id)}
                      >
                        <Plus size={16} />
                        Adicionar
                      </button>
                    </div>
                    {expandedSections[empresa.id]?.contatos && (
                      <div className="section-content">
                        {loadingSections[empresa.id]?.contatos ? (
                          <p className="empty-subsection">Carregando contatos...</p>
                        ) : !empresa.contatos || empresa.contatos.length === 0 ? (
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
                                        onClick={() => handleDeleteContato(contato.id, empresa.id)}
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

                  <div className="enderecos-section">
                    <div className="section-header">
                      <button
                        className="section-toggle"
                        onClick={() => toggleSection(empresa.id, 'enderecos')}
                      >
                        <MapPin size={20} />
                        <h4>Endereços {empresa.enderecos && empresa.enderecos.length > 0 && `(${empresa.enderecos.length})`}</h4>
                        {loadingSections[empresa.id]?.enderecos ? (
                          <span style={{ fontSize: '12px' }}>Carregando...</span>
                        ) : expandedSections[empresa.id]?.enderecos ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                      <button 
                        className="btn-link-small"
                        onClick={() => openNewEndereco(empresa.id)}
                      >
                        <Plus size={16} />
                        Adicionar
                      </button>
                    </div>
                    {expandedSections[empresa.id]?.enderecos && (
                      <div className="section-content">
                        {loadingSections[empresa.id]?.enderecos ? (
                          <p className="empty-subsection">Carregando endereços...</p>
                        ) : !empresa.enderecos || empresa.enderecos.length === 0 ? (
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
                                        onClick={() => handleDeleteEndereco(endereco.id, empresa.id)}
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

