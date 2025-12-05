import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import Modal from '../components/Modal'
import FornecedorForm from '../components/FornecedorForm'
import { useDebounce } from '../hooks/useDebounce'
import './Fornecedores.css'

interface Fornecedor {
  id: string
  tipo?: string
  cnpj?: string
  razaoSocial: string
  nomeFantasia?: string
  tipoProduto?: string
  produtos?: string
  situacaoOperadora?: string
}

const Fornecedores = () => {
  const navigate = useNavigate()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | 'FORNECEDOR' | 'CORRETOR_PARCEIRO'>('TODOS')
  const [page, setPage] = useState(1)
  const [limit] = useState(25) // Reduzido de 100 para 25
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Debounce da busca
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    setPage(1) // Resetar página quando busca ou filtro mudar
  }, [debouncedSearch, tipoFiltro])

  useEffect(() => {
    fetchFornecedores()
  }, [debouncedSearch, tipoFiltro, page])

  const fetchFornecedores = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim())
      }
      if (tipoFiltro !== 'TODOS') {
        params.append('tipo', tipoFiltro)
      }
      params.append('page', page.toString())
      params.append('limit', limit.toString())
      
      const response = await api.get(`/fornecedores?${params.toString()}`)
      const fornecedoresData = response.data.data || []
      const pagination = response.data.pagination || {}
      
      setFornecedores(fornecedoresData)
      setTotal(pagination.total || 0)
      setTotalPages(pagination.totalPages || 0)
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error)
      setFornecedores([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '-'
    const numbers = cnpj.replace(/\D/g, '')
    if (numbers.length === 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    }
    return cnpj
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este parceiro?')) {
      return
    }

    try {
      await api.delete(`/fornecedores/${id}`)
      fetchFornecedores()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir parceiro')
    }
  }

  const openNew = () => {
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (id: string) => {
    setEditingId(id)
    setShowModal(true)
  }

  const handleSuccess = () => {
    setShowModal(false)
    setEditingId(null)
    fetchFornecedores()
  }

  return (
    <div className="fornecedores-page">
      <div className="page-header">
        <h1>Parceiros</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={20} />
          Novo Parceiro
        </button>
      </div>

      <div className="search-bar" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '8px', minWidth: '300px' }}>
          <Search size={20} />
          <input
            type="text"
            className="input"
            placeholder="Buscar parceiros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <div className="submodule-buttons">
          <button
            type="button"
            className={`submodule-btn ${tipoFiltro === 'TODOS' ? 'active' : ''}`}
            onClick={() => setTipoFiltro('TODOS')}
          >
            Todos os Parceiros
          </button>
          <button
            type="button"
            className={`submodule-btn ${tipoFiltro === 'FORNECEDOR' ? 'active' : ''}`}
            onClick={() => setTipoFiltro('FORNECEDOR')}
          >
            Fornecedores
          </button>
          <button
            type="button"
            className={`submodule-btn ${tipoFiltro === 'CORRETOR_PARCEIRO' ? 'active' : ''}`}
            onClick={() => setTipoFiltro('CORRETOR_PARCEIRO')}
          >
            Corretores Parceiros
          </button>
        </div>
      </div>

      {!loading && total > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          padding: '0 8px'
        }}>
          <span style={{ color: '#666', fontSize: '14px' }}>
            Mostrando {fornecedores.length} de {total} parceiros
          </span>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>CNPJ</th>
              <th>Razão Social</th>
              <th>Nome Fantasia</th>
              <th>Tipo de Produto</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                  Carregando...
                </td>
              </tr>
            ) : fornecedores.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                  Nenhum parceiro encontrado
                </td>
              </tr>
            ) : (
              fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id}>
                  <td>
                    <span className={`status-badge ${fornecedor.tipo === 'CORRETOR_PARCEIRO' ? 'corretor' : 'fornecedor'}`}>
                      {fornecedor.tipo === 'CORRETOR_PARCEIRO' ? 'Corretor Parceiro' : 'Fornecedor'}
                    </span>
                  </td>
                  <td>{formatCNPJ(fornecedor.cnpj)}</td>
                  <td>{fornecedor.razaoSocial}</td>
                  <td>{fornecedor.nomeFantasia || '-'}</td>
                  <td>{fornecedor.tipoProduto || '-'}</td>
                  <td>
                    <span className={`status-badge ${fornecedor.situacaoOperadora?.toLowerCase() || 'ativa'}`}>
                      {fornecedor.situacaoOperadora || 'ATIVA'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        title="Visualizar"
                        onClick={() => navigate(`/fornecedores/${fornecedor.id}`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Editar"
                        onClick={() => openEdit(fornecedor.id)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Excluir"
                        onClick={() => handleDelete(fornecedor.id)}
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

      {!loading && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '24px',
          padding: '16px'
        }}>
          <button
            className="btn"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            style={{
              opacity: page === 1 ? 0.5 : 1,
              cursor: page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={18} />
            Anterior
          </button>
          
          <span style={{ 
            padding: '8px 16px',
            fontSize: '14px',
            color: '#333'
          }}>
            Página {page} de {totalPages}
          </span>
          
          <button
            className="btn"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            style={{
              opacity: page === totalPages ? 0.5 : 1,
              cursor: page === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Próxima
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingId(null)
        }}
        title={editingId ? 'Editar Parceiro' : 'Novo Parceiro'}
        size="large"
      >
        <FornecedorForm
          fornecedorId={editingId || undefined}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowModal(false)
            setEditingId(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Fornecedores

