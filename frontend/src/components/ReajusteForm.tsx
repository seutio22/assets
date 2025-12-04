import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface ReajusteFormProps {
  reajusteId?: string
  apoliceId: string
  onSuccess: () => void
  onCancel: () => void
}

const ReajusteForm = ({ reajusteId, apoliceId, onSuccess, onCancel }: ReajusteFormProps) => {
  const [formData, setFormData] = useState({
    apoliceId: apoliceId || '',
    tipo: '',
    inicioPeriodo: '',
    fimPeriodo: '',
    indiceApurado: '',
    indiceAplicado: '',
    mesAplicado: '',
    dataNegociacao: '',
    conclusao: '',
    observacao: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (reajusteId) {
      fetchReajuste()
    }
  }, [reajusteId])

  const fetchReajuste = async () => {
    try {
      const response = await api.get(`/reajustes/${reajusteId}`)
      const reajuste = response.data
      setFormData({
        apoliceId: reajuste.apoliceId,
        tipo: reajuste.tipo || '',
        inicioPeriodo: reajuste.inicioPeriodo || '',
        fimPeriodo: reajuste.fimPeriodo || '',
        indiceApurado: reajuste.indiceApurado?.toString() || '',
        indiceAplicado: reajuste.indiceAplicado?.toString() || '',
        mesAplicado: reajuste.mesAplicado || '',
        dataNegociacao: reajuste.dataNegociacao || '',
        conclusao: reajuste.conclusao || '',
        observacao: reajuste.observacao || ''
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar reajuste')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data: any = {
        apoliceId: apoliceId || formData.apoliceId
      }

      // Adicionar campos opcionais apenas se tiverem valor
      if (formData.tipo && formData.tipo.trim() !== '') {
        data.tipo = formData.tipo
      }
      if (formData.inicioPeriodo && formData.inicioPeriodo.trim() !== '') {
        data.inicioPeriodo = formData.inicioPeriodo
      }
      if (formData.fimPeriodo && formData.fimPeriodo.trim() !== '') {
        data.fimPeriodo = formData.fimPeriodo
      }
      if (formData.indiceApurado && formData.indiceApurado.trim() !== '') {
        data.indiceApurado = parseFloat(formData.indiceApurado)
      }
      if (formData.indiceAplicado && formData.indiceAplicado.trim() !== '') {
        data.indiceAplicado = parseFloat(formData.indiceAplicado)
      }
      if (formData.mesAplicado && formData.mesAplicado.trim() !== '') {
        data.mesAplicado = formData.mesAplicado
      }
      if (formData.dataNegociacao && formData.dataNegociacao.trim() !== '') {
        data.dataNegociacao = formData.dataNegociacao
      }
      if (formData.conclusao && formData.conclusao.trim() !== '') {
        data.conclusao = formData.conclusao
      }
      if (formData.observacao && formData.observacao.trim() !== '') {
        data.observacao = formData.observacao
      }

      if (reajusteId) {
        await api.put(`/reajustes/${reajusteId}`, data)
      } else {
        await api.post('/reajustes', data)
      }
      onSuccess()
    } catch (err: any) {
      console.error('Erro ao salvar reajuste:', err)
      console.error('Detalhes do erro:', err.response?.data)
      setError(err.response?.data?.error || 'Erro ao salvar reajuste')
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
            Tipo
          </label>
          <input
            id="tipo"
            name="tipo"
            type="text"
            className="input"
            value={formData.tipo}
            onChange={handleChange}
            placeholder="Ex: MOEDA"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="inicioPeriodo" className="label">
            Início do Período (MM/YYYY)
          </label>
          <input
            id="inicioPeriodo"
            name="inicioPeriodo"
            type="text"
            className="input"
            value={formData.inicioPeriodo}
            onChange={handleChange}
            placeholder="04/2016"
            maxLength={7}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="fimPeriodo" className="label">
            Fim do Período (MM/YYYY)
          </label>
          <input
            id="fimPeriodo"
            name="fimPeriodo"
            type="text"
            className="input"
            value={formData.fimPeriodo}
            onChange={handleChange}
            placeholder="03/2017"
            maxLength={7}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="indiceApurado" className="label">
            Índice Apurado
          </label>
          <input
            id="indiceApurado"
            name="indiceApurado"
            type="number"
            step="0.01"
            className="input"
            value={formData.indiceApurado}
            onChange={handleChange}
            placeholder="4,57"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="indiceAplicado" className="label">
            Índice Aplicado
          </label>
          <input
            id="indiceAplicado"
            name="indiceAplicado"
            type="number"
            step="0.01"
            className="input"
            value={formData.indiceAplicado}
            onChange={handleChange}
            placeholder="2,00"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="mesAplicado" className="label" style={{ color: '#a42340', fontWeight: 600 }}>
            Mês Aplicado (MM/YYYY) *
          </label>
          <input
            id="mesAplicado"
            name="mesAplicado"
            type="text"
            className="input"
            value={formData.mesAplicado}
            onChange={handleChange}
            placeholder="07/2017"
            maxLength={7}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dataNegociacao" className="label">
            Data de Negociação (MM/YYYY)
          </label>
          <input
            id="dataNegociacao"
            name="dataNegociacao"
            type="text"
            className="input"
            value={formData.dataNegociacao}
            onChange={handleChange}
            placeholder="06/2017"
            maxLength={7}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="conclusao" className="label">
            Conclusão
          </label>
          <input
            id="conclusao"
            name="conclusao"
            type="text"
            className="input"
            value={formData.conclusao}
            onChange={handleChange}
            placeholder="Ex: REAJUSTE"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="observacao" className="label">
          Observação
        </label>
        <textarea
          id="observacao"
          name="observacao"
          className="input"
          value={formData.observacao}
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
          {loading ? 'Salvando...' : reajusteId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default ReajusteForm

