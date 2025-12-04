import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface RelacionamentoFormProps {
  relacionamentoId?: string
  apoliceId: string
  onSuccess: () => void
  onCancel: () => void
}

const RelacionamentoForm = ({ relacionamentoId, apoliceId, onSuccess, onCancel }: RelacionamentoFormProps) => {
  const [formData, setFormData] = useState({
    executivo: '',
    coordenador: '',
    gerente: '',
    superintendente: '',
    diretoria: '',
    filial: '',
    celulaAtendimento: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (relacionamentoId) {
      fetchRelacionamento()
    }
  }, [relacionamentoId])

  const fetchRelacionamento = async () => {
    try {
      const response = await api.get(`/relacionamentos/${relacionamentoId}`)
      const relacionamento = response.data
      setFormData({
        executivo: relacionamento.executivo || '',
        coordenador: relacionamento.coordenador || '',
        gerente: relacionamento.gerente || '',
        superintendente: relacionamento.superintendente || '',
        diretoria: relacionamento.diretoria || '',
        filial: relacionamento.filial || '',
        celulaAtendimento: relacionamento.celulaAtendimento || ''
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar relacionamento')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    setLoading(true)

    try {
      const data = {
        apoliceId,
        executivo: formData.executivo || undefined,
        coordenador: formData.coordenador || undefined,
        gerente: formData.gerente || undefined,
        superintendente: formData.superintendente || undefined,
        diretoria: formData.diretoria || undefined,
        filial: formData.filial || undefined,
        celulaAtendimento: formData.celulaAtendimento || undefined
      }

      if (relacionamentoId) {
        await api.put(`/relacionamentos/${relacionamentoId}`, data)
      } else {
        await api.post('/relacionamentos', data)
      }
      onSuccess()
    } catch (err: any) {
      console.error('Erro ao salvar relacionamento:', err)
      console.error('Detalhes do erro:', err.response?.data)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          err.response?.data?.details || 
                          err.message || 
                          'Erro ao salvar relacionamento'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="executivo" className="label">
          Executivo
        </label>
        <input
          id="executivo"
          name="executivo"
          type="text"
          className="input"
          value={formData.executivo}
          onChange={handleChange}
          placeholder="Executivo"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="coordenador" className="label">
          Coordenador
        </label>
        <input
          id="coordenador"
          name="coordenador"
          type="text"
          className="input"
          value={formData.coordenador}
          onChange={handleChange}
          placeholder="Coordenador"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="gerente" className="label">
          Gerente
        </label>
        <input
          id="gerente"
          name="gerente"
          type="text"
          className="input"
          value={formData.gerente}
          onChange={handleChange}
          placeholder="Gerente"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="superintendente" className="label">
          Superintendente
        </label>
        <input
          id="superintendente"
          name="superintendente"
          type="text"
          className="input"
          value={formData.superintendente}
          onChange={handleChange}
          placeholder="Superintendente"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="diretoria" className="label">
          Diretoria
        </label>
        <input
          id="diretoria"
          name="diretoria"
          type="text"
          className="input"
          value={formData.diretoria}
          onChange={handleChange}
          placeholder="Diretoria"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="filial" className="label">
          Filial
        </label>
        <input
          id="filial"
          name="filial"
          type="text"
          className="input"
          value={formData.filial}
          onChange={handleChange}
          placeholder="Filial"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="celulaAtendimento" className="label">
          Célula de Atendimento
        </label>
        <input
          id="celulaAtendimento"
          name="celulaAtendimento"
          type="text"
          className="input"
          value={formData.celulaAtendimento}
          onChange={handleChange}
          placeholder="Célula de Atendimento"
          disabled={loading}
        />
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
          {loading ? 'Salvando...' : relacionamentoId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default RelacionamentoForm

