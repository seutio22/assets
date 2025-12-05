import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Search, Edit, Trash2, Building2, Eye } from 'lucide-react'
import Modal from '../components/Modal'
import GrupoEconomicoForm from '../components/GrupoEconomicoForm'
import EmpresaForm from '../components/EmpresaForm'
import { useDebounce } from '../hooks/useDebounce'
import './Clientes.css'

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
  grupoEconomico?: {
    id: string
    name: string
  }
}

const Clientes = () => {
  const navigate = useNavigate()
  const [grupos, setGrupos] = useState<GrupoEconomico[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showGrupoModal, setShowGrupoModal] = useState(false)
  const [showEmpresaModal, setShowEmpresaModal] = useState(false)
  const [editingGrupoId, setEditingGrupoId] = useState<string | null>(null)
  const [editingEmpresaId, setEditingEmpresaId] = useState<string | null>(null)
  const [selectedGrupoId, setSelectedGrupoId] = useState<string | null>(null)

  // Debounce da busca
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    fetchGrupos()
  }, [debouncedSearch])

  const fetchGrupos = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/grupos-economicos?search=${debouncedSearch}`)
      setGrupos(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      setGrupos([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleDeleteGrupo = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente? Todas as empresas serão excluídas também.')) {
      return
    }

    try {
      await api.delete(`/grupos-economicos/${id}`)
      fetchGrupos()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir grupo')
    }
  }

  const handleDeleteEmpresa = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      return
    }

    try {
      await api.delete(`/empresas/${id}`)
      fetchGrupos()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir empresa')
    }
  }

  const handleGrupoSuccess = () => {
    setShowGrupoModal(false)
    setEditingGrupoId(null)
    fetchGrupos()
  }

  const handleEmpresaSuccess = () => {
    setShowEmpresaModal(false)
    setEditingEmpresaId(null)
    setSelectedGrupoId(null)
    fetchGrupos()
  }

  const openEditGrupo = (id: string) => {
    setEditingGrupoId(id)
    setShowGrupoModal(true)
  }

  const openEditEmpresa = (id: string, grupoId: string) => {
    setEditingEmpresaId(id)
    setSelectedGrupoId(grupoId)
    setShowEmpresaModal(true)
  }

  const openNewEmpresa = (grupoId: string) => {
    setSelectedGrupoId(grupoId)
    setEditingEmpresaId(null)
    setShowEmpresaModal(true)
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="clientes-page">
      <div className="page-header">
        <h1>Clientes</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingGrupoId(null)
            setShowGrupoModal(true)
          }}
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          className="input"
          placeholder="Buscar clientes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Data de Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {grupos.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '32px' }}>
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              grupos.map((grupo) => (
                <tr key={grupo.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={18} color="#00225f" />
                      <strong>{grupo.name}</strong>
                    </div>
                  </td>
                  <td>{formatDate(grupo.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        title="Visualizar"
                        onClick={() => navigate(`/grupos-economicos/${grupo.id}`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Editar"
                        onClick={() => openEditGrupo(grupo.id)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Excluir"
                        onClick={() => handleDeleteGrupo(grupo.id)}
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

      <Modal
        isOpen={showGrupoModal}
        onClose={() => {
          setShowGrupoModal(false)
          setEditingGrupoId(null)
        }}
        title={editingGrupoId ? 'Editar Cliente' : 'Novo Cliente'}
        size="small"
      >
        <GrupoEconomicoForm
          grupoId={editingGrupoId || undefined}
          onSuccess={handleGrupoSuccess}
          onCancel={() => {
            setShowGrupoModal(false)
            setEditingGrupoId(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={showEmpresaModal}
        onClose={() => {
          setShowEmpresaModal(false)
          setEditingEmpresaId(null)
          setSelectedGrupoId(null)
        }}
        title={editingEmpresaId ? 'Editar Empresa' : 'Nova Empresa'}
        size="large"
      >
        <EmpresaForm
          empresaId={editingEmpresaId || undefined}
          grupoEconomicoId={selectedGrupoId || undefined}
          onSuccess={handleEmpresaSuccess}
          onCancel={() => {
            setShowEmpresaModal(false)
            setEditingEmpresaId(null)
            setSelectedGrupoId(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Clientes
