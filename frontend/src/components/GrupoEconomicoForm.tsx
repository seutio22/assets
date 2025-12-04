import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface GrupoEconomicoFormProps {
  grupoId?: string
  onSuccess: () => void
  onCancel: () => void
}

const GrupoEconomicoForm = ({ grupoId, onSuccess, onCancel }: GrupoEconomicoFormProps) => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (grupoId) {
      fetchGrupo()
    }
  }, [grupoId])

  const fetchGrupo = async () => {
    try {
      const response = await api.get(`/grupos-economicos/${grupoId}`)
      setName(response.data.name)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar grupo')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!name.trim()) {
      setError('Nome do cliente é obrigatório')
      return
    }

    setLoading(true)

    try {
      if (grupoId) {
        await api.put(`/grupos-economicos/${grupoId}`, { name: name.trim() })
      } else {
        await api.post('/grupos-economicos', { name: name.trim() })
      }
      onSuccess()
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          'Erro ao salvar grupo'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name" className="label">
          Nome do Cliente *
        </label>
        <input
          id="name"
          type="text"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ex: Grupo ABC"
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
          {loading ? 'Salvando...' : grupoId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default GrupoEconomicoForm

