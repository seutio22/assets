import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Trash2 } from 'lucide-react'
import './Form.css'

interface CoberturaFormProps {
  coberturaId?: string
  apoliceId: string
  onSuccess: () => void
  onCancel: () => void
}

const COBERTURAS_PADRAO = [
  'Básica (Morte Natural)',
  'Morte Acidental (Cobertura cumulativa com a Básica)',
  'IPA - Invalidez Permanente Total ou Parcial por Acidente',
  'IFPD - Invalidez Funcional Permanente Total por Doença',
  'IAC - Inclusão Automática de Cônjuge',
  'IAF - Inclusão Automática de Filhos',
  'DIT - Diária de Incapacidade Temporária',
  'DMH - Despesas Médico Hospitalares',
  'Doenças Graves',
  'AFF - Assistência Funeral Familiar (Informar prazo para pagamento)',
  'AFI - Assistência Funeral Individual (Informar prazo para pagamento)',
  'Auxilio Funeral',
  'Cesta Básica',
  'Cobertura para Embriaguez',
  'Outros'
]

const CoberturaForm = ({ coberturaId, apoliceId, onSuccess, onCancel }: CoberturaFormProps) => {
  const [formData, setFormData] = useState({
    tipoMultiplicador: '',
    multiplicadorMin: '',
    multiplicadorMax: '',
    multiplo: '',
    taxaAdm: ''
  })
  const [coberturaItems, setCoberturaItems] = useState<Array<{
    id?: string
    nome: string
    selecionado: boolean
    tipoValor: string
    percentualTitular: string
    percentualConjuge: string
    percentualFilhos: string
    valorFixoTitular: string
    valorFixoConjuge: string
    valorFixoFilhos: string
  }>>([])
  const [novoItemNome, setNovoItemNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (coberturaId) {
      fetchCobertura()
    } else {
      // Inicializar com coberturas padrão
      setCoberturaItems(COBERTURAS_PADRAO.map(nome => ({
        nome,
        selecionado: false,
        tipoValor: 'PERCENTUAL',
        percentualTitular: '',
        percentualConjuge: '',
        percentualFilhos: '',
        valorFixoTitular: '',
        valorFixoConjuge: '',
        valorFixoFilhos: ''
      })))
    }
  }, [coberturaId])

  const fetchCobertura = async () => {
    try {
      const response = await api.get(`/coberturas?apoliceId=${apoliceId}`)
      const cobertura = response.data
      
      setFormData({
        tipoMultiplicador: cobertura.tipoMultiplicador || '',
        multiplicadorMin: cobertura.multiplicadorMin?.toString() || '',
        multiplicadorMax: cobertura.multiplicadorMax?.toString() || '',
        multiplo: cobertura.multiplo?.toString() || '',
        taxaAdm: cobertura.taxaAdm?.toString() || ''
      })

      // Carregar itens existentes e mesclar com padrões
      const itemsExistentes = cobertura.items || []
      const itemsMap = new Map(itemsExistentes.map((item: any) => [item.nome, item]))
      
      setCoberturaItems(COBERTURAS_PADRAO.map(nome => {
        const itemExistente = itemsMap.get(nome)
        if (itemExistente) {
          return {
            id: (itemExistente as any).id,
            nome: (itemExistente as any).nome,
            selecionado: (itemExistente as any).selecionado,
            tipoValor: (itemExistente as any).tipoValor || 'PERCENTUAL',
            percentualTitular: (itemExistente as any).percentualTitular?.toString() || '',
            percentualConjuge: (itemExistente as any).percentualConjuge?.toString() || '',
            percentualFilhos: (itemExistente as any).percentualFilhos?.toString() || '',
            valorFixoTitular: (itemExistente as any).valorFixoTitular?.toString() || '',
            valorFixoConjuge: (itemExistente as any).valorFixoConjuge?.toString() || '',
            valorFixoFilhos: (itemExistente as any).valorFixoFilhos?.toString() || ''
          }
        }
        return {
          nome,
          selecionado: false,
          tipoValor: 'PERCENTUAL',
          percentualTitular: '',
          percentualConjuge: '',
          percentualFilhos: '',
          valorFixoTitular: '',
          valorFixoConjuge: '',
          valorFixoFilhos: ''
        }
      }))
      
      // Adicionar itens customizados que não estão na lista padrão
      const itensCustomizados = itemsExistentes.filter((item: any) => !COBERTURAS_PADRAO.includes(item.nome))
      if (itensCustomizados.length > 0) {
        setCoberturaItems(prev => [
          ...prev,
          ...itensCustomizados.map((item: any) => ({
            id: item.id,
            nome: item.nome,
            selecionado: item.selecionado,
            tipoValor: item.tipoValor || 'PERCENTUAL',
            percentualTitular: item.percentualTitular?.toString() || '',
            percentualConjuge: item.percentualConjuge?.toString() || '',
            percentualFilhos: item.percentualFilhos?.toString() || '',
            valorFixoTitular: item.valorFixoTitular?.toString() || '',
            valorFixoConjuge: item.valorFixoConjuge?.toString() || '',
            valorFixoFilhos: item.valorFixoFilhos?.toString() || ''
          }))
        ])
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar cobertura')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    setCoberturaItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    setLoading(true)

    try {
      const data = {
        apoliceId,
        tipoMultiplicador: formData.tipoMultiplicador || null,
        multiplicadorMin: formData.multiplicadorMin ? parseFloat(formData.multiplicadorMin) : null,
        multiplicadorMax: formData.multiplicadorMax ? parseFloat(formData.multiplicadorMax) : null,
        multiplo: formData.multiplo ? parseFloat(formData.multiplo) : null,
        taxaAdm: formData.taxaAdm ? parseFloat(formData.taxaAdm) : null
      }

      let savedCobertura
      if (coberturaId) {
        const response = await api.put(`/coberturas/${coberturaId}`, data)
        savedCobertura = response.data
        console.log('Cobertura atualizada:', savedCobertura)
      } else {
        const response = await api.post('/coberturas', data)
        savedCobertura = response.data
        console.log('Cobertura criada:', savedCobertura)
      }

      if (!savedCobertura || !savedCobertura.id) {
        throw new Error('Erro ao salvar cobertura: ID não retornado')
      }

      // Salvar ou atualizar itens
      // Primeiro, buscar itens existentes para atualizar ou criar
      let existingItems: any[] = []
      let existingItemsMap = new Map()
      
      try {
        const existingItemsResponse = await api.get(`/cobertura-items?coberturaId=${savedCobertura.id}`)
        existingItems = existingItemsResponse.data.data || []
        existingItemsMap = new Map(existingItems.map((item: any) => [item.nome, item]))
      } catch (fetchError) {
        console.error('Erro ao buscar itens existentes:', fetchError)
        // Continuar mesmo se não conseguir buscar itens existentes
      }

      const savePromises = coberturaItems.map(async (item) => {
        const itemData: any = {
          coberturaId: savedCobertura.id,
          nome: item.nome,
          selecionado: item.selecionado,
          tipoValor: item.tipoValor || null
        }

        // Adicionar campos baseados no tipo
        if (item.tipoValor === 'PERCENTUAL') {
          itemData.percentualTitular = item.percentualTitular && item.percentualTitular.trim() !== '' ? parseFloat(item.percentualTitular) : null
          itemData.percentualConjuge = item.percentualConjuge && item.percentualConjuge.trim() !== '' ? parseFloat(item.percentualConjuge) : null
          itemData.percentualFilhos = item.percentualFilhos && item.percentualFilhos.trim() !== '' ? parseFloat(item.percentualFilhos) : null
          itemData.valorFixoTitular = null
          itemData.valorFixoConjuge = null
          itemData.valorFixoFilhos = null
        } else if (item.tipoValor === 'VALOR_FIXO') {
          itemData.valorFixoTitular = item.valorFixoTitular && item.valorFixoTitular.trim() !== '' ? parseFloat(item.valorFixoTitular) : null
          itemData.valorFixoConjuge = item.valorFixoConjuge && item.valorFixoConjuge.trim() !== '' ? parseFloat(item.valorFixoConjuge) : null
          itemData.valorFixoFilhos = item.valorFixoFilhos && item.valorFixoFilhos.trim() !== '' ? parseFloat(item.valorFixoFilhos) : null
          itemData.percentualTitular = null
          itemData.percentualConjuge = null
          itemData.percentualFilhos = null
        } else {
          // Se não tem tipo definido, limpar todos os campos
          itemData.percentualTitular = null
          itemData.percentualConjuge = null
          itemData.percentualFilhos = null
          itemData.valorFixoTitular = null
          itemData.valorFixoConjuge = null
          itemData.valorFixoFilhos = null
        }

        const existingItem = existingItemsMap.get(item.nome) || (item.id ? existingItems.find((ei: any) => ei.id === item.id) : null)
        
        try {
          if (existingItem) {
            // Atualizar item existente
            const response = await api.put(`/cobertura-items/${existingItem.id}`, itemData)
            return { success: true, item: response.data }
          } else {
            // Criar novo item
            const response = await api.post('/cobertura-items', itemData)
            return { success: true, item: response.data }
          }
        } catch (itemError: any) {
          console.error(`Erro ao salvar item ${item.nome}:`, itemError)
          console.error('Dados do item:', itemData)
          return { success: false, item: item.nome, error: itemError }
        }
      })

      const results = await Promise.all(savePromises)
      const failed = results.filter(r => !r.success)
      const succeeded = results.filter(r => r.success)
      
      console.log(`Itens salvos: ${succeeded.length}, Falhas: ${failed.length}`)
      
      if (failed.length > 0) {
        console.error('Alguns itens falharam ao salvar:', failed)
        const errorDetails = failed.map(f => f.error?.response?.data?.error || f.error?.message || 'Erro desconhecido').join(', ')
        setError(`Erro ao salvar ${failed.length} item(ns): ${errorDetails}`)
        setLoading(false)
        return
      }

      if (succeeded.length === 0) {
        setError('Nenhum item foi salvo. Verifique se há itens selecionados.')
        setLoading(false)
        return
      }

      onSuccess()
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.details?.[0]?.message ||
                          'Erro ao salvar cobertura'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="error-message">{error}</div>}

      <div className="form-section-title" style={{ marginBottom: '16px' }}>Multiplicadores</div>
      <div className="form-row">
        <div className="form-group">
          <label className="label">Tipo de Multiplicador</label>
          <select
            name="tipoMultiplicador"
            className="input"
            value={formData.tipoMultiplicador}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Selecione o tipo</option>
            <option value="SALARIAL">Múltiplo Salarial</option>
            <option value="UNIFORME">Uniforme</option>
            <option value="ESCALONADO">Escalonado</option>
            <option value="GLOBAL">Global</option>
          </select>
        </div>
      </div>

      {formData.tipoMultiplicador && (
        <div className="form-row">
          <div className="form-group">
            <label className="label">Mínimo</label>
            <input
              type="number"
              step="0.01"
              name="multiplicadorMin"
              className="input"
              value={formData.multiplicadorMin}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label className="label">Máximo</label>
            <input
              type="number"
              step="0.01"
              name="multiplicadorMax"
              className="input"
              value={formData.multiplicadorMax}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      )}

      {formData.tipoMultiplicador === 'SALARIAL' && (
        <div className="form-row">
          <div className="form-group">
            <label className="label">Múltiplo</label>
            <input
              type="number"
              step="0.01"
              name="multiplo"
              className="input"
              value={formData.multiplo}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label className="label">Taxa Adm</label>
          <input
            type="number"
            step="0.01"
            name="taxaAdm"
            className="input"
            value={formData.taxaAdm}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-section-title" style={{ marginTop: '24px', marginBottom: '16px' }}>Coberturas</div>
      
      {/* Campo para adicionar novos itens quando "Outros" estiver selecionado */}
      {coberturaItems.some(item => item.nome === 'Outros' && item.selecionado) && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f0f0', borderRadius: '6px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className="input"
              placeholder="Digite o nome da nova cobertura"
              value={novoItemNome}
              onChange={(e) => setNovoItemNome(e.target.value)}
              disabled={loading}
              style={{ flex: 1, padding: '8px' }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (novoItemNome.trim()) {
                    setCoberturaItems(prev => [...prev, {
                      nome: novoItemNome.trim(),
                      selecionado: true,
                      tipoValor: 'PERCENTUAL',
                      percentualTitular: '',
                      percentualConjuge: '',
                      percentualFilhos: '',
                      valorFixoTitular: '',
                      valorFixoConjuge: '',
                      valorFixoFilhos: ''
                    }])
                    setNovoItemNome('')
                  }
                }
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (novoItemNome.trim()) {
                  setCoberturaItems(prev => [...prev, {
                    nome: novoItemNome.trim(),
                    selecionado: true,
                    tipoValor: 'PERCENTUAL',
                    percentualTitular: '',
                    percentualConjuge: '',
                    percentualFilhos: '',
                    valorFixoTitular: '',
                    valorFixoConjuge: '',
                    valorFixoFilhos: ''
                  }])
                  setNovoItemNome('')
                }
              }}
              disabled={loading || !novoItemNome.trim()}
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      <div style={{ 
        background: '#f9f9f9',
        borderRadius: '6px',
        padding: '16px'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          background: 'white', 
          borderRadius: '4px', 
          overflow: 'hidden', 
          fontSize: '12px' 
        }}>
          <thead>
            <tr>
              <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Coberturas</th>
              <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Tipo</th>
              <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Titular</th>
              <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Cônjuge</th>
              <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Filhos</th>
              <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {coberturaItems.map((item, index) => {
              const isCustomizado = !COBERTURAS_PADRAO.includes(item.nome)
              return (
                <tr key={index}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={item.selecionado}
                        onChange={(e) => handleItemChange(index, 'selecionado', e.target.checked)}
                        disabled={loading}
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          minWidth: '16px',
                          minHeight: '16px',
                          maxWidth: '16px',
                          maxHeight: '16px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          margin: 0,
                          flexShrink: 0
                        }}
                      />
                      <span style={{ flex: 1 }}>{item.nome}</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9' }}>
                    <select
                      className="input"
                      style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                      value={item.tipoValor || 'PERCENTUAL'}
                      onChange={(e) => handleItemChange(index, 'tipoValor', e.target.value)}
                      disabled={loading || !item.selecionado}
                    >
                      <option value="PERCENTUAL">Percentual (%)</option>
                      <option value="VALOR_FIXO">Valor Fixo (R$)</option>
                    </select>
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9' }}>
                    {item.tipoValor === 'VALOR_FIXO' ? (
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                        placeholder="R$ 0,00"
                        value={item.valorFixoTitular}
                        onChange={(e) => handleItemChange(index, 'valorFixoTitular', e.target.value)}
                        disabled={loading || !item.selecionado}
                      />
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                        placeholder="0%"
                        value={item.percentualTitular}
                        onChange={(e) => handleItemChange(index, 'percentualTitular', e.target.value)}
                        disabled={loading || !item.selecionado}
                      />
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9' }}>
                    {item.tipoValor === 'VALOR_FIXO' ? (
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                        placeholder="R$ 0,00"
                        value={item.valorFixoConjuge}
                        onChange={(e) => handleItemChange(index, 'valorFixoConjuge', e.target.value)}
                        disabled={loading || !item.selecionado}
                      />
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                        placeholder="0%"
                        value={item.percentualConjuge}
                        onChange={(e) => handleItemChange(index, 'percentualConjuge', e.target.value)}
                        disabled={loading || !item.selecionado}
                      />
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9' }}>
                    {item.tipoValor === 'VALOR_FIXO' ? (
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                        placeholder="R$ 0,00"
                        value={item.valorFixoFilhos}
                        onChange={(e) => handleItemChange(index, 'valorFixoFilhos', e.target.value)}
                        disabled={loading || !item.selecionado}
                      />
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                        placeholder="0%"
                        value={item.percentualFilhos}
                        onChange={(e) => handleItemChange(index, 'percentualFilhos', e.target.value)}
                        disabled={loading || !item.selecionado}
                      />
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9' }}>
                    {isCustomizado && (
                      <button
                        type="button"
                        className="btn-icon"
                        title="Remover"
                        onClick={async () => {
                          if (item.id) {
                            try {
                              await api.delete(`/cobertura-items/${item.id}`)
                            } catch (err) {
                              console.error('Erro ao remover item:', err)
                            }
                          }
                          setCoberturaItems(prev => prev.filter((_, i) => i !== index))
                        }}
                        disabled={loading}
                        style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} style={{ color: '#dc3545' }} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
          {loading ? 'Salvando...' : coberturaId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default CoberturaForm

