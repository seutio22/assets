import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { fetchProdutos as fetchProdutosService, fetchPortes as fetchPortesService } from '../services/structuralData'
import './Form.css'

interface ApoliceFormProps {
  apoliceId?: string
  onSuccess: () => void
  onCancel: () => void
}

const ApoliceForm = ({ apoliceId, onSuccess, onCancel }: ApoliceFormProps) => {
  const [formData, setFormData] = useState({
    grupoEconomicoId: '',
    clienteId: '',
    fornecedorId: '',
    numero: '',
    produto: '',
    codigoCNAE: '',
    ramoAtividade: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    porteCliente: '',
    dataVigenciaMDS: '',
    dataVigenciaContratoInicio: '',
    status: 'ATIVA'
  })
  const [gruposEconomicos, setGruposEconomicos] = useState<Array<{ id: string; name: string }>>([])
  const [empresas, setEmpresas] = useState<Array<{ id: string; cnpj: string; razaoSocial: string; grupoEconomico: { name: string } }>>([])
  const [fornecedores, setFornecedores] = useState<Array<{ id: string; razaoSocial: string }>>([])
  const [produtos, setProdutos] = useState<Array<{ id: string; valor: string }>>([])
  const [portes, setPortes] = useState<Array<{ id: string; valor: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Carregar dados iniciais sempre que o componente montar
  useEffect(() => {
    console.log('ApoliceForm montado, apoliceId:', apoliceId)
    
    const loadData = async () => {
      // Sempre carregar produtos e portes primeiro - SEMPRE, independente de apoliceId
      console.log('Iniciando carregamento de produtos e portes...')
      await Promise.all([fetchProdutos(), fetchPortes()])
      console.log('Produtos e portes carregados, continuando...')
      
      // Depois carregar os outros dados
      fetchGruposEconomicos()
      fetchFornecedores()
      
      // Se houver apoliceId, carregar a apólice após produtos e portes estarem prontos
      if (apoliceId) {
        console.log('ApoliceId encontrado, aguardando dados e carregando apólice...')
        // Pequeno delay para garantir que dados estejam no estado
        setTimeout(() => {
          fetchApolice()
        }, 300)
      }
    }
    
    loadData()
  }, []) // Sem dependências - executa apenas quando o componente monta

  // Carregar apólice quando apoliceId mudar (para casos onde o componente já está montado)
  useEffect(() => {
    if (apoliceId && produtos.length > 0) {
      console.log('ApoliceId mudou e produtos já estão carregados, carregando apólice...')
      fetchApolice()
    }
  }, [apoliceId])

  // Atualizar produtos quando necessário para garantir que o valor da apólice esteja na lista
  useEffect(() => {
    if (apoliceId && formData.produto && produtos.length > 0) {
      const produtoExiste = produtos.some(p => p.valor === formData.produto)
      if (!produtoExiste && formData.produto.trim() !== '') {
        setProdutos(prev => [...prev, { id: `temp-${Date.now()}`, valor: formData.produto }])
      }
    }
  }, [apoliceId, formData.produto, produtos.length])

  useEffect(() => {
    if (formData.grupoEconomicoId) {
      fetchEmpresasPorGrupo()
    } else {
      setEmpresas([])
      setFormData(prev => ({ ...prev, clienteId: '' }))
    }
  }, [formData.grupoEconomicoId])

  const fetchGruposEconomicos = async () => {
    try {
      const response = await api.get('/grupos-economicos?limit=1000')
      setGruposEconomicos(response.data.data || [])
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
    }
  }

  const fetchEmpresasPorGrupo = async () => {
    try {
      const response = await api.get(`/empresas?grupoEconomicoId=${formData.grupoEconomicoId}&limit=1000`)
      setEmpresas(response.data.data || [])
    } catch (err) {
      console.error('Erro ao carregar empresas:', err)
      setEmpresas([])
    }
  }

  const fetchFornecedores = async () => {
    try {
      const response = await api.get('/fornecedores?limit=1000')
      setFornecedores(response.data.data || [])
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err)
    }
  }

  const fetchProdutos = async () => {
    try {
      console.log('Carregando produtos do módulo Dados...')
      const produtosData = await fetchProdutosService()
      console.log(`${produtosData.length} produtos carregados:`, produtosData.map(p => p.valor))
      setProdutos(produtosData)
      
      if (produtosData.length === 0) {
        console.warn('Nenhum produto ativo encontrado. Verifique se há dados cadastrados no módulo Dados.')
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
      setProdutos([])
    }
  }

  const fetchPortes = async () => {
    try {
      console.log('Carregando portes do módulo Dados...')
      const portesData = await fetchPortesService()
      console.log(`${portesData.length} portes carregados:`, portesData.map(p => p.valor))
      setPortes(portesData)
      
      if (portesData.length === 0) {
        console.warn('Nenhum porte ativo encontrado. Verifique se há dados cadastrados no módulo Dados.')
      }
    } catch (err) {
      console.error('Erro ao carregar portes:', err)
      setPortes([])
    }
  }

  const fetchApolice = async () => {
    try {
      const response = await api.get(`/apolices/${apoliceId}`)
      const apolice = response.data
      const grupoEconomicoId = apolice.empresa?.grupoEconomico?.id || apolice.empresa?.grupoEconomicoId || ''
      const produtoValue = apolice.produto || ''
      
      setFormData({
        grupoEconomicoId: grupoEconomicoId,
        clienteId: apolice.clienteId || apolice.empresa?.id || '',
        fornecedorId: apolice.fornecedorId || apolice.fornecedor?.id || '',
        numero: apolice.numero || '',
        produto: produtoValue,
        codigoCNAE: apolice.codigoCNAE || '',
        ramoAtividade: apolice.ramoAtividade || '',
        inscricaoEstadual: apolice.inscricaoEstadual || '',
        inscricaoMunicipal: apolice.inscricaoMunicipal || '',
        porteCliente: apolice.porteCliente || '',
        dataVigenciaMDS: apolice.dataVigenciaMDS ? new Date(apolice.dataVigenciaMDS).toISOString().split('T')[0] : '',
        dataVigenciaContratoInicio: apolice.dataVigenciaContratoInicio ? new Date(apolice.dataVigenciaContratoInicio).toISOString().split('T')[0] : '',
        status: apolice.status || 'ATIVA'
      })

      // Carregar empresas do grupo se já tiver grupo selecionado
      if (grupoEconomicoId) {
        const empresasResponse = await api.get(`/empresas?grupoEconomicoId=${grupoEconomicoId}&limit=1000`)
        setEmpresas(empresasResponse.data.data || [])
      }
      
      // Verificar se o produto precisa ser adicionado à lista após um pequeno delay
      // para garantir que os produtos já foram carregados
      setTimeout(() => {
        if (produtoValue && produtos.length > 0) {
          const produtoExiste = produtos.some(p => p.valor === produtoValue)
          if (!produtoExiste) {
            // Adicionar o produto atual à lista para que apareça no select
            setProdutos(prev => [...prev, { id: `temp-${Date.now()}`, valor: produtoValue }])
          }
        }
      }, 300)

      // Verificar se o porte precisa ser adicionado à lista
      const porteValue = apolice.porteCliente || ''
      setTimeout(() => {
        if (porteValue && portes.length > 0) {
          const porteExiste = portes.some(p => p.valor === porteValue)
          if (!porteExiste) {
            // Adicionar o porte atual à lista para que apareça no select
            setPortes(prev => [...prev, { id: `temp-${Date.now()}`, valor: porteValue }])
          }
        }
      }, 300)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Erro ao carregar apólice')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.numero.trim()) {
      setError('Número da apólice é obrigatório')
      return
    }

    if (!formData.grupoEconomicoId) {
      setError('Cliente é obrigatório')
      return
    }

    if (!formData.clienteId) {
      setError('Empresa é obrigatória')
      return
    }

    if (!formData.fornecedorId) {
      setError('Fornecedor é obrigatório')
      return
    }

    setLoading(true)

    try {
      const { grupoEconomicoId, ...apoliceData } = formData
      const data = {
        ...apoliceData,
        produto: formData.produto || undefined,
        codigoCNAE: formData.codigoCNAE || undefined,
        ramoAtividade: formData.ramoAtividade || undefined,
        inscricaoEstadual: formData.inscricaoEstadual || undefined,
        inscricaoMunicipal: formData.inscricaoMunicipal || undefined,
        porteCliente: formData.porteCliente || undefined,
        dataVigenciaMDS: formData.dataVigenciaMDS ? new Date(formData.dataVigenciaMDS).toISOString() : undefined,
        dataVigenciaContratoInicio: formData.dataVigenciaContratoInicio ? new Date(formData.dataVigenciaContratoInicio).toISOString() : undefined,
        status: formData.status || undefined
      }

      if (apoliceId) {
        await api.put(`/apolices/${apoliceId}`, data)
      } else {
        await api.post('/apolices', data)
      }
      onSuccess()
    } catch (err: any) {
      const error = err as { response?: { data?: { error?: string; details?: Array<{ message?: string }> } } }
      console.error('Erro ao salvar apólice:', err)
      console.error('Detalhes do erro:', error.response?.data)
      const errorMessage = error.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          err.response?.data?.details || 
                          err.message || 
                          'Erro ao salvar apólice'
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
          <label htmlFor="numero" className="label">
            N° Apólice *
          </label>
          <input
            id="numero"
            name="numero"
            type="text"
            className="input"
            value={formData.numero}
            onChange={handleChange}
            required
            placeholder="Número da apólice"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="status" className="label">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="input"
            value={formData.status}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="VENCIDA">Vencida</option>
          </select>
        </div>
      </div>

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
          disabled={loading}
        >
          <option value="">Selecione um cliente</option>
          {gruposEconomicos.map(grupo => (
            <option key={grupo.id} value={grupo.id}>
              {grupo.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="clienteId" className="label">
            Empresa (CNPJ) *
          </label>
          <select
            id="clienteId"
            name="clienteId"
            className="input"
            value={formData.clienteId}
            onChange={handleChange}
            required
            disabled={loading || !formData.grupoEconomicoId}
          >
            <option value="">
              {formData.grupoEconomicoId ? 'Selecione uma empresa' : 'Primeiro selecione um cliente'}
            </option>
            {empresas.map(empresa => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.cnpj} - {empresa.razaoSocial}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="fornecedorId" className="label">
            Fornecedor *
          </label>
          <select
            id="fornecedorId"
            name="fornecedorId"
            className="input"
            value={formData.fornecedorId}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">Selecione um fornecedor</option>
            {fornecedores.map(fornecedor => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.razaoSocial}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="produto" className="label">
          Produto
        </label>
        <input
          id="produto"
          name="produto"
          type="text"
          className="input"
          value={formData.produto}
          onChange={handleChange}
          list="produtos-list"
          placeholder="Selecione ou digite um produto"
          disabled={loading}
        />
        <datalist id="produtos-list">
          {produtos.map(produto => (
            <option key={produto.id} value={produto.valor}>
              {produto.valor}
            </option>
          ))}
        </datalist>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="codigoCNAE" className="label">
            Código CNAE
          </label>
          <input
            id="codigoCNAE"
            name="codigoCNAE"
            type="text"
            className="input"
            value={formData.codigoCNAE}
            onChange={handleChange}
            placeholder="Código CNAE"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="ramoAtividade" className="label">
            Ramo de Atividade
          </label>
          <input
            id="ramoAtividade"
            name="ramoAtividade"
            type="text"
            className="input"
            value={formData.ramoAtividade}
            onChange={handleChange}
            placeholder="Ramo de atividade"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="inscricaoEstadual" className="label">
            Inscrição Estadual
          </label>
          <input
            id="inscricaoEstadual"
            name="inscricaoEstadual"
            type="text"
            className="input"
            value={formData.inscricaoEstadual}
            onChange={handleChange}
            placeholder="Inscrição Estadual"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="inscricaoMunicipal" className="label">
            Inscrição Municipal
          </label>
          <input
            id="inscricaoMunicipal"
            name="inscricaoMunicipal"
            type="text"
            className="input"
            value={formData.inscricaoMunicipal}
            onChange={handleChange}
            placeholder="Inscrição Municipal"
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="porteCliente" className="label">
          Porte do Cliente
        </label>
        <input
          id="porteCliente"
          name="porteCliente"
          type="text"
          className="input"
          value={formData.porteCliente}
          onChange={handleChange}
          list="portes-list"
          placeholder="Selecione ou digite o porte"
          disabled={loading}
        />
        <datalist id="portes-list">
          {portes.map(porte => (
            <option key={porte.id} value={porte.valor}>
              {porte.valor}
            </option>
          ))}
        </datalist>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dataVigenciaMDS" className="label">
            Data de Vigência MDS
          </label>
          <input
            id="dataVigenciaMDS"
            name="dataVigenciaMDS"
            type="date"
            className="input"
            value={formData.dataVigenciaMDS}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dataVigenciaContratoInicio" className="label">
            Data de Vigência do Contrato
          </label>
          <input
            id="dataVigenciaContratoInicio"
            name="dataVigenciaContratoInicio"
            type="date"
            className="input"
            value={formData.dataVigenciaContratoInicio}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
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
          {loading ? 'Salvando...' : apoliceId ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

export default ApoliceForm

