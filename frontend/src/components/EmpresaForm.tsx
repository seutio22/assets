import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface EmpresaFormProps {
  empresaId?: string
  grupoEconomicoId?: string
  onSuccess: () => void
  onCancel: () => void
}

const EmpresaForm = ({ empresaId, grupoEconomicoId, onSuccess, onCancel }: EmpresaFormProps) => {
  const [formData, setFormData] = useState({
    grupoEconomicoId: grupoEconomicoId || '',
    cnpj: '',
    razaoSocial: '',
    dataCadastro: new Date().toISOString().split('T')[0]
  })
  const [grupos, setGrupos] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGrupos()
    if (empresaId) {
      fetchEmpresa()
    }
  }, [empresaId])

  const fetchGrupos = async () => {
    try {
      const response = await api.get('/grupos-economicos?limit=1000')
      setGrupos(response.data.data || [])
    } catch (err) {
      console.error('Erro ao carregar grupos:', err)
    }
  }

  const fetchEmpresa = async () => {
    try {
      const response = await api.get(`/empresas/${empresaId}`)
      const empresa = response.data
      setFormData({
        grupoEconomicoId: empresa.grupoEconomicoId,
        cnpj: empresa.cnpj,
        razaoSocial: empresa.razaoSocial,
        dataCadastro: empresa.dataCadastro ? new Date(empresa.dataCadastro).toISOString().split('T')[0] : ''
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar empresa')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5')
    }
    return value
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setFormData(prev => ({ ...prev, cnpj: formatted.replace(/\D/g, '') }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        ...formData,
        dataCadastro: formData.dataCadastro ? new Date(formData.dataCadastro).toISOString() : new Date().toISOString()
      }

      if (empresaId) {
        await api.put(`/empresas/${empresaId}`, data)
      } else {
        await api.post('/empresas', data)
      }
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Erro ao salvar empresa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="grupoEconomicoId" className="label">
          Cliente *
        </label>
        <select
          id="grupoEconomicoId"
          name="grupoEconomicoId"
          className="input"
          value={formData.grupoEconomicoId}
          onChange={handleChange}
          required
          disabled={loading || !!grupoEconomicoId}
        >
          <option value="">Selecione um grupo</option>
          {grupos.map(grupo => (
            <option key={grupo.id} value={grupo.id}>
              {grupo.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="cnpj" className="label">
            CNPJ *
          </label>
          <input
            id="cnpj"
            name="cnpj"
            type="text"
            className="input"
            value={formatCNPJ(formData.cnpj)}
            onChange={handleCNPJChange}
            required
            placeholder="00.000.000/0000-00"
            maxLength={18}
            disabled={loading || !!empresaId}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dataCadastro" className="label">
            Data de Cadastro *
          </label>
          <input
            id="dataCadastro"
            name="dataCadastro"
            type="date"
            className="input"
            value={formData.dataCadastro}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group">
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
          placeholder="Nome completo da empresa"
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
          {loading ? 'Salvando...' : empresaId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default EmpresaForm

