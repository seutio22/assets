import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface ContatoFormProps {
  contatoId?: string
  empresaId?: string
  onSuccess: () => void
  onCancel: () => void
}

const ContatoForm = ({ contatoId, empresaId, onSuccess, onCancel }: ContatoFormProps) => {
  const [formData, setFormData] = useState({
    empresaId: empresaId || '',
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    dataNascimento: '',
    ativo: true,
    observacoes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (contatoId) {
      fetchContato()
    }
  }, [contatoId])

  const fetchContato = async () => {
    try {
      const response = await api.get(`/contatos/${contatoId}`)
      const contato = response.data
      setFormData({
        empresaId: contato.empresaId,
        nome: contato.nome,
        email: contato.email || '',
        telefone: contato.telefone || '',
        cargo: contato.cargo || '',
        dataNascimento: contato.dataNascimento ? new Date(contato.dataNascimento).toISOString().split('T')[0] : '',
        ativo: contato.ativo !== undefined ? contato.ativo : true,
        observacoes: contato.observacoes || ''
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar contato')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nome.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setLoading(true)

    try {
      const data = {
        ...formData,
        empresaId: empresaId || formData.empresaId,
        email: formData.email || undefined,
        telefone: formData.telefone || undefined,
        cargo: formData.cargo || undefined,
        dataNascimento: formData.dataNascimento || undefined,
        ativo: formData.ativo,
        observacoes: formData.observacoes || undefined
      }

      if (contatoId) {
        await api.put(`/contatos/${contatoId}`, data)
      } else {
        await api.post('/contatos', data)
      }
      onSuccess()
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          'Erro ao salvar contato'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="error-message">{error}</div>}
      
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
          placeholder="Nome do contato"
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@exemplo.com"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="telefone" className="label">
            Telefone
          </label>
          <input
            id="telefone"
            name="telefone"
            type="text"
            className="input"
            value={formData.telefone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="cargo" className="label">
          Cargo
        </label>
        <input
          id="cargo"
          name="cargo"
          type="text"
          className="input"
          value={formData.cargo}
          onChange={handleChange}
          placeholder="Ex: Gerente, Diretor"
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dataNascimento" className="label">
            Data de Nascimento
          </label>
          <input
            id="dataNascimento"
            name="dataNascimento"
            type="date"
            className="input"
            value={formData.dataNascimento}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ativo" className="label">
            Status
          </label>
          <select
            id="ativo"
            name="ativo"
            className="input"
            value={formData.ativo ? 'true' : 'false'}
            onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.value === 'true' }))}
            disabled={loading}
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="observacoes" className="label">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          className="input"
          value={formData.observacoes}
          onChange={handleChange}
          placeholder="Observações adicionais..."
          rows={3}
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
          {loading ? 'Salvando...' : contatoId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default ContatoForm

