import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import Modal from '../components/Modal'
import ApoliceFormWizard from '../components/ApoliceFormWizard'
import SubEstipulanteForm from '../components/SubEstipulanteForm'
import './Apolices.css'

interface Apolice {
  id: string
  numero: string
  produto?: string
  status: string
  dataVigenciaMDS?: string
  dataVigenciaContratoInicio?: string
  empresa?: { 
    cnpj: string
    razaoSocial: string
    grupoEconomico?: { name: string }
  }
  fornecedor?: { razaoSocial: string }
}

const Apolices = () => {
  const navigate = useNavigate()
  const [apolices, setApolices] = useState<Apolice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchApolices()
  }, [search])

  const fetchApolices = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/apolices?search=${search}&limit=100`)
      
      // Verificar se a resposta tem a estrutura esperada
      if (!response.data) {
        console.error('Resposta da API inválida:', response)
        setApolices([])
        return
      }
      
      const apolicesData = response.data.data || []
      
      // Validar e limpar dados
      const apolicesValidas = apolicesData.map((apolice: any) => ({
        ...apolice,
        fornecedor: apolice.fornecedor || null,
        empresa: apolice.empresa || null
      }))
      
      setApolices(apolicesValidas)
    } catch (error: any) {
      console.error('Erro ao carregar apólices:', error)
      console.error('Detalhes do erro:', error.response?.data)
      console.error('Status do erro:', error.response?.status)
      
      // Não mostrar alerta se for erro 401 (será redirecionado automaticamente)
      if (error.response?.status !== 401) {
        alert(`Erro ao carregar apólices: ${error.response?.data?.error || error.message}`)
      }
      setApolices([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCNPJ = (cnpj?: string | null) => {
    if (!cnpj) return '-'
    const numbers = cnpj.toString().replace(/\D/g, '')
    if (numbers.length === 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    }
    return cnpj.toString()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta apólice?')) {
      return
    }

    try {
      await api.delete(`/apolices/${id}`)
      fetchApolices()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir apólice')
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
    fetchApolices()
  }

  return (
    <div className="apolices-page">
      <div className="page-header">
        <h1>Apólices</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={20} />
          Nova Apólice
        </button>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          className="input"
          placeholder="Buscar apólices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Apólice</th>
              <th>CNPJ</th>
              <th>Razão Social</th>
              <th>Cliente</th>
              <th>Produto</th>
              <th>Fornecedor</th>
              <th>Data de Vigência do Contrato</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>
                  Carregando...
                </td>
              </tr>
            ) : apolices.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }}>
                  Nenhuma apólice encontrada
                </td>
              </tr>
            ) : (
              apolices.map((apolice) => {
                return (
                <tr key={apolice.id}>
                  <td>{apolice.numero}</td>
                  <td>{apolice.empresa?.cnpj ? formatCNPJ(apolice.empresa.cnpj) : '-'}</td>
                  <td>{apolice.empresa?.razaoSocial || '-'}</td>
                  <td>{apolice.empresa?.grupoEconomico?.name || '-'}</td>
                  <td>{apolice.produto || '-'}</td>
                  <td>{apolice.fornecedor?.razaoSocial || '-'}</td>
                  <td>
                    {formatDate(apolice.dataVigenciaContratoInicio)}
                  </td>
                  <td>
                    <span className={`status-badge status-${apolice.status.toLowerCase().replace('_', '-')}`}>
                      {apolice.status === 'ATIVA' ? 'Ativa' :
                       apolice.status === 'CANCELADA' ? 'Cancelada' :
                       apolice.status === 'EM_IMPLANTACAO' ? 'Em implantação' :
                       apolice.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        title="Visualizar"
                        onClick={() => navigate(`/apolices/${apolice.id}`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Editar"
                        onClick={() => openEdit(apolice.id)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Excluir"
                        onClick={() => handleDelete(apolice.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
              setEditingId(null)
            }}
            title=""
            size="large"
          >
            <ApoliceFormWizard
              key={editingId || 'new'} // Força remontagem quando editingId muda
              apoliceId={editingId || undefined}
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

export default Apolices

