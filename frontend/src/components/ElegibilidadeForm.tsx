import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface ElegibilidadeFormProps {
  elegibilidadeId?: string
  apoliceId: string
  onSuccess: () => void
  onCancel: () => void
}

const ElegibilidadeForm = ({ elegibilidadeId, apoliceId, onSuccess, onCancel }: ElegibilidadeFormProps) => {
  const [formData, setFormData] = useState({
    nome: '',
    centroCusto: '',
    cnpj: '',
    descricao: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (elegibilidadeId) {
      fetchElegibilidade()
    }
  }, [elegibilidadeId])

  const fetchElegibilidade = async () => {
    try {
      const response = await api.get(`/elegibilidades/${elegibilidadeId}`)
      const elegibilidade = response.data
      setFormData({
        nome: elegibilidade.nome || '',
        centroCusto: elegibilidade.centroCusto || '',
        cnpj: elegibilidade.cnpj || '',
        descricao: elegibilidade.descricao || ''
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar elegibilidade')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nome) {
      setError('Nome é obrigatório')
      return
    }

    setLoading(true)

    try {
      const data = {
        apoliceId,
        nome: formData.nome,
        centroCusto: formData.centroCusto || undefined,
        cnpj: formData.cnpj || undefined,
        descricao: formData.descricao || undefined
      }

      if (elegibilidadeId) {
        await api.put(`/elegibilidades/${elegibilidadeId}`, data)
      } else {
        await api.post('/elegibilidades', data)
      }
      onSuccess()
    } catch (err: any) {
      console.error('Erro ao salvar elegibilidade:', err)
      console.error('Detalhes do erro:', err.response?.data)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          err.response?.data?.details || 
                          err.message || 
                          'Erro ao salvar elegibilidade'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-section-title">Dados da Elegibilidade</div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="nome" className="label">
            Nome *
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            className="input"
            value={formData.nome}
            onChange={handleChange}
            required
            placeholder="Nome da elegibilidade"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="centroCusto" className="label">
            Centro de Custo
          </label>
          <input
            id="centroCusto"
            name="centroCusto"
            type="text"
            className="input"
            value={formData.centroCusto}
            onChange={handleChange}
            placeholder="Centro de Custo"
            disabled={loading}
          />
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
      </div>

      <div className="form-group">
        <label htmlFor="descricao" className="label">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          className="input"
          value={formData.descricao}
          onChange={handleChange}
          placeholder="Descrição da elegibilidade"
          disabled={loading}
          rows={4}
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
          {loading ? 'Salvando...' : elegibilidadeId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default ElegibilidadeForm

