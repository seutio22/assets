import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Plus, Edit, Trash2, Upload, Table } from 'lucide-react'
import Modal from '../components/Modal'
import './Dados.css'

interface Modulo {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
}

interface ConfiguracaoCampo {
  id: string
  moduloId: string
  nome: string
  dados?: DadoDinamico[]
}

interface DadoDinamico {
  id: string
  configuracaoCampoId: string
  valor: string
  ordem: number
  ativo: boolean
}

const Dados = () => {
  const [activeTab, setActiveTab] = useState<'modulos' | 'configuracoes'>('modulos')
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoCampo[]>([])
  const [dados, setDados] = useState<DadoDinamico[]>([])
  const [selectedModulo, setSelectedModulo] = useState<string | null>(null)
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModuloModal, setShowModuloModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showDadosModal, setShowDadosModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingModulo, setEditingModulo] = useState<Modulo | null>(null)
  const [editingConfig, setEditingConfig] = useState<ConfiguracaoCampo | null>(null)
  const [editingDado, setEditingDado] = useState<DadoDinamico | null>(null)

  // Form states
  const [moduloForm, setModuloForm] = useState({ nome: '', descricao: '', ativo: true })
  const [configForm, setConfigForm] = useState({ moduloId: '', nome: '' })
  const [dadoForm, setDadoForm] = useState({ valor: '', ordem: 0, ativo: true })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [camposNovoModulo, setCamposNovoModulo] = useState<string[]>(['']) // Campos para cadastrar junto com o módulo

  useEffect(() => {
    fetchModulos()
  }, [])

  useEffect(() => {
    if (selectedModulo) {
      fetchConfiguracoes(selectedModulo)
    }
  }, [selectedModulo])

  useEffect(() => {
    if (selectedConfig) {
      fetchDados(selectedConfig)
    }
  }, [selectedConfig])

  // Debug: monitorar mudanças no estado do modal
  useEffect(() => {
    if (showConfigModal) {
      console.log('Modal de configuração aberto')
      console.log('selectedModulo:', selectedModulo)
      console.log('configForm:', configForm)
    }
  }, [showConfigModal, selectedModulo, configForm])

  const fetchModulos = async () => {
    try {
      // Usar cache estrutural para módulos
      const { fetchModulos: fetchModulosCached } = await import('../services/structuralData')
      const modulosCached = await fetchModulosCached()
      setModulos(modulosCached as any)
    } catch (error) {
      console.error('Erro ao carregar módulos:', error)
      // Fallback: buscar direto da API se cache falhar
      try {
        const response = await api.get('/modulos')
        setModulos(response.data.data || [])
      } catch (fallbackError) {
        console.error('Erro ao carregar módulos (fallback):', fallbackError)
        setModulos([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchConfiguracoes = async (moduloId: string) => {
    try {
      // Usar cache estrutural para configurações
      const { fetchConfiguracoes: fetchConfiguracoesCached } = await import('../services/structuralData')
      const configsCached = await fetchConfiguracoesCached(moduloId)
      setConfiguracoes(configsCached as any)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      // Fallback: buscar direto da API
      try {
        const response = await api.get(`/configuracoes-campos?moduloId=${moduloId}`)
        setConfiguracoes(response.data.data || [])
      } catch (fallbackError) {
        console.error('Erro ao carregar configurações (fallback):', fallbackError)
        setConfiguracoes([])
      }
    }
  }

  const fetchDados = async (configuracaoCampoId: string) => {
    try {
      // Usar cache estrutural para dados dinâmicos
      const { fetchDadosDinamicos } = await import('../services/structuralData')
      const dadosCached = await fetchDadosDinamicos(configuracaoCampoId)
      setDados(dadosCached as any)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Fallback: buscar direto da API
      try {
        const response = await api.get(`/dados-dinamicos?configuracaoCampoId=${configuracaoCampoId}`)
        setDados(response.data.data || [])
      } catch (fallbackError) {
        console.error('Erro ao carregar dados (fallback):', fallbackError)
        setDados([])
      }
    }
  }

  const handleSaveModulo = async () => {
    try {
      let moduloId: string
      
      if (editingModulo) {
        const response = await api.put(`/modulos/${editingModulo.id}`, moduloForm)
        moduloId = editingModulo.id
      } else {
        const response = await api.post('/modulos', moduloForm)
        moduloId = response.data.id
        
        // Se houver campos para cadastrar, criar todos eles
        if (camposNovoModulo.length > 0 && camposNovoModulo.some(c => c.trim() !== '')) {
          const camposValidos = camposNovoModulo.filter(c => c.trim() !== '')
          
          // Criar todos os campos em paralelo
          await Promise.all(
            camposValidos.map(nomeCampo =>
              api.post('/configuracoes-campos', {
                moduloId: moduloId,
                nome: nomeCampo.trim()
              })
            )
          )
        }
      }
      
      setShowModuloModal(false)
      setEditingModulo(null)
      setModuloForm({ nome: '', descricao: '', ativo: true })
      setCamposNovoModulo([''])
      fetchModulos()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar módulo')
    }
  }

  const handleAddCampoNovoModulo = () => {
    setCamposNovoModulo([...camposNovoModulo, ''])
  }

  const handleRemoveCampoNovoModulo = (index: number) => {
    const novosCampos = camposNovoModulo.filter((_, i) => i !== index)
    if (novosCampos.length === 0) {
      setCamposNovoModulo([''])
    } else {
      setCamposNovoModulo(novosCampos)
    }
  }

  const handleChangeCampoNovoModulo = (index: number, value: string) => {
    const novosCampos = [...camposNovoModulo]
    novosCampos[index] = value
    setCamposNovoModulo(novosCampos)
  }

  const handleSaveConfig = async () => {
    try {
      // Validar se o módulo foi selecionado
      if (!configForm.moduloId || configForm.moduloId.trim() === '') {
        alert('Por favor, selecione um módulo')
        return
      }

      // Validar se o nome do campo foi preenchido
      if (!configForm.nome || configForm.nome.trim() === '') {
        alert('Por favor, informe o nome do campo')
        return
      }

      console.log('Salvando configuração:', configForm)

      if (editingConfig) {
        const response = await api.put(`/configuracoes-campos/${editingConfig.id}`, configForm)
        console.log('Configuração atualizada:', response.data)
      } else {
        const response = await api.post('/configuracoes-campos', configForm)
        console.log('Configuração criada:', response.data)
      }
      
      setShowConfigModal(false)
      setEditingConfig(null)
      setConfigForm({ moduloId: selectedModulo || '', nome: '' })
      
      if (selectedModulo) {
        await fetchConfiguracoes(selectedModulo)
      }
    } catch (error: any) {
      console.error('Erro completo ao salvar configuração:', error)
      console.error('Response:', error.response)
      
      let errorMessage = 'Erro ao salvar configuração'
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para criar/editar configurações. Apenas administradores podem fazer isso.'
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.details) {
        if (Array.isArray(error.response.data.details)) {
          errorMessage = error.response.data.details.map((d: any) => d.message || d).join(', ')
        } else {
          errorMessage = error.response.data.details
        }
      }
      
      alert(errorMessage)
    }
  }

  const handleSaveDado = async () => {
    try {
      if (editingDado) {
        await api.put(`/dados-dinamicos/${editingDado.id}`, {
          ...dadoForm,
          configuracaoCampoId: selectedConfig!
        })
      } else {
        await api.post('/dados-dinamicos', {
          ...dadoForm,
          configuracaoCampoId: selectedConfig!
        })
      }
      setShowDadosModal(false)
      setEditingDado(null)
      setDadoForm({ valor: '', ordem: 0, ativo: true })
      if (selectedConfig) {
        fetchDados(selectedConfig)
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar dado')
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !selectedConfig) {
      alert('Selecione um arquivo CSV')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('configuracaoCampoId', selectedConfig)

      await api.post('/dados-dinamicos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setShowUploadModal(false)
      setUploadFile(null)
      if (selectedConfig) {
        fetchDados(selectedConfig)
      }
      alert('Dados importados com sucesso!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao fazer upload')
    }
  }

  const handleDeleteModulo = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este módulo?')) return
    try {
      await api.delete(`/modulos/${id}`)
      fetchModulos()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir módulo')
    }
  }

  const handleDeleteConfig = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta configuração?')) return
    try {
      await api.delete(`/configuracoes-campos/${id}`)
      if (selectedModulo) {
        fetchConfiguracoes(selectedModulo)
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir configuração')
    }
  }

  const handleDeleteDado = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este dado?')) return
    try {
      await api.delete(`/dados-dinamicos/${id}`)
      if (selectedConfig) {
        fetchDados(selectedConfig)
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao excluir dado')
    }
  }

  const handleEditModulo = (modulo: Modulo) => {
    setEditingModulo(modulo)
    setModuloForm({
      nome: modulo.nome,
      descricao: modulo.descricao || '',
      ativo: modulo.ativo
    })
    setShowModuloModal(true)
  }

  const handleEditConfig = (config: ConfiguracaoCampo) => {
    setEditingConfig(config)
    setConfigForm({
      moduloId: config.moduloId,
      nome: config.nome
    })
    setShowConfigModal(true)
  }

  const handleOpenNewConfig = () => {
    console.log('handleOpenNewConfig chamado, selectedModulo:', selectedModulo)
    if (!selectedModulo) {
      alert('Por favor, selecione um módulo primeiro')
      return
    }
    console.log('Abrindo modal de nova configuração para módulo:', selectedModulo)
    setEditingConfig(null)
    setConfigForm({ moduloId: selectedModulo, nome: '' })
    setShowConfigModal(true)
    console.log('showConfigModal definido como true')
  }

  const handleEditDado = (dado: DadoDinamico) => {
    setEditingDado(dado)
    setDadoForm({
      valor: dado.valor,
      ordem: dado.ordem,
      ativo: dado.ativo
    })
    setShowDadosModal(true)
  }

  if (loading) {
    return <div className="dados-page">Carregando...</div>
  }

  return (
    <div className="dados-page">
      <div className="page-header">
        <h1>Configurações de Dados</h1>
        <p className="page-subtitle">Gerencie módulos, campos e dados dinamicamente</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'modulos' ? 'active' : ''}`}
          onClick={() => setActiveTab('modulos')}
        >
          Módulos
        </button>
        <button
          className={`tab ${activeTab === 'configuracoes' ? 'active' : ''}`}
          onClick={() => setActiveTab('configuracoes')}
        >
          Configurações de Campos
        </button>
      </div>

      {activeTab === 'modulos' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Módulos do Sistema</h2>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingModulo(null)
                setModuloForm({ nome: '', descricao: '', ativo: true })
                setCamposNovoModulo([''])
                setShowModuloModal(true)
              }}
            >
              <Plus size={20} />
              Novo Módulo
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {modulos.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px' }}>
                      Nenhum módulo encontrado
                    </td>
                  </tr>
                ) : (
                  modulos.map((modulo) => (
                    <tr key={modulo.id}>
                      <td>{modulo.nome}</td>
                      <td>{modulo.descricao || '-'}</td>
                      <td>
                        <span className={`status-badge ${modulo.ativo ? 'status-active' : 'status-inactive'}`}>
                          {modulo.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => handleEditModulo(modulo)}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDeleteModulo(modulo.id)}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'configuracoes' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Configurações de Campos</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={selectedModulo || ''}
                onChange={(e) => {
                  setSelectedModulo(e.target.value || null)
                  setSelectedConfig(null)
                  setDados([])
                }}
                className="form-select"
                style={{ minWidth: '200px' }}
              >
                <option value="">Selecione um módulo</option>
                {modulos.filter(m => m.ativo).map((modulo) => (
                  <option key={modulo.id} value={modulo.id}>
                    {modulo.nome}
                  </option>
                ))}
              </select>
              {selectedModulo && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleOpenNewConfig()
                  }}
                >
                  <Plus size={20} />
                  Nova Configuração
                </button>
              )}
            </div>
          </div>

          {!selectedModulo ? (
            <div className="empty-state">
              <Table size={48} />
              <p>Selecione um módulo para ver suas configurações</p>
            </div>
          ) : (
            <>
              <div className="table-container" style={{ marginBottom: '24px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nome do Campo</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configuracoes.length === 0 ? (
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'center', padding: '32px' }}>
                          Nenhuma configuração encontrada
                        </td>
                      </tr>
                    ) : (
                      configuracoes.map((config) => (
                        <tr key={config.id}>
                          <td>{config.nome}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-icon"
                                onClick={() => {
                                  setSelectedConfig(config.id)
                                  fetchDados(config.id)
                                }}
                                title="Ver Dados"
                              >
                                <Table size={16} />
                              </button>
                              <button
                                className="btn-icon"
                                onClick={() => handleEditConfig(config)}
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="btn-icon"
                                onClick={() => handleDeleteConfig(config.id)}
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {selectedConfig && (
                <div className="dados-section">
                  <div className="section-header">
                    <h3>Dados - {configuracoes.find(c => c.id === selectedConfig)?.nome}</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setUploadFile(null)
                          setShowUploadModal(true)
                        }}
                      >
                        <Upload size={16} />
                        Upload CSV
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setEditingDado(null)
                          setDadoForm({ valor: '', ordem: dados.length, ativo: true })
                          setShowDadosModal(true)
                        }}
                      >
                        <Plus size={16} />
                        Adicionar Dado
                      </button>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Valor</th>
                          <th>Ordem</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '32px' }}>
                              Nenhum dado encontrado
                            </td>
                          </tr>
                        ) : (
                          dados.map((dado) => (
                            <tr key={dado.id}>
                              <td>{dado.valor}</td>
                              <td>{dado.ordem}</td>
                              <td>
                                <span className={`status-badge ${dado.ativo ? 'status-active' : 'status-inactive'}`}>
                                  {dado.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn-icon"
                                    onClick={() => handleEditDado(dado)}
                                    title="Editar"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    className="btn-icon"
                                    onClick={() => handleDeleteDado(dado.id)}
                                    title="Excluir"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal de Módulo */}
      <Modal
        isOpen={showModuloModal}
        onClose={() => {
          setShowModuloModal(false)
          setEditingModulo(null)
          setModuloForm({ nome: '', descricao: '', ativo: true })
          setCamposNovoModulo([''])
        }}
        title={editingModulo ? 'Editar Módulo' : 'Novo Módulo'}
        size="large"
      >
        <div className="form-group">
          <label>Nome *</label>
          <input
            type="text"
            value={moduloForm.nome}
            onChange={(e) => setModuloForm({ ...moduloForm, nome: e.target.value })}
            className="form-input"
            placeholder="Ex: Apólice, Fornecedor"
          />
        </div>
        <div className="form-group">
          <label>Descrição</label>
          <textarea
            value={moduloForm.descricao}
            onChange={(e) => setModuloForm({ ...moduloForm, descricao: e.target.value })}
            className="form-input"
            rows={3}
            placeholder="Descrição do módulo"
          />
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={moduloForm.ativo}
              onChange={(e) => setModuloForm({ ...moduloForm, ativo: e.target.checked })}
            />
            Ativo
          </label>
        </div>

        {!editingModulo && (
          <div className="form-group" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ margin: 0, fontWeight: 'bold' }}>Campos do Módulo (Opcional)</label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddCampoNovoModulo}
                style={{ padding: '6px 12px', fontSize: '14px' }}
              >
                <Plus size={16} style={{ marginRight: '4px' }} />
                Adicionar Campo
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
              Você pode cadastrar os campos agora ou adicioná-los depois. Deixe em branco os campos que não deseja criar.
            </p>
            {camposNovoModulo.map((campo, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={campo}
                  onChange={(e) => handleChangeCampoNovoModulo(index, e.target.value)}
                  className="form-input"
                  placeholder={`Nome do campo ${index + 1} (ex: produto, status)`}
                  style={{ flex: 1 }}
                />
                {camposNovoModulo.length > 1 && (
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleRemoveCampoNovoModulo(index)}
                    style={{ padding: '8px' }}
                    title="Remover campo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowModuloModal(false)
              setEditingModulo(null)
              setModuloForm({ nome: '', descricao: '', ativo: true })
              setCamposNovoModulo([''])
            }}
          >
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSaveModulo}>
            Salvar
          </button>
        </div>
      </Modal>

      {/* Modal de Configuração */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => {
          console.log('Fechando modal de configuração')
          setShowConfigModal(false)
          setEditingConfig(null)
          setConfigForm({ moduloId: selectedModulo || '', nome: '' })
        }}
        title={editingConfig ? 'Editar Configuração' : 'Nova Configuração'}
      >
        <div className="form-group">
          <label>Módulo *</label>
          <select
            value={configForm.moduloId}
            onChange={(e) => setConfigForm({ ...configForm, moduloId: e.target.value })}
            className="form-select"
            disabled={!!editingConfig}
            required
          >
            <option value="">Selecione um módulo</option>
            {modulos.filter(m => m.ativo).map((modulo) => (
              <option key={modulo.id} value={modulo.id}>
                {modulo.nome}
              </option>
            ))}
          </select>
          {!editingConfig && selectedModulo && configForm.moduloId !== selectedModulo && (
            <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
              O módulo selecionado acima será usado. Você pode alterar se necessário.
            </small>
          )}
        </div>
        <div className="form-group">
          <label>Nome do Campo *</label>
          <input
            type="text"
            value={configForm.nome}
            onChange={(e) => setConfigForm({ ...configForm, nome: e.target.value })}
            className="form-input"
            placeholder="Ex: produto, status, tipoContrato"
            required
          />
          <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
            Digite apenas o nome do campo (sem espaços ou caracteres especiais)
          </small>
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowConfigModal(false)
              setEditingConfig(null)
              setConfigForm({ moduloId: selectedModulo || '', nome: '' })
            }}
          >
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSaveConfig}>
            Salvar
          </button>
        </div>
      </Modal>

      {/* Modal de Dado */}
      <Modal
        isOpen={showDadosModal}
        onClose={() => {
          setShowDadosModal(false)
          setEditingDado(null)
          setDadoForm({ valor: '', ordem: 0, ativo: true })
        }}
        title={editingDado ? 'Editar Dado' : 'Novo Dado'}
      >
        <div className="form-group">
          <label>Valor *</label>
          <input
            type="text"
            value={dadoForm.valor}
            onChange={(e) => setDadoForm({ ...dadoForm, valor: e.target.value })}
            className="form-input"
            placeholder="Valor do dado"
          />
        </div>
        <div className="form-group">
          <label>Ordem</label>
          <input
            type="number"
            value={dadoForm.ordem}
            onChange={(e) => setDadoForm({ ...dadoForm, ordem: parseInt(e.target.value) || 0 })}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={dadoForm.ativo}
              onChange={(e) => setDadoForm({ ...dadoForm, ativo: e.target.checked })}
            />
            Ativo
          </label>
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowDadosModal(false)
              setEditingDado(null)
              setDadoForm({ valor: '', ordem: 0, ativo: true })
            }}
          >
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSaveDado}>
            Salvar
          </button>
        </div>
      </Modal>

      {/* Modal de Upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false)
          setUploadFile(null)
        }}
        title="Upload de Dados (CSV)"
      >
        <div className="form-group">
          <label>Arquivo CSV *</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="form-input"
          />
          <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
            O arquivo CSV deve conter uma coluna com os valores a serem importados.
          </small>
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowUploadModal(false)
              setUploadFile(null)
            }}
          >
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!uploadFile}>
            <Upload size={16} />
            Fazer Upload
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Dados
