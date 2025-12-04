import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface EnderecoFormProps {
  enderecoId?: string
  empresaId?: string
  onSuccess: () => void
  onCancel: () => void
}

const EnderecoForm = ({ enderecoId, empresaId, onSuccess, onCancel }: EnderecoFormProps) => {
  const [formData, setFormData] = useState({
    empresaId: empresaId || '',
    tipo: 'COMERCIAL',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (enderecoId) {
      fetchEndereco()
    }
  }, [enderecoId])

  const fetchEndereco = async () => {
    try {
      const response = await api.get(`/enderecos/${enderecoId}`)
      const endereco = response.data
      setFormData({
        empresaId: endereco.empresaId,
        tipo: endereco.tipo || 'COMERCIAL',
        logradouro: endereco.logradouro,
        numero: endereco.numero || '',
        complemento: endereco.complemento || '',
        bairro: endereco.bairro || '',
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep || '',
        observacoes: endereco.observacoes || ''
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar endereço')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.logradouro.trim()) {
      setError('Logradouro é obrigatório')
      return
    }

    if (!formData.cidade.trim()) {
      setError('Cidade é obrigatória')
      return
    }

    if (!formData.estado.trim()) {
      setError('Estado é obrigatório')
      return
    }

    setLoading(true)

    try {
      const data = {
        ...formData,
        empresaId: empresaId || formData.empresaId,
        numero: formData.numero || undefined,
        complemento: formData.complemento || undefined,
        bairro: formData.bairro || undefined,
        cep: formData.cep || undefined,
        observacoes: formData.observacoes || undefined
      }

      if (enderecoId) {
        await api.put(`/enderecos/${enderecoId}`, data)
      } else {
        await api.post('/enderecos', data)
      }
      onSuccess()
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          'Erro ao salvar endereço'
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
          <label htmlFor="tipo" className="label">
            Tipo *
          </label>
          <select
            id="tipo"
            name="tipo"
            className="input"
            value={formData.tipo}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="COMERCIAL">Comercial</option>
            <option value="COBRANCA">Cobrança</option>
            <option value="ENTREGA">Entrega</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="cep" className="label">
            CEP
          </label>
          <input
            id="cep"
            name="cep"
            type="text"
            className="input"
            value={formData.cep}
            onChange={handleChange}
            placeholder="00000-000"
            maxLength={9}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="logradouro" className="label">
            Logradouro *
          </label>
          <input
            id="logradouro"
            name="logradouro"
            type="text"
            className="input"
            value={formData.logradouro}
            onChange={handleChange}
            required
            placeholder="Rua, Avenida, etc."
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="numero" className="label">
            Número
          </label>
          <input
            id="numero"
            name="numero"
            type="text"
            className="input"
            value={formData.numero}
            onChange={handleChange}
            placeholder="123"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="complemento" className="label">
            Complemento
          </label>
          <input
            id="complemento"
            name="complemento"
            type="text"
            className="input"
            value={formData.complemento}
            onChange={handleChange}
            placeholder="Apto, Sala, etc."
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bairro" className="label">
            Bairro
          </label>
          <input
            id="bairro"
            name="bairro"
            type="text"
            className="input"
            value={formData.bairro}
            onChange={handleChange}
            placeholder="Bairro"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label htmlFor="cidade" className="label">
            Cidade *
          </label>
          <input
            id="cidade"
            name="cidade"
            type="text"
            className="input"
            value={formData.cidade}
            onChange={handleChange}
            required
            placeholder="Cidade"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="estado" className="label">
            Estado *
          </label>
          <input
            id="estado"
            name="estado"
            type="text"
            className="input"
            value={formData.estado}
            onChange={handleChange}
            required
            placeholder="UF"
            maxLength={2}
            disabled={loading}
          />
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
          {loading ? 'Salvando...' : enderecoId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default EnderecoForm

