import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface EnderecoApoliceFormProps {
  enderecoId?: string
  apoliceId: string
  onSuccess: () => void
  onCancel: () => void
}

const EnderecoApoliceForm = ({ enderecoId, apoliceId, onSuccess, onCancel }: EnderecoApoliceFormProps) => {
  const [formData, setFormData] = useState({
    apoliceId: apoliceId || '',
    tipo: 'COMERCIAL',
    cep: '',
    tipoLogradouro: '',
    logradouro: '',
    semNumero: false,
    numero: '',
    complemento: '',
    bairro: '',
    uf: '',
    cidade: '',
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
      const response = await api.get(`/enderecos-apolice/${enderecoId}`)
      const endereco = response.data
      setFormData({
        apoliceId: endereco.apoliceId,
        tipo: endereco.tipo || 'COMERCIAL',
        cep: endereco.cep || '',
        tipoLogradouro: endereco.tipoLogradouro || '',
        logradouro: endereco.logradouro,
        semNumero: endereco.semNumero || false,
        numero: endereco.numero || '',
        complemento: endereco.complemento || '',
        bairro: endereco.bairro || '',
        uf: endereco.uf,
        cidade: endereco.cidade,
        observacoes: endereco.observacoes || ''
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar endereço')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
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

    if (!formData.uf.trim()) {
      setError('UF é obrigatória')
      return
    }

    setLoading(true)

    try {
      const data = {
        ...formData,
        apoliceId: apoliceId || formData.apoliceId,
        cep: formData.cep || undefined,
        tipoLogradouro: formData.tipoLogradouro || undefined,
        numero: formData.semNumero ? undefined : (formData.numero || undefined),
        complemento: formData.complemento || undefined,
        bairro: formData.bairro || undefined,
        observacoes: formData.observacoes || undefined
      }

      if (enderecoId) {
        await api.put(`/enderecos-apolice/${enderecoId}`, data)
      } else {
        await api.post('/enderecos-apolice', data)
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
            Tipo de Endereço *
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
        <div className="form-group">
          <label htmlFor="tipoLogradouro" className="label">
            Tipo de Logradouro
          </label>
          <input
            id="tipoLogradouro"
            name="tipoLogradouro"
            type="text"
            className="input"
            value={formData.tipoLogradouro}
            onChange={handleChange}
            placeholder="Rua, Avenida, etc."
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
            placeholder="Nome do logradouro"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="semNumero" className="label">
            <input
              id="semNumero"
              name="semNumero"
              type="checkbox"
              checked={formData.semNumero}
              onChange={handleChange}
              disabled={loading}
            />
            Sem Número
          </label>
        </div>

        {!formData.semNumero && (
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
        )}
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
          <label htmlFor="uf" className="label">
            UF *
          </label>
          <input
            id="uf"
            name="uf"
            type="text"
            className="input"
            value={formData.uf}
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

export default EnderecoApoliceForm

