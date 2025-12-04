import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Trash2, Plus } from 'lucide-react'
import './Form.css'

interface PlanoFormProps {
  planoId?: string
  apoliceId: string
  onSuccess: () => void
  onCancel: () => void
}

const PlanoForm = ({ planoId, apoliceId, onSuccess, onCancel }: PlanoFormProps) => {
  const [formData, setFormData] = useState({
    vidasImplantadas: '',
    tipoValorPlano: '',
    valorPlano: '',
    custoMedio: '',
    quantidadeVidasCustoMedio: '',
    faixa0a18: '',
    vidasFaixa0a18: '',
    faixa19a23: '',
    vidasFaixa19a23: '',
    faixa24a28: '',
    vidasFaixa24a28: '',
    faixa29a33: '',
    vidasFaixa29a33: '',
    faixa34a38: '',
    vidasFaixa34a38: '',
    faixa39a43: '',
    vidasFaixa39a43: '',
    faixa44a48: '',
    vidasFaixa44a48: '',
    faixa49a53: '',
    vidasFaixa49a53: '',
    faixa54a58: '',
    vidasFaixa54a58: '',
    faixa59ouMais: '',
    vidasFaixa59ouMais: '',
    inicioVigencia: '',
    fimVigencia: '',
    upgrade: false,
    downgrade: false,
    nomePlano: '',
    codANS: '',
    codPlano: '',
    elegibilidadeId: '',
    reembolso: false,
    coparticipacao: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reembolsos, setReembolsos] = useState<Array<{ valor: string; procedimento: string }>>([])
  const [novoReembolso, setNovoReembolso] = useState({ valor: '', procedimento: '' })
  const [coparticipacoes, setCoparticipacoes] = useState<Array<{ valor: string; procedimento: string }>>([])
  const [novaCoparticipacao, setNovaCoparticipacao] = useState({ valor: '', procedimento: '' })
  const [elegibilidades, setElegibilidades] = useState<Array<{ id: string; nome: string }>>([])

  useEffect(() => {
    if (planoId) {
      fetchPlano()
    }
    fetchElegibilidades()
  }, [planoId, apoliceId])

  const fetchPlano = async () => {
    try {
      const response = await api.get(`/planos/${planoId}`)
      const plano = response.data
      setFormData({
        vidasImplantadas: plano.vidasImplantadas?.toString() || '',
        tipoValorPlano: plano.tipoValorPlano || '',
        valorPlano: plano.valorPlano?.toString() || plano.custoMedio?.toString() || '',
        custoMedio: plano.custoMedio?.toString() || plano.valorPlano?.toString() || '',
        quantidadeVidasCustoMedio: plano.quantidadeVidasCustoMedio?.toString() || '',
        faixa0a18: plano.faixa0a18?.toString() || '',
        vidasFaixa0a18: plano.vidasFaixa0a18?.toString() || '',
        faixa19a23: plano.faixa19a23?.toString() || '',
        vidasFaixa19a23: plano.vidasFaixa19a23?.toString() || '',
        faixa24a28: plano.faixa24a28?.toString() || '',
        vidasFaixa24a28: plano.vidasFaixa24a28?.toString() || '',
        faixa29a33: plano.faixa29a33?.toString() || '',
        vidasFaixa29a33: plano.vidasFaixa29a33?.toString() || '',
        faixa34a38: plano.faixa34a38?.toString() || '',
        vidasFaixa34a38: plano.vidasFaixa34a38?.toString() || '',
        faixa39a43: plano.faixa39a43?.toString() || '',
        vidasFaixa39a43: plano.vidasFaixa39a43?.toString() || '',
        faixa44a48: plano.faixa44a48?.toString() || '',
        vidasFaixa44a48: plano.vidasFaixa44a48?.toString() || '',
        faixa49a53: plano.faixa49a53?.toString() || '',
        vidasFaixa49a53: plano.vidasFaixa49a53?.toString() || '',
        faixa54a58: plano.faixa54a58?.toString() || '',
        vidasFaixa54a58: plano.vidasFaixa54a58?.toString() || '',
        faixa59ouMais: plano.faixa59ouMais?.toString() || '',
        vidasFaixa59ouMais: plano.vidasFaixa59ouMais?.toString() || '',
        inicioVigencia: plano.inicioVigencia ? new Date(plano.inicioVigencia).toISOString().split('T')[0] : '',
        fimVigencia: plano.fimVigencia ? new Date(plano.fimVigencia).toISOString().split('T')[0] : '',
        upgrade: plano.upgrade ?? false,
        downgrade: plano.downgrade ?? false,
        nomePlano: plano.nomePlano || '',
        codANS: plano.codANS || '',
        codPlano: plano.codPlano || '',
        elegibilidadeId: plano.elegibilidadeId || plano.elegibilidade?.id || '',
        reembolso: plano.reembolso ?? false,
        coparticipacao: plano.coparticipacao ?? false
      })
      
      // Carregar reembolsos existentes
      if (plano.reembolso && plano.reembolsos) {
        const reembolsosData = plano.reembolsos.map((r: any) => ({
          valor: r.valor?.toString() || '',
          procedimento: r.procedimento || ''
        }))
        setReembolsos(reembolsosData)
      }
      
      // Carregar coparticipações existentes
      if (plano.coparticipacao && plano.coparticipacoes) {
        const coparticipacoesData = plano.coparticipacoes.map((c: any) => ({
          valor: c.valor?.toString() || '',
          procedimento: c.procedimento || ''
        }))
        setCoparticipacoes(coparticipacoesData)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar plano')
    }
  }

  // Calcular vidas implantadas automaticamente quando for faixa etária
  useEffect(() => {
    if (formData.tipoValorPlano === 'faixa_etaria') {
      const total = (
        (parseInt(formData.vidasFaixa0a18) || 0) +
        (parseInt(formData.vidasFaixa19a23) || 0) +
        (parseInt(formData.vidasFaixa24a28) || 0) +
        (parseInt(formData.vidasFaixa29a33) || 0) +
        (parseInt(formData.vidasFaixa34a38) || 0) +
        (parseInt(formData.vidasFaixa39a43) || 0) +
        (parseInt(formData.vidasFaixa44a48) || 0) +
        (parseInt(formData.vidasFaixa49a53) || 0) +
        (parseInt(formData.vidasFaixa54a58) || 0) +
        (parseInt(formData.vidasFaixa59ouMais) || 0)
      )
      setFormData(prev => ({ ...prev, vidasImplantadas: total.toString() }))
    } else if (formData.tipoValorPlano === 'custo_medio') {
      // Quando for custo médio, usar a quantidade de vidas informada
      const vidas = formData.quantidadeVidasCustoMedio || ''
      setFormData(prev => ({ ...prev, vidasImplantadas: vidas }))
    }
  }, [
    formData.tipoValorPlano,
    formData.vidasFaixa0a18,
    formData.vidasFaixa19a23,
    formData.vidasFaixa24a28,
    formData.vidasFaixa29a33,
    formData.vidasFaixa34a38,
    formData.vidasFaixa39a43,
    formData.vidasFaixa44a48,
    formData.vidasFaixa49a53,
    formData.vidasFaixa54a58,
    formData.vidasFaixa59ouMais,
    formData.quantidadeVidasCustoMedio
  ])

  // Função para formatar valor como moeda (R$)
  const formatCurrency = (value: string | number): string => {
    if (!value && value !== 0) return ''
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) : value
    if (isNaN(numValue)) return ''
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue)
  }

  // Função para converter valor formatado de volta para número
  const parseCurrency = (value: string): string => {
    if (!value) return ''
    // Remove tudo exceto números, vírgula e ponto
    let cleaned = value.replace(/[^\d,.-]/g, '')
    // Se tiver vírgula, substitui por ponto (formato brasileiro)
    cleaned = cleaned.replace(',', '.')
    // Remove pontos extras (exceto o último que é decimal)
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('')
    }
    const numValue = parseFloat(cleaned)
    if (isNaN(numValue)) return ''
    return numValue.toString()
  }

  // Função para obter valor numérico do campo formatado
  const getNumericValue = (value: string): string => {
    if (!value) return ''
    return parseCurrency(value)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
      // Se desativar reembolso, limpar a lista de reembolsos
      if (name === 'reembolso' && !checked) {
        setReembolsos([])
        setNovoReembolso({ valor: '', procedimento: '' })
      }
      // Se desativar coparticipação, limpar a lista de coparticipações
      if (name === 'coparticipacao' && !checked) {
        setCoparticipacoes([])
        setNovaCoparticipacao({ valor: '', procedimento: '' })
      }
    } else {
      // Se for um campo de valor monetário, converter para número antes de salvar
      const isCurrencyField = name === 'valorPlano' || name === 'custoMedio' || 
        name.startsWith('faixa') && !name.startsWith('vidasFaixa')
      
      if (isCurrencyField) {
        const numericValue = parseCurrency(value)
        setFormData(prev => ({ ...prev, [name]: numericValue }))
      } else {
        setFormData(prev => ({ ...prev, [name]: value }))
      }
    }
  }

  // Handler específico para campos de moeda (para exibição formatada)
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const { value } = e.target
    const numericValue = parseCurrency(value)
    setFormData(prev => ({ ...prev, [fieldName]: numericValue }))
  }

  const handleReembolsoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNovoReembolso(prev => ({ ...prev, [name]: value }))
  }

  const handleAddReembolso = () => {
    if (novoReembolso.valor || novoReembolso.procedimento) {
      setReembolsos(prev => [...prev, { ...novoReembolso }])
      setNovoReembolso({ valor: '', procedimento: '' })
    }
  }

  const handleRemoveReembolso = (index: number) => {
    setReembolsos(prev => prev.filter((_, i) => i !== index))
  }

  const handleCoparticipacaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNovaCoparticipacao(prev => ({ ...prev, [name]: value }))
  }

  const handleAddCoparticipacao = () => {
    if (novaCoparticipacao.valor || novaCoparticipacao.procedimento) {
      setCoparticipacoes(prev => [...prev, { ...novaCoparticipacao }])
      setNovaCoparticipacao({ valor: '', procedimento: '' })
    }
  }

  const handleRemoveCoparticipacao = (index: number) => {
    setCoparticipacoes(prev => prev.filter((_, i) => i !== index))
  }

  const fetchElegibilidades = async () => {
    try {
      const response = await api.get(`/elegibilidades?apoliceId=${apoliceId}&limit=1000`)
      setElegibilidades(response.data.data || [])
    } catch (err) {
      console.error('Erro ao carregar elegibilidades:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nomePlano) {
      setError('Nome do plano é obrigatório')
      return
    }

    setLoading(true)

    try {
      const data: any = {
        apoliceId,
        nomePlano: formData.nomePlano,
        codANS: formData.codANS || undefined,
        codPlano: formData.codPlano || undefined,
        vidasImplantadas: formData.vidasImplantadas ? parseInt(formData.vidasImplantadas) : undefined,
        tipoValorPlano: formData.tipoValorPlano || undefined,
        inicioVigencia: formData.inicioVigencia ? new Date(formData.inicioVigencia).toISOString() : undefined,
        fimVigencia: formData.fimVigencia ? new Date(formData.fimVigencia).toISOString() : undefined,
        upgrade: formData.upgrade,
        downgrade: formData.downgrade,
        elegibilidadeId: formData.elegibilidadeId && formData.elegibilidadeId !== '' ? formData.elegibilidadeId : null,
        reembolso: formData.reembolso,
        coparticipacao: formData.coparticipacao
      }

      if (formData.tipoValorPlano === 'custo_medio') {
        const valor = formData.valorPlano || formData.custoMedio
        data.valorPlano = valor ? parseFloat(valor) : undefined
        data.custoMedio = valor ? parseFloat(valor) : undefined
      } else if (formData.tipoValorPlano === 'faixa_etaria') {
        data.faixa0a18 = formData.faixa0a18 ? parseFloat(formData.faixa0a18) : undefined
        data.faixa19a23 = formData.faixa19a23 ? parseFloat(formData.faixa19a23) : undefined
        data.faixa24a28 = formData.faixa24a28 ? parseFloat(formData.faixa24a28) : undefined
        data.faixa29a33 = formData.faixa29a33 ? parseFloat(formData.faixa29a33) : undefined
        data.faixa34a38 = formData.faixa34a38 ? parseFloat(formData.faixa34a38) : undefined
        data.faixa39a43 = formData.faixa39a43 ? parseFloat(formData.faixa39a43) : undefined
        data.faixa44a48 = formData.faixa44a48 ? parseFloat(formData.faixa44a48) : undefined
        data.faixa49a53 = formData.faixa49a53 ? parseFloat(formData.faixa49a53) : undefined
        data.faixa54a58 = formData.faixa54a58 ? parseFloat(formData.faixa54a58) : undefined
        data.faixa59ouMais = formData.faixa59ouMais ? parseFloat(formData.faixa59ouMais) : undefined
      }

      let savedPlano
      if (planoId) {
        savedPlano = await api.put(`/planos/${planoId}`, data)
      } else {
        savedPlano = await api.post('/planos', data)
      }

      // Se reembolso está ativado, criar/atualizar reembolsos
      if (formData.reembolso && reembolsos.length > 0) {
        const planoIdToUse = planoId || savedPlano.data.id
        
        // Deletar reembolsos existentes se estiver editando
        if (planoId) {
          try {
            const existingReembolsos = await api.get(`/reembolsos-plano?planoId=${planoIdToUse}`)
            for (const reembolso of existingReembolsos.data.data || []) {
              await api.delete(`/reembolsos-plano/${reembolso.id}`)
            }
          } catch (err) {
            console.error('Erro ao deletar reembolsos existentes:', err)
          }
        }
        
        // Criar novos reembolsos
        for (const reembolso of reembolsos) {
          try {
            await api.post('/reembolsos-plano', {
              planoId: planoIdToUse,
              valor: reembolso.valor ? parseFloat(reembolso.valor) : null,
              procedimento: reembolso.procedimento || null
            })
          } catch (err) {
            console.error('Erro ao criar reembolso:', err)
          }
        }
      } else if (planoId && !formData.reembolso) {
        // Se desativou reembolso, deletar todos os reembolsos existentes
        try {
          const existingReembolsos = await api.get(`/reembolsos-plano?planoId=${planoId}`)
          for (const reembolso of existingReembolsos.data.data || []) {
            await api.delete(`/reembolsos-plano/${reembolso.id}`)
          }
        } catch (err) {
          console.error('Erro ao deletar reembolsos:', err)
        }
      }

      // Se coparticipação está ativada, criar/atualizar coparticipações
      if (formData.coparticipacao && coparticipacoes.length > 0) {
        const planoIdToUse = planoId || savedPlano.data.id
        
        // Deletar coparticipações existentes se estiver editando
        if (planoId) {
          try {
            const existingCoparticipacoes = await api.get(`/coparticipacoes-plano?planoId=${planoIdToUse}`)
            for (const coparticipacao of existingCoparticipacoes.data.data || []) {
              await api.delete(`/coparticipacoes-plano/${coparticipacao.id}`)
            }
          } catch (err) {
            console.error('Erro ao deletar coparticipações existentes:', err)
          }
        }
        
        // Criar novas coparticipações
        for (const coparticipacao of coparticipacoes) {
          try {
            await api.post('/coparticipacoes-plano', {
              planoId: planoIdToUse,
              valor: coparticipacao.valor ? parseFloat(coparticipacao.valor) : null,
              procedimento: coparticipacao.procedimento || null
            })
          } catch (err) {
            console.error('Erro ao criar coparticipação:', err)
          }
        }
      } else if (planoId && !formData.coparticipacao) {
        // Se desativou coparticipação, deletar todas as coparticipações existentes
        try {
          const existingCoparticipacoes = await api.get(`/coparticipacoes-plano?planoId=${planoId}`)
          for (const coparticipacao of existingCoparticipacoes.data.data || []) {
            await api.delete(`/coparticipacoes-plano/${coparticipacao.id}`)
          }
        } catch (err) {
          console.error('Erro ao deletar coparticipações:', err)
        }
      }
      
      onSuccess()
    } catch (err: any) {
      console.error('Erro ao salvar plano:', err)
      console.error('Detalhes do erro:', err.response?.data)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          err.response?.data?.details || 
                          err.message || 
                          'Erro ao salvar plano'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-section-title">Dados Principais</div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="nomePlano" className="label">
            Nome do Plano *
          </label>
          <input
            id="nomePlano"
            name="nomePlano"
            type="text"
            className="input"
            value={formData.nomePlano}
            onChange={handleChange}
            required
            placeholder="Nome do plano"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="codANS" className="label">
            Código ANS
          </label>
          <input
            id="codANS"
            name="codANS"
            type="text"
            className="input"
            value={formData.codANS}
            onChange={handleChange}
            placeholder="Código ANS"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="codPlano" className="label">
            Código do Plano
          </label>
          <input
            id="codPlano"
            name="codPlano"
            type="text"
            className="input"
            value={formData.codPlano}
            onChange={handleChange}
            placeholder="Código do plano"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="vidasImplantadas" className="label">
            Vidas Implantadas
          </label>
          <input
            id="vidasImplantadas"
            name="vidasImplantadas"
            type="number"
            min="0"
            className="input"
            value={formData.vidasImplantadas}
            onChange={handleChange}
            placeholder="0"
            disabled={loading || formData.tipoValorPlano === 'faixa_etaria'}
            readOnly={formData.tipoValorPlano === 'faixa_etaria'}
            style={formData.tipoValorPlano === 'faixa_etaria' ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
          />
          {formData.tipoValorPlano === 'faixa_etaria' && (
            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
              Calculado automaticamente pela soma das vidas de todas as faixas
            </small>
          )}
        </div>
      </div>

      <div className="form-section-title">Valor do Plano</div>

      <div className="form-group">
        <label htmlFor="tipoValorPlano" className="label">
          Tipo de Valor
        </label>
        <select
          id="tipoValorPlano"
          name="tipoValorPlano"
          className="input"
          value={formData.tipoValorPlano}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">Selecione...</option>
          <option value="custo_medio">Custo Médio</option>
          <option value="faixa_etaria">Faixa Etária</option>
        </select>
      </div>

      {formData.tipoValorPlano === 'custo_medio' && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="valorPlano" className="label">
              Valor (Custo Médio)
            </label>
            <input
              id="valorPlano"
              name="valorPlano"
              type="text"
              className="input"
              value={formatCurrency(formData.valorPlano)}
              onChange={(e) => handleCurrencyChange(e, 'valorPlano')}
              placeholder="R$ 0,00"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="quantidadeVidasCustoMedio" className="label">
              Quantidade de Vidas
            </label>
            <input
              id="quantidadeVidasCustoMedio"
              name="quantidadeVidasCustoMedio"
              type="number"
              min="0"
              className="input"
              value={formData.quantidadeVidasCustoMedio}
              onChange={handleChange}
              placeholder="0"
              disabled={loading}
            />
          </div>
        </div>
      )}

      {formData.tipoValorPlano === 'faixa_etaria' && (
        <div className="form-section">
          <h4 style={{ marginBottom: '16px', color: '#00225f' }}>Faixas Etárias</h4>
          <p style={{ marginBottom: '16px', color: '#666', fontSize: '0.9rem' }}>
            Informe o valor e a quantidade de vidas para cada faixa etária
          </p>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faixa0a18" className="label">
                0 a 18 anos - Valor
              </label>
              <input
                id="faixa0a18"
                name="faixa0a18"
                type="text"
                className="input"
                value={formatCurrency(formData.faixa0a18)}
                onChange={(e) => handleCurrencyChange(e, 'faixa0a18')}
                placeholder="R$ 0,00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vidasFaixa0a18" className="label">
                0 a 18 anos - Quantidade de Vidas
              </label>
              <input
                id="vidasFaixa0a18"
                name="vidasFaixa0a18"
                type="number"
                min="0"
                className="input"
                value={formData.vidasFaixa0a18}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faixa19a23" className="label">
                19 a 23 anos - Valor
              </label>
              <input
                id="faixa19a23"
                name="faixa19a23"
                type="text"
                className="input"
                value={formatCurrency(formData.faixa19a23)}
                onChange={(e) => handleCurrencyChange(e, 'faixa19a23')}
                placeholder="R$ 0,00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vidasFaixa19a23" className="label">
                19 a 23 anos - Quantidade de Vidas
              </label>
              <input
                id="vidasFaixa19a23"
                name="vidasFaixa19a23"
                type="number"
                min="0"
                className="input"
                value={formData.vidasFaixa19a23}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faixa24a28" className="label">
                24 a 28 anos - Valor
              </label>
              <input
                id="faixa24a28"
                name="faixa24a28"
                type="text"
                className="input"
                value={formatCurrency(formData.faixa24a28)}
                onChange={(e) => handleCurrencyChange(e, 'faixa24a28')}
                placeholder="R$ 0,00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vidasFaixa24a28" className="label">
                24 a 28 anos - Quantidade de Vidas
              </label>
              <input
                id="vidasFaixa24a28"
                name="vidasFaixa24a28"
                type="number"
                min="0"
                className="input"
                value={formData.vidasFaixa24a28}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faixa29a33" className="label">
                29 a 33 anos - Valor
              </label>
              <input
                id="faixa29a33"
                name="faixa29a33"
                type="text"
                className="input"
                value={formatCurrency(formData.faixa29a33)}
                onChange={(e) => handleCurrencyChange(e, 'faixa29a33')}
                placeholder="R$ 0,00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vidasFaixa29a33" className="label">
                29 a 33 anos - Quantidade de Vidas
              </label>
              <input
                id="vidasFaixa29a33"
                name="vidasFaixa29a33"
                type="number"
                min="0"
                className="input"
                value={formData.vidasFaixa29a33}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faixa34a38" className="label">
                34 a 38 anos - Valor
              </label>
              <input
                id="faixa34a38"
                name="faixa34a38"
                type="text"
                className="input"
                value={formatCurrency(formData.faixa34a38)}
                onChange={(e) => handleCurrencyChange(e, 'faixa34a38')}
                placeholder="R$ 0,00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vidasFaixa34a38" className="label">
                34 a 38 anos - Quantidade de Vidas
              </label>
              <input
                id="vidasFaixa34a38"
                name="vidasFaixa34a38"
                type="number"
                min="0"
                className="input"
                value={formData.vidasFaixa34a38}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faixa39a43" className="label">
                39 a 43 anos - Valor
              </label>
              <input
                id="faixa39a43"
                name="faixa39a43"
                type="text"
                className="input"
                value={formatCurrency(formData.faixa39a43)}
                onChange={(e) => handleCurrencyChange(e, 'faixa39a43')}
                placeholder="R$ 0,00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vidasFaixa39a43" className="label">
                39 a 43 anos - Quantidade de Vidas
              </label>
              <input
                id="vidasFaixa39a43"
                name="vidasFaixa39a43"
                type="number"
                min="0"
                className="input"
                value={formData.vidasFaixa39a43}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faixa44a48" className="label">
                44 a 48 anos - Valor
              </label>
              <input
                id="faixa44a48"
                name="faixa44a48"
                type="text"
                className="input"
                value={formatCurrency(formData.faixa44a48)}
                onChange={(e) => handleCurrencyChange(e, 'faixa44a48')}
                placeholder="R$ 0,00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vidasFaixa44a48" className="label">
                44 a 48 anos - Quantidade de Vidas
              </label>
              <input
                id="vidasFaixa44a48"
                name="vidasFaixa44a48"
                type="number"
                min="0"
                className="input"
                value={formData.vidasFaixa44a48}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faixa49a53" className="label">
                49 a 53 anos - Valor
              </label>
              <input
                id="faixa49a53"
                name="faixa49a53"
                type="text"
                className="input"
                value={formatCurrency(formData.faixa49a53)}
                onChange={(e) => handleCurrencyChange(e, 'faixa49a53')}
                placeholder="R$ 0,00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vidasFaixa49a53" className="label">
                49 a 53 anos - Quantidade de Vidas
              </label>
              <input
                id="vidasFaixa49a53"
                name="vidasFaixa49a53"
                type="number"
                min="0"
                className="input"
                value={formData.vidasFaixa49a53}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faixa54a58" className="label">
                54 a 58 anos - Valor
              </label>
              <input
                id="faixa54a58"
                name="faixa54a58"
                type="text"
                className="input"
                value={formatCurrency(formData.faixa54a58)}
                onChange={(e) => handleCurrencyChange(e, 'faixa54a58')}
                placeholder="R$ 0,00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vidasFaixa54a58" className="label">
                54 a 58 anos - Quantidade de Vidas
              </label>
              <input
                id="vidasFaixa54a58"
                name="vidasFaixa54a58"
                type="number"
                min="0"
                className="input"
                value={formData.vidasFaixa54a58}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faixa59ouMais" className="label">
                59 anos ou mais - Valor
              </label>
              <input
                id="faixa59ouMais"
                name="faixa59ouMais"
                type="text"
                className="input"
                value={formatCurrency(formData.faixa59ouMais)}
                onChange={(e) => handleCurrencyChange(e, 'faixa59ouMais')}
                placeholder="R$ 0,00"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="vidasFaixa59ouMais" className="label">
                59 anos ou mais - Quantidade de Vidas
              </label>
              <input
                id="vidasFaixa59ouMais"
                name="vidasFaixa59ouMais"
                type="number"
                min="0"
                className="input"
                value={formData.vidasFaixa59ouMais}
                onChange={handleChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="inicioVigencia" className="label">
            Início de Vigência
          </label>
          <input
            id="inicioVigencia"
            name="inicioVigencia"
            type="date"
            className="input"
            value={formData.inicioVigencia}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="fimVigencia" className="label">
            Fim de Vigência
          </label>
          <input
            id="fimVigencia"
            name="fimVigencia"
            type="date"
            className="input"
            value={formData.fimVigencia}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-section-title">Permissões</div>

      <div className="form-row">
        <div className="form-group">
          <label className="toggle-switch-label">
            <span className="toggle-label-text">Upgrade</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                name="upgrade"
                checked={formData.upgrade}
                onChange={handleChange}
                disabled={loading}
                className="toggle-input"
              />
              <span className="toggle-slider">
                <span className="toggle-text">{formData.upgrade ? 'On' : 'Off'}</span>
              </span>
            </div>
          </label>
        </div>

        <div className="form-group">
          <label className="toggle-switch-label">
            <span className="toggle-label-text">Downgrade</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                name="downgrade"
                checked={formData.downgrade}
                onChange={handleChange}
                disabled={loading}
                className="toggle-input"
              />
              <span className="toggle-slider">
                <span className="toggle-text">{formData.downgrade ? 'On' : 'Off'}</span>
              </span>
            </div>
          </label>
        </div>

      </div>

      <div className="form-section-title">Informações Adicionais</div>

      <div className="form-group">
        <label htmlFor="elegibilidadeId" className="label">
          Elegibilidade
        </label>
        <select
          id="elegibilidadeId"
          name="elegibilidadeId"
          className="input"
          value={formData.elegibilidadeId}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">Selecione uma elegibilidade</option>
          {elegibilidades.map((elegibilidade) => (
            <option key={elegibilidade.id} value={elegibilidade.id}>
              {elegibilidade.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="form-section-title">Reembolso</div>

      <div className="form-group">
        <label className="toggle-switch-label">
          <span className="toggle-label-text">Reembolso</span>
          <div className="toggle-switch">
            <input
              type="checkbox"
              name="reembolso"
              checked={formData.reembolso}
              onChange={handleChange}
              disabled={loading}
              className="toggle-input"
            />
            <span className="toggle-slider">
              <span className="toggle-text">{formData.reembolso ? 'On' : 'Off'}</span>
            </span>
          </div>
        </label>
      </div>

      {formData.reembolso && (
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reembolsoValor" className="label">
                Valor
              </label>
              <input
                id="reembolsoValor"
                name="valor"
                type="number"
                step="0.01"
                className="input"
                value={novoReembolso.valor}
                onChange={handleReembolsoChange}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reembolsoProcedimento" className="label">
                Procedimento
              </label>
              <input
                id="reembolsoProcedimento"
                name="procedimento"
                type="text"
                className="input"
                value={novoReembolso.procedimento}
                onChange={handleReembolsoChange}
                placeholder="Procedimento"
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-icon"
                onClick={handleAddReembolso}
                disabled={loading || (!novoReembolso.valor && !novoReembolso.procedimento)}
                title="Adicionar Reembolso"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {reembolsos.length > 0 && (
            <div className="reembolsos-list" style={{ marginTop: '16px' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Valor</th>
                    <th>Procedimento</th>
                    <th style={{ width: '80px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {reembolsos.map((reembolso, index) => (
                    <tr key={index}>
                      <td>{reembolso.valor ? `R$ ${parseFloat(reembolso.valor).toFixed(2)}` : '-'}</td>
                      <td>{reembolso.procedimento || '-'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleRemoveReembolso(index)}
                          disabled={loading}
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="form-section-title">Coparticipação</div>

      <div className="form-group">
        <label className="toggle-switch-label">
          <span className="toggle-label-text">Coparticipação</span>
          <div className="toggle-switch">
            <input
              type="checkbox"
              name="coparticipacao"
              checked={formData.coparticipacao}
              onChange={handleChange}
              disabled={loading}
              className="toggle-input"
            />
            <span className="toggle-slider">
              <span className="toggle-text">{formData.coparticipacao ? 'On' : 'Off'}</span>
            </span>
          </div>
        </label>
      </div>

      {formData.coparticipacao && (
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="coparticipacaoValor" className="label">
                Valor
              </label>
              <input
                id="coparticipacaoValor"
                name="valor"
                type="number"
                step="0.01"
                className="input"
                value={novaCoparticipacao.valor}
                onChange={handleCoparticipacaoChange}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="coparticipacaoProcedimento" className="label">
                Procedimento
              </label>
              <input
                id="coparticipacaoProcedimento"
                name="procedimento"
                type="text"
                className="input"
                value={novaCoparticipacao.procedimento}
                onChange={handleCoparticipacaoChange}
                placeholder="Procedimento"
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-icon"
                onClick={handleAddCoparticipacao}
                disabled={loading || (!novaCoparticipacao.valor && !novaCoparticipacao.procedimento)}
                title="Adicionar Coparticipação"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {coparticipacoes.length > 0 && (
            <div className="coparticipacoes-list" style={{ marginTop: '16px' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Valor</th>
                    <th>Procedimento</th>
                    <th style={{ width: '80px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {coparticipacoes.map((coparticipacao, index) => (
                    <tr key={index}>
                      <td>{coparticipacao.valor ? `R$ ${parseFloat(coparticipacao.valor).toFixed(2)}` : '-'}</td>
                      <td>{coparticipacao.procedimento || '-'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleRemoveCoparticipacao(index)}
                          disabled={loading}
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
          {loading ? 'Salvando...' : planoId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default PlanoForm
