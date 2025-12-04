import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { portalApi } from '../../services/portal-api'
import { FileText, Eye, ArrowLeft } from 'lucide-react'
import './PortalApolices.css'

interface Apolice {
  id: string
  numero: string
  produto?: string
  status: string
  dataVigenciaMDS?: string
  dataVigenciaContratoInicio?: string
  empresa: {
    razaoSocial: string
    cnpj: string
  }
  fornecedor: {
    razaoSocial: string
  }
}

const PortalApolices = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const [apolices, setApolices] = useState<Apolice[]>([])
  const [apoliceDetalhes, setApoliceDetalhes] = useState<Apolice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchApoliceDetalhes(id)
    } else {
      fetchApolices()
    }
  }, [id])

  const fetchApolices = async () => {
    try {
      setLoading(true)
      const response = await portalApi.get('/portal/apolices')
      setApolices(response.data.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar apólices:', error)
      alert(`Erro ao carregar apólices: ${error.response?.data?.error || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchApoliceDetalhes = async (apoliceId: string) => {
    try {
      setLoading(true)
      // Buscar a apólice específica da lista do usuário
      const response = await portalApi.get('/portal/apolices')
      const apolices = response.data.data || []
      const apolice = apolices.find((a: Apolice) => a.id === apoliceId)
      
      if (!apolice) {
        alert('Apólice não encontrada ou você não tem acesso a ela')
        navigate('/portal/apolices')
        return
      }
      
      setApoliceDetalhes(apolice)
    } catch (error: any) {
      console.error('Erro ao carregar detalhes da apólice:', error)
      if (error.response?.status !== 401) {
        alert(`Erro ao carregar detalhes: ${error.response?.data?.error || error.message}`)
      }
      navigate('/portal/apolices')
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

  if (loading) {
    return (
      <div className="portal-apolices">
        <div className="loading">{id ? 'Carregando detalhes...' : 'Carregando apólices...'}</div>
      </div>
    )
  }

  // Se houver ID, mostrar detalhes da apólice
  if (id && apoliceDetalhes) {
    return (
      <div className="portal-apolices">
        <div className="page-header">
          <button 
            className="btn btn-outline" 
            onClick={() => navigate('/portal/apolices')}
            style={{ marginBottom: '16px' }}
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <h1>Detalhes da Apólice</h1>
        </div>

        <div className="apolice-detalhes-card">
          <div className="apolice-card-header">
            <div className="apolice-number">
              <FileText size={24} />
              <span>{apoliceDetalhes.numero}</span>
            </div>
            <span className={`status-badge status-${apoliceDetalhes.status.toLowerCase()}`}>
              {apoliceDetalhes.status}
            </span>
          </div>

          <div className="apolice-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div className="apolice-info">
              <label>Cliente</label>
              <p>{apoliceDetalhes.empresa.razaoSocial}</p>
            </div>
            
            <div className="apolice-info">
              <label>CNPJ</label>
              <p>{formatCNPJ(apoliceDetalhes.empresa.cnpj)}</p>
            </div>
            
            <div className="apolice-info">
              <label>Fornecedor</label>
              <p>{apoliceDetalhes.fornecedor.razaoSocial}</p>
            </div>
            
            {apoliceDetalhes.produto && (
              <div className="apolice-info">
                <label>Produto</label>
                <p>{apoliceDetalhes.produto}</p>
              </div>
            )}
            
            <div className="apolice-info">
              <label>Vigência do Contrato</label>
              <p>{formatDate(apoliceDetalhes.dataVigenciaContratoInicio)}</p>
            </div>

            {apoliceDetalhes.dataVigenciaMDS && (
              <div className="apolice-info">
                <label>Vigência MDS</label>
                <p>{formatDate(apoliceDetalhes.dataVigenciaMDS)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-apolices">
      <div className="page-header">
        <h1>Minhas Apólices</h1>
        <p>Visualize as apólices vinculadas ao seu acesso</p>
      </div>

      {apolices.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} color="#ccc" />
          <p>Nenhuma apólice encontrada</p>
        </div>
      ) : (
        <div className="apolices-grid">
          {apolices.map((apolice) => (
            <div key={apolice.id} className="apolice-card">
              <div className="apolice-card-header">
                <div className="apolice-number">
                  <FileText size={20} />
                  <span>{apolice.numero}</span>
                </div>
                <span className={`status-badge status-${apolice.status.toLowerCase()}`}>
                  {apolice.status}
                </span>
              </div>
              
              <div className="apolice-card-body">
                <div className="apolice-info">
                  <label>Cliente</label>
                  <p>{apolice.empresa.razaoSocial}</p>
                </div>
                
                <div className="apolice-info">
                  <label>CNPJ</label>
                  <p>{formatCNPJ(apolice.empresa.cnpj)}</p>
                </div>
                
                <div className="apolice-info">
                  <label>Fornecedor</label>
                  <p>{apolice.fornecedor.razaoSocial}</p>
                </div>
                
                {apolice.produto && (
                  <div className="apolice-info">
                    <label>Produto</label>
                    <p>{apolice.produto}</p>
                  </div>
                )}
                
                <div className="apolice-info">
                  <label>Vigência</label>
                  <p>{formatDate(apolice.dataVigenciaContratoInicio)}</p>
                </div>
              </div>
              
              <div className="apolice-card-footer">
                <button
                  className="btn btn-outline"
                  onClick={() => navigate(`/portal/apolices/${apolice.id}`)}
                >
                  <Eye size={16} />
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PortalApolices

