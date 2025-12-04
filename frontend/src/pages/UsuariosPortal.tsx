import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Search, Eye, Edit, Trash2, Key, CheckCircle, XCircle, Building2, FileText } from 'lucide-react'
import Modal from '../components/Modal'
import MultiSelectSearch from '../components/MultiSelectSearch'
import './UsuariosPortal.css'

interface UsuarioCliente {
  id: string
  nome: string
  email: string
  cargo?: string
  telefone?: string
  ativo: boolean
  ultimoAcesso?: string
  criadoPor?: {
    id: string
    name: string
  }
  apolices: Array<{
    id: string
    apolice: {
      id: string
      numero: string
      empresa: {
        razaoSocial: string
        cnpj: string
      }
    }
  }>
  subEstipulantes: Array<{
    id: string
    subEstipulante: {
      id: string
      codigoEstipulante: string
      razaoSocial: string
      apolice: {
        numero: string
      }
    }
  }>
  _count?: {
    solicitacoesAtendimento: number
  }
}

interface Apolice {
  id: string
  numero: string
  empresa: {
    razaoSocial: string
    cnpj: string
  }
}

interface SubEstipulante {
  id: string
  codigoEstipulante: string
  razaoSocial: string
  apolice: {
    numero: string
    empresa: {
      razaoSocial: string
    }
  }
}

const UsuariosPortal = () => {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState<UsuarioCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  
  // Dados para formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    cargo: '',
    telefone: '',
    ativo: true,
    apoliceIds: [] as string[],
    subEstipulanteIds: [] as string[]
  })
  
  // Dados para seleção com paginação
  const [apolices, setApolices] = useState<Apolice[]>([])
  const [subEstipulantes, setSubEstipulantes] = useState<SubEstipulante[]>([])
  const [loadingApolices, setLoadingApolices] = useState(false)
  const [loadingSubEstipulantes, setLoadingSubEstipulantes] = useState(false)
  const [apolicesPage, setApolicesPage] = useState(1)
  const [subEstipulantesPage, setSubEstipulantesPage] = useState(1)
  const [apolicesHasMore, setApolicesHasMore] = useState(true)
  const [subEstipulantesHasMore, setSubEstipulantesHasMore] = useState(true)
  const [apolicesSearchTerm, setApolicesSearchTerm] = useState('')
  const [subEstipulantesSearchTerm, setSubEstipulantesSearchTerm] = useState('')

  useEffect(() => {
    fetchUsuarios()
  }, [statusFilter])

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) {
        params.append('ativo', statusFilter === 'ativo' ? 'true' : 'false')
      }
      params.append('limit', '100')
      
      const response = await api.get(`/usuarios-cliente?${params.toString()}`)
      const usuariosData = response.data.data || []
      
      // Filtrar por busca local se necessário
      let filtered = usuariosData
      if (search.trim()) {
        filtered = usuariosData.filter((u: UsuarioCliente) => 
          u.nome.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.cargo?.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      setUsuarios(filtered)
    } catch (error: any) {
      console.error('Erro ao carregar usuários do portal:', error)
      alert(`Erro ao carregar usuários: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchApolices = async (searchTerm: string = '', page: number = 1, append: boolean = false) => {
    try {
      setLoadingApolices(true)
      const params = new URLSearchParams()
      if (searchTerm && searchTerm.trim().length >= 2) {
        params.append('search', searchTerm.trim())
      }
      params.append('limit', '50')
      params.append('page', page.toString())
      
      const response = await api.get(`/apolices?${params.toString()}`)
      const newApolices = response.data.data || []
      
      // Garantir que temos empresa nos dados
      const apolicesComEmpresa = newApolices.map((apolice: any) => ({
        ...apolice,
        empresa: apolice.empresa || { razaoSocial: 'N/A', cnpj: '' }
      }))
      
      if (append) {
        // Evitar duplicatas
        const existingIds = new Set(apolices.map(a => a.id))
        const uniqueNew = apolicesComEmpresa.filter((a: any) => !existingIds.has(a.id))
        setApolices(prev => [...prev, ...uniqueNew])
      } else {
        setApolices(apolicesComEmpresa)
      }
      
      // Verificar se há mais páginas
      const pagination = response.data.pagination
      setApolicesHasMore(pagination ? pagination.page < pagination.totalPages : newApolices.length === 50)
    } catch (error: any) {
      console.error('Erro ao carregar apólices:', error)
      if (!append) {
        setApolices([])
      }
    } finally {
      setLoadingApolices(false)
    }
  }

  const fetchSubEstipulantes = async (searchTerm: string = '', page: number = 1, append: boolean = false) => {
    try {
      setLoadingSubEstipulantes(true)
      const params = new URLSearchParams()
      if (searchTerm && searchTerm.trim().length >= 2) {
        params.append('search', searchTerm.trim())
      }
      params.append('limit', '50')
      params.append('page', page.toString())
      
      const response = await api.get(`/sub-estipulantes?${params.toString()}`)
      const newSubEstipulantes = response.data.data || []
      
      // Garantir que temos apólice nos dados
      const subEstipulantesComApolice = newSubEstipulantes.map((sub: any) => ({
        ...sub,
        apolice: sub.apolice || { numero: 'N/A' }
      }))
      
      if (append) {
        // Evitar duplicatas
        const existingIds = new Set(subEstipulantes.map(s => s.id))
        const uniqueNew = subEstipulantesComApolice.filter((s: any) => !existingIds.has(s.id))
        setSubEstipulantes(prev => [...prev, ...uniqueNew])
      } else {
        setSubEstipulantes(subEstipulantesComApolice)
      }
      
      // Verificar se há mais páginas
      const pagination = response.data.pagination
      setSubEstipulantesHasMore(pagination ? pagination.page < pagination.totalPages : newSubEstipulantes.length === 50)
    } catch (error: any) {
      console.error('Erro ao carregar sub-estipulantes:', error)
      if (!append) {
        setSubEstipulantes([])
      }
    } finally {
      setLoadingSubEstipulantes(false)
    }
  }

  const handleApolicesSearch = (searchTerm: string) => {
    setApolicesSearchTerm(searchTerm)
    setApolicesPage(1)
    fetchApolices(searchTerm, 1, false)
  }

  const handleApolicesLoadMore = () => {
    const nextPage = apolicesPage + 1
    setApolicesPage(nextPage)
    fetchApolices(apolicesSearchTerm, nextPage, true)
  }

  const handleSubEstipulantesSearch = (searchTerm: string) => {
    setSubEstipulantesSearchTerm(searchTerm)
    setSubEstipulantesPage(1)
    fetchSubEstipulantes(searchTerm, 1, false)
  }

  const handleSubEstipulantesLoadMore = () => {
    const nextPage = subEstipulantesPage + 1
    setSubEstipulantesPage(nextPage)
    fetchSubEstipulantes(subEstipulantesSearchTerm, nextPage, true)
  }

  const openNew = () => {
    setEditingId(null)
    setFormData({
      nome: '',
      email: '',
      senha: '',
      cargo: '',
      telefone: '',
      ativo: true,
      apoliceIds: [],
      subEstipulanteIds: []
    })
    setApolicesPage(1)
    setSubEstipulantesPage(1)
    setApolicesSearchTerm('')
    setSubEstipulantesSearchTerm('')
    fetchApolices('', 1, false)
    fetchSubEstipulantes('', 1, false)
    setShowModal(true)
  }

  const openEdit = async (id: string) => {
    try {
      setEditingId(id)
      const response = await api.get(`/usuarios-cliente/${id}`)
      const usuario = response.data
      
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        senha: '', // Não mostrar senha
        cargo: usuario.cargo || '',
        telefone: usuario.telefone || '',
        ativo: usuario.ativo,
        apoliceIds: usuario.apolices.map((a: any) => a.apoliceId),
        subEstipulanteIds: usuario.subEstipulantes.map((s: any) => s.subEstipulanteId)
      })
      
      setApolicesPage(1)
      setSubEstipulantesPage(1)
      setApolicesSearchTerm('')
      setSubEstipulantesSearchTerm('')
      await Promise.all([fetchApolices('', 1, false), fetchSubEstipulantes('', 1, false)])
      setShowModal(true)
    } catch (error: any) {
      console.error('Erro ao carregar usuário:', error)
      alert(`Erro ao carregar usuário: ${error.response?.data?.error || error.message}`)
    }
  }

  const openView = async (id: string) => {
    setViewingId(id)
    navigate(`/usuarios-portal/${id}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { senha, ...dataToSend } = formData
      
      if (editingId) {
        // Atualizar
        await api.put(`/usuarios-cliente/${editingId}`, {
          nome: formData.nome,
          email: formData.email,
          cargo: formData.cargo || null,
          telefone: formData.telefone || null,
          ativo: formData.ativo
        })
        
        // Atualizar vínculos de apólices
        const currentResponse = await api.get(`/usuarios-cliente/${editingId}`)
        const currentApoliceIds = currentResponse.data.apolices.map((a: any) => a.apoliceId)
        const currentSubIds = currentResponse.data.subEstipulantes.map((s: any) => s.subEstipulanteId)
        
        // Remover apólices não selecionadas
        const toRemoveApolices = currentApoliceIds.filter((id: string) => !formData.apoliceIds.includes(id))
        for (const apoliceId of toRemoveApolices) {
          await api.delete(`/usuarios-cliente/${editingId}/apolices/${apoliceId}`)
        }
        
        // Adicionar novas apólices
        const toAddApolices = formData.apoliceIds.filter((id: string) => !currentApoliceIds.includes(id))
        if (toAddApolices.length > 0) {
          await api.post(`/usuarios-cliente/${editingId}/apolices`, {
            apoliceIds: toAddApolices
          })
        }
        
        // Remover sub-estipulantes não selecionados
        const toRemoveSubs = currentSubIds.filter((id: string) => !formData.subEstipulanteIds.includes(id))
        for (const subId of toRemoveSubs) {
          await api.delete(`/usuarios-cliente/${editingId}/sub-estipulantes/${subId}`)
        }
        
        // Adicionar novos sub-estipulantes
        const toAddSubs = formData.subEstipulanteIds.filter((id: string) => !currentSubIds.includes(id))
        if (toAddSubs.length > 0) {
          await api.post(`/usuarios-cliente/${editingId}/sub-estipulantes`, {
            subEstipulanteIds: toAddSubs
          })
        }
      } else {
        // Criar
        if (!formData.senha) {
          alert('Senha é obrigatória para novos usuários')
          return
        }
        
        const response = await api.post('/usuarios-cliente', {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          cargo: formData.cargo || null,
          telefone: formData.telefone || null,
          apoliceIds: formData.apoliceIds.length > 0 ? formData.apoliceIds : undefined,
          subEstipulanteIds: formData.subEstipulanteIds.length > 0 ? formData.subEstipulanteIds : undefined
        })
        
        console.log('Usuário criado:', response.data)
      }
      
      setShowModal(false)
      setEditingId(null)
      fetchUsuarios()
      alert(editingId ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error)
      alert(`Erro ao salvar: ${error.response?.data?.error || error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja desativar este usuário?')) {
      return
    }

    try {
      await api.delete(`/usuarios-cliente/${id}`)
      fetchUsuarios()
      alert('Usuário desativado com sucesso!')
    } catch (error: any) {
      alert(`Erro ao desativar: ${error.response?.data?.error || error.message}`)
    }
  }

  const handleResetPassword = async (id: string) => {
    const novaSenha = window.prompt('Digite a nova senha:')
    if (!novaSenha) return

    try {
      await api.put(`/usuarios-cliente/${id}/resetar-senha`, {
        novaSenha: novaSenha
      })
      alert('Senha resetada com sucesso!')
    } catch (error: any) {
      alert(`Erro ao resetar senha: ${error.response?.data?.error || error.message}`)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="usuarios-portal-page">
      <div className="page-header">
        <h1>Usuários Portal RH</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={20} />
          Novo Usuário Portal
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, email ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                fetchUsuarios()
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
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : usuarios.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum usuário do portal encontrado</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Cargo</th>
                <th>Apólices</th>
                <th>Sub-Estipulantes</th>
                <th>Status</th>
                <th>Último Acesso</th>
                <th>Solicitações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>
                    <strong>{usuario.nome}</strong>
                  </td>
                  <td>{usuario.email}</td>
                  <td>{usuario.cargo || '-'}</td>
                  <td>
                    <div className="badges-list">
                      {usuario.apolices.length > 0 ? (
                        usuario.apolices.slice(0, 2).map((a) => (
                          <span key={a.id} className="badge badge-apolice" title={a.apolice.empresa.razaoSocial}>
                            <FileText size={12} />
                            {a.apolice.numero}
                          </span>
                        ))
                      ) : (
                        <span className="badge badge-empty">Nenhuma</span>
                      )}
                      {usuario.apolices.length > 2 && (
                        <span className="badge badge-more">+{usuario.apolices.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="badges-list">
                      {usuario.subEstipulantes.length > 0 ? (
                        usuario.subEstipulantes.slice(0, 2).map((s) => (
                          <span key={s.id} className="badge badge-sub" title={s.subEstipulante.razaoSocial}>
                            <Building2 size={12} />
                            {s.subEstipulante.codigoEstipulante}
                          </span>
                        ))
                      ) : (
                        <span className="badge badge-empty">Nenhum</span>
                      )}
                      {usuario.subEstipulantes.length > 2 && (
                        <span className="badge badge-more">+{usuario.subEstipulantes.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${usuario.ativo ? 'status-ativo' : 'status-inativo'}`}>
                      {usuario.ativo ? (
                        <>
                          <CheckCircle size={14} />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          Inativo
                        </>
                      )}
                    </span>
                  </td>
                  <td>{formatDate(usuario.ultimoAcesso)}</td>
                  <td>
                    <span className="count-badge">{usuario._count?.solicitacoesAtendimento || 0}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => openView(usuario.id)}
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => openEdit(usuario.id)}
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleResetPassword(usuario.id)}
                        title="Resetar senha"
                      >
                        <Key size={18} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(usuario.id)}
                        title="Desativar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingId(null)
        }}
        title={editingId ? 'Editar Usuário Portal' : 'Novo Usuário Portal'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="usuario-portal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {!editingId && (
              <div className="form-group">
                <label>Senha *</label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required={!editingId}
                />
              </div>
            )}

            <div className="form-group">
              <label>Cargo</label>
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Ex: Gerente de RH"
              />
            </div>

            <div className="form-group">
              <label>Telefone</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(11) 98765-4321"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                />
                Usuário Ativo
              </label>
            </div>

            <div className="form-group full-width">
              <MultiSelectSearch
                label="Apólices Vinculadas"
                options={apolices.map(apolice => ({
                  id: apolice.id,
                  label: apolice.numero,
                  subtitle: apolice.empresa.razaoSocial
                }))}
                selectedIds={formData.apoliceIds}
                onChange={(ids) => setFormData({ ...formData, apoliceIds: ids })}
                placeholder="Selecione as apólices..."
                searchPlaceholder="Buscar por número ou empresa..."
                loading={loadingApolices}
                onSearch={handleApolicesSearch}
                onLoadMore={apolicesHasMore ? handleApolicesLoadMore : undefined}
                hasMore={apolicesHasMore}
              />
            </div>

            <div className="form-group full-width">
              <MultiSelectSearch
                label="Sub-Estipulantes Vinculados"
                options={subEstipulantes.map(sub => ({
                  id: sub.id,
                  label: sub.codigoEstipulante,
                  subtitle: `${sub.razaoSocial} (Apólice: ${sub.apolice.numero})`
                }))}
                selectedIds={formData.subEstipulanteIds}
                onChange={(ids) => setFormData({ ...formData, subEstipulanteIds: ids })}
                placeholder="Selecione os sub-estipulantes..."
                searchPlaceholder="Buscar por código, razão social ou apólice..."
                loading={loadingSubEstipulantes}
                onSearch={handleSubEstipulantesSearch}
                onLoadMore={subEstipulantesHasMore ? handleSubEstipulantesLoadMore : undefined}
                hasMore={subEstipulantesHasMore}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Atualizar' : 'Criar'} Usuário
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default UsuariosPortal

