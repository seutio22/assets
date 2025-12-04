import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface ReembolsoPlanoFormProps {
  reembolsoId?: string
  planoId: string
  onSuccess: () => void
  onCancel: () => void
}

const ReembolsoPlanoForm = ({ reembolsoId, planoId, onSuccess, onCancel }: ReembolsoPlanoFormProps) => {
  const [formData, setFormData] = useState({
    valor: '',
    procedimento: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (reembolsoId) {
      fetchReembolso()
    }
  }, [reembolsoId])

  const fetchReembolso = async () => {
    try {
      const response = await api.get(`/reembolsos-plano/${reembolsoId}`)
      const reembolso = response.data
      setFormData({
        valor: reembolso.valor?.toString() || '',
        procedimento: reembolso.procedimento || ''
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar reembolso')
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
        planoId,
        valor: formData.valor ? parseFloat(formData.valor) : undefined,
        procedimento: formData.procedimento || undefined
      }

      if (reembolsoId) {
        await api.put(`/reembolsos-plano/${reembolsoId}`, data)
      } else {
        await api.post('/reembolsos-plano', data)
      }
      onSuccess()
    } catch (err: any) {
      console.error('Erro ao salvar reembolso:', err)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          err.response?.data?.details || 
                          err.message || 
                          'Erro ao salvar reembolso'
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
          <label htmlFor="valor" className="label">
            Valor
          </label>
          <input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            className="input"
            value={formData.valor}
            onChange={handleChange}
            placeholder="0.00"
            disabled={loading}
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="procedimento" className="label">
            Procedimento
          </label>
          <input
            id="procedimento"
            name="procedimento"
            type="text"
            className="input"
            value={formData.procedimento}
            onChange={handleChange}
            placeholder="Procedimento"
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
          {loading ? 'Salvando...' : reembolsoId ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}

export default ReembolsoPlanoForm

