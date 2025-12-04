import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Form.css'

interface FornecedorFormProps {
  fornecedorId?: string
  onSuccess: () => void
  onCancel: () => void
}

const FornecedorForm = ({ fornecedorId, onSuccess, onCancel }: FornecedorFormProps) => {
  const [formData, setFormData] = useState({
    tipo: 'FORNECEDOR' as 'FORNECEDOR' | 'CORRETOR_PARCEIRO',
    cnpj: '',
    registroANS: '',
    razaoSocial: '',
    nomeFantasia: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    iof: '',
    tipoProduto: '',
    produtos: '',
    planosComReembolso: '',
    divulgacaoIndiceFinanceiro: '',
    vidasEmpresarialANS: '',
    custoMedioANS: '',
    compAtualizacaoANS: '',
    observacao: '',
    situacaoOperadora: 'ATIVA'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (fornecedorId) {
      fetchFornecedor()
    }
  }, [fornecedorId])

  const fetchFornecedor = async () => {
    try {
      const response = await api.get(`/fornecedores/${fornecedorId}`)
      const fornecedor = response.data
      setFormData({
        tipo: fornecedor.tipo || 'FORNECEDOR',
        cnpj: fornecedor.cnpj || '',
        registroANS: fornecedor.registroANS || '',
        razaoSocial: fornecedor.razaoSocial || '',
        nomeFantasia: fornecedor.nomeFantasia || '',
        inscricaoEstadual: fornecedor.inscricaoEstadual || '',
        inscricaoMunicipal: fornecedor.inscricaoMunicipal || '',
        iof: fornecedor.iof || '',
        tipoProduto: fornecedor.tipoProduto || '',
        produtos: fornecedor.produtos || '',
        planosComReembolso: fornecedor.planosComReembolso || '',
        divulgacaoIndiceFinanceiro: fornecedor.divulgacaoIndiceFinanceiro || '',
        vidasEmpresarialANS: fornecedor.vidasEmpresarialANS || '',
        custoMedioANS: fornecedor.custoMedioANS?.toString() || '',
        compAtualizacaoANS: fornecedor.compAtualizacaoANS || '',
        observacao: fornecedor.observacao || '',
        situacaoOperadora: fornecedor.situacaoOperadora || 'ATIVA'
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar fornecedor')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
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

    if (!formData.razaoSocial.trim()) {
      setError('Razão Social é obrigatória')
      return
    }

    setLoading(true)

    try {
      const data = {
        tipo: formData.tipo,
        ...formData,
        cnpj: formData.cnpj || undefined,
        registroANS: formData.registroANS || undefined,
        nomeFantasia: formData.nomeFantasia || undefined,
        inscricaoEstadual: formData.inscricaoEstadual || undefined,
        inscricaoMunicipal: formData.inscricaoMunicipal || undefined,
        iof: formData.iof || undefined,
        tipoProduto: formData.tipoProduto || undefined,
        produtos: formData.produtos || undefined,
        planosComReembolso: formData.planosComReembolso || undefined,
        divulgacaoIndiceFinanceiro: formData.divulgacaoIndiceFinanceiro || undefined,
        vidasEmpresarialANS: formData.vidasEmpresarialANS || undefined,
        custoMedioANS: formData.custoMedioANS ? parseFloat(formData.custoMedioANS) : undefined,
        compAtualizacaoANS: formData.compAtualizacaoANS || undefined,
        observacao: formData.observacao || undefined,
        situacaoOperadora: formData.situacaoOperadora || undefined
      }

      if (fornecedorId) {
        await api.put(`/fornecedores/${fornecedorId}`, data)
      } else {
        await api.post('/fornecedores', data)
      }
      onSuccess()
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          'Erro ao salvar fornecedor'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label className="label">
          Tipo de Parceiro *
        </label>
        <div className="submodule-buttons">
          <button
            type="button"
            className={`submodule-btn ${formData.tipo === 'FORNECEDOR' ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, tipo: 'FORNECEDOR' }))}
            disabled={loading}
          >
            Fornecedor
          </button>
          <button
            type="button"
            className={`submodule-btn ${formData.tipo === 'CORRETOR_PARCEIRO' ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, tipo: 'CORRETOR_PARCEIRO' }))}
            disabled={loading}
          >
            Corretor Parceiro
          </button>
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
            value={formatCNPJ(formData.cnpj)}
            onChange={handleCNPJChange}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="situacaoOperadora" className="label">
            Situação da Operadora
          </label>
          <select
            id="situacaoOperadora"
            name="situacaoOperadora"
            className="input"
            value={formData.situacaoOperadora}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
            <option value="SUSPENSA">Suspensa</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
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
          placeholder="Razão Social da empresa"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="nomeFantasia" className="label">
          Nome Fantasia
        </label>
        <input
          id="nomeFantasia"
          name="nomeFantasia"
          type="text"
          className="input"
          value={formData.nomeFantasia}
          onChange={handleChange}
          placeholder="Nome comercial/fantasia"
          disabled={loading}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="tipoProduto" className="label">
            Tipo de Produto
          </label>
          <input
            id="tipoProduto"
            name="tipoProduto"
            type="text"
            className="input"
            value={formData.tipoProduto}
            onChange={handleChange}
            placeholder="Ex: Seguro, Saúde, etc."
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="produtos" className="label">
          Produtos
        </label>
        <textarea
          id="produtos"
          name="produtos"
          className="input"
          value={formData.produtos}
          onChange={handleChange}
          placeholder="Lista de produtos oferecidos..."
          rows={4}
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
          {loading ? 'Salvando...' : fornecedorId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default FornecedorForm

