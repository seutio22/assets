import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface SubEstipulanteFormProps {
  subEstipulanteId?: string
  apoliceId: string
  onSuccess: () => void
  onCancel: () => void
}

const SubEstipulanteForm = ({ subEstipulanteId, apoliceId, onSuccess, onCancel }: SubEstipulanteFormProps) => {
  const [formData, setFormData] = useState({
    codigoEstipulante: '',
    cnpj: '',
    razaoSocial: '',
    codigoCNAE: '',
    ramoAtividade: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    tipo: '',
    dataVigenciaContrato: '',
    dataCancelamento: '',
    status: 'ATIVA'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (subEstipulanteId) {
      fetchSubEstipulante()
    }
  }, [subEstipulanteId])

  const fetchSubEstipulante = async () => {
    try {
      const response = await api.get(`/sub-estipulantes/${subEstipulanteId}`)
      const subEstipulante = response.data
      setFormData({
        codigoEstipulante: subEstipulante.codigoEstipulante || '',
        cnpj: subEstipulante.cnpj || '',
        razaoSocial: subEstipulante.razaoSocial || '',
        codigoCNAE: subEstipulante.codigoCNAE || '',
        ramoAtividade: subEstipulante.ramoAtividade || '',
        inscricaoEstadual: subEstipulante.inscricaoEstadual || '',
        inscricaoMunicipal: subEstipulante.inscricaoMunicipal || '',
        tipo: subEstipulante.tipo || '',
        dataVigenciaContrato: subEstipulante.dataVigenciaContrato ? new Date(subEstipulante.dataVigenciaContrato).toISOString().split('T')[0] : '',
        dataCancelamento: subEstipulante.dataCancelamento ? new Date(subEstipulante.dataCancelamento).toISOString().split('T')[0] : '',
        status: subEstipulante.status || 'ATIVA'
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar sub estipulante')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.codigoEstipulante) {
      setError('Código do estipulante é obrigatório')
      return
    }

    if (!formData.razaoSocial) {
      setError('Razão social é obrigatória')
      return
    }

    setLoading(true)

    try {
      const data: any = {
        apoliceId,
        codigoEstipulante: formData.codigoEstipulante,
        razaoSocial: formData.razaoSocial,
        status: formData.status || 'ATIVA'
      }

      // Adicionar campos opcionais apenas se tiverem valor
      if (formData.cnpj && formData.cnpj.trim() !== '') {
        data.cnpj = formData.cnpj
      }
      if (formData.codigoCNAE && formData.codigoCNAE.trim() !== '') {
        data.codigoCNAE = formData.codigoCNAE
      }
      if (formData.ramoAtividade && formData.ramoAtividade.trim() !== '') {
        data.ramoAtividade = formData.ramoAtividade
      }
      if (formData.inscricaoEstadual && formData.inscricaoEstadual.trim() !== '') {
        data.inscricaoEstadual = formData.inscricaoEstadual
      }
      if (formData.inscricaoMunicipal && formData.inscricaoMunicipal.trim() !== '') {
        data.inscricaoMunicipal = formData.inscricaoMunicipal
      }
      if (formData.tipo && formData.tipo !== '') {
        data.tipo = formData.tipo
      }
      if (formData.dataVigenciaContrato) {
        data.dataVigenciaContrato = new Date(formData.dataVigenciaContrato).toISOString()
      }
      if (formData.dataCancelamento) {
        data.dataCancelamento = new Date(formData.dataCancelamento).toISOString()
      }

      if (subEstipulanteId) {
        await api.put(`/sub-estipulantes/${subEstipulanteId}`, data)
      } else {
        await api.post('/sub-estipulantes', data)
      }
      onSuccess()
    } catch (err: any) {
      console.error('Erro ao salvar sub estipulante:', err)
      console.error('Detalhes do erro:', err.response?.data)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          err.response?.data?.details || 
                          err.message || 
                          'Erro ao salvar sub estipulante'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="codigoEstipulante" className="label">
            Código Estipulante *
          </label>
          <input
            id="codigoEstipulante"
            name="codigoEstipulante"
            type="text"
            className="input"
            value={formData.codigoEstipulante}
            onChange={handleChange}
            required
            placeholder="Código do estipulante"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tipo" className="label">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            className="input"
            value={formData.tipo}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Selecione o tipo</option>
            <option value="PRESTADOR_SERVICO">Prestador de Serviço</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status" className="label">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="input"
            value={formData.status}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="VENCIDA">Vencida</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="cnpj" className="label">
            CNPJ
          </label>
          <input
            id="cnpj"
            name="cnpj"
            type="text"
            className="input"
            value={formData.cnpj}
            onChange={handleChange}
            placeholder="00.000.000/0000-00"
            disabled={loading}
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="razaoSocial" className="label">
            Razão Social *
          </label>
          <input
            id="razaoSocial"
            name="razaoSocial"
            type="text"
            className="input"
            value={formData.razaoSocial}
            onChange={handleChange}
            required
            placeholder="Razão social"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="codigoCNAE" className="label">
            Código CNAE
          </label>
          <input
            id="codigoCNAE"
            name="codigoCNAE"
            type="text"
            className="input"
            value={formData.codigoCNAE}
            onChange={handleChange}
            placeholder="Código CNAE"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ramoAtividade" className="label">
            Ramo de Atividade
          </label>
          <input
            id="ramoAtividade"
            name="ramoAtividade"
            type="text"
            className="input"
            value={formData.ramoAtividade}
            onChange={handleChange}
            placeholder="Ramo de atividade"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="inscricaoEstadual" className="label">
            Inscrição Estadual
          </label>
          <input
            id="inscricaoEstadual"
            name="inscricaoEstadual"
            type="text"
            className="input"
            value={formData.inscricaoEstadual}
            onChange={handleChange}
            placeholder="Inscrição Estadual"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="inscricaoMunicipal" className="label">
            Inscrição Municipal
          </label>
          <input
            id="inscricaoMunicipal"
            name="inscricaoMunicipal"
            type="text"
            className="input"
            value={formData.inscricaoMunicipal}
            onChange={handleChange}
            placeholder="Inscrição Municipal"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dataVigenciaContrato" className="label">
            Data de Vigência do Contrato
          </label>
          <input
            id="dataVigenciaContrato"
            name="dataVigenciaContrato"
            type="date"
            className="input"
            value={formData.dataVigenciaContrato}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dataCancelamento" className="label">
            Data de Cancelamento
          </label>
          <input
            id="dataCancelamento"
            name="dataCancelamento"
            type="date"
            className="input"
            value={formData.dataCancelamento}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-footer">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Salvando...' : subEstipulanteId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default SubEstipulanteForm

