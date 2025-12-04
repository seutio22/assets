import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import SearchableSelect from './SearchableSelect'
import { Edit, ChevronDown } from 'lucide-react'
import './Form.css'
import './ChamadoFormWizard.css'

interface ChamadoFormProps {
  chamadoId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

type Perfil = 'COMERCIAL' | 'RELACIONAMENTO'

const ChamadoForm = ({ chamadoId, onSuccess, onCancel }: ChamadoFormProps) => {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState<Perfil>('COMERCIAL')
  const [tipoApolice, setTipoApolice] = useState<'NOVA' | 'NOMEACAO' | 'EXISTENTE'>('NOVA')
  const [apoliceSelecionadaId, setApoliceSelecionadaId] = useState('')
  const [apolices, setApolices] = useState<Array<{ id: string; numero: string; empresa: { razaoSocial: string } }>>([])
  
  const [chamadoData, setChamadoData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'MEDIA'
  })
  
  const [quantidadeApolices, setQuantidadeApolices] = useState<number>(1)
  const [apolicesForm, setApolicesForm] = useState<Array<{
    tipo: 'NOVA' | 'NOMEACAO' | 'EXISTENTE'
    apoliceId?: string
    dados: typeof apoliceData
  }>>([])
  const [mostrarFormulariosApolices, setMostrarFormulariosApolices] = useState(false)

  const [apoliceData, setApoliceData] = useState({
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
    dataVigenciaContratoFim: '',
    periodoVigencia: '',
    limiteTecnico: '',
    regimeContratacao: '',
    tipoContrato: '',
    coparticipacao: '',
    mesReajuste: '',
    dataVencimentoFatura: '',
    emissao: '',
    dataEntrega: '',
    dataCorte: '',
    codigoProducaoAngariador: '',
    status: 'ATIVA',
    clienteManual: false,
    cnpjManual: '',
    razaoSocialManual: ''
  })

  const [gruposEconomicos, setGruposEconomicos] = useState<Array<{ id: string; name: string }>>([])
  const [empresas, setEmpresas] = useState<Array<{ id: string; cnpj: string; razaoSocial: string; grupoEconomico: { name: string } }>>([])
  const [fornecedores, setFornecedores] = useState<Array<{ id: string; razaoSocial: string }>>([])
  const [produtos, setProdutos] = useState<Array<{ id: string; valor: string }>>([])
  const [portes, setPortes] = useState<Array<{ id: string; valor: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Estados para o wizard
  type WizardStep = 'ESTIPULANTE' | 'COMISSAO' | 'OPERACIONAL' | 'QUESTIONARIO'
  const [currentStep, setCurrentStep] = useState<WizardStep>('ESTIPULANTE')
  const [expandedFichaItem, setExpandedFichaItem] = useState<string | null>('abertura-chamado')
  
  // Atualizar expandedFichaItem quando mostrarFormulariosApolices mudar
  useEffect(() => {
    if (mostrarFormulariosApolices) {
      setExpandedFichaItem('cadastro-estipulante')
    }
  }, [mostrarFormulariosApolices])
  
  const fichaTecnicaItems = [
    { id: 'abertura-chamado', title: 'Abertura de chamado', icon: 'user-plus-doc' },
    ...(mostrarFormulariosApolices ? [{ id: 'cadastro-estipulante', title: 'Cadastro Estipulante', icon: 'user-plus-doc' }] : []),
    { id: 'contato-empresa', title: 'Contato Empresa', icon: 'phone' },
    { id: 'condicoes-contratuais', title: 'Condições Contratuais', icon: 'doc-pen' },
    { id: 'empresas-participantes', title: 'Empresas Participantes do Contrato', icon: 'buildings' },
    { id: 'condicoes-plano', title: 'Condições do Plano', icon: 'user-doc' },
    { id: 'condicoes-complementares', title: 'Condições Complementares', icon: 'doc-lines' }
  ]

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchProdutos(), fetchPortes()])
      fetchApolices() // Apenas para seleção de apólice existente
      
      if (chamadoId) {
        fetchChamado()
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (apoliceData.grupoEconomicoId) {
      fetchEmpresasPorGrupo()
    } else {
      setEmpresas([])
      setApoliceData(prev => ({ ...prev, clienteId: '' }))
    }
  }, [apoliceData.grupoEconomicoId])

  // Não precisamos mais carregar empresas antecipadamente, o SearchableSelect faz isso sob demanda

  // Resetar tipo de apólice quando o perfil mudar
  useEffect(() => {
    if (perfil === 'COMERCIAL') {
      setTipoApolice('NOVA')
    } else {
      setTipoApolice('EXISTENTE')
    }
  }, [perfil])

  const fetchApolices = async () => {
    try {
      const response = await api.get('/apolices?limit=1000')
      setApolices(response.data.data || [])
    } catch (err) {
      console.error('Erro ao carregar apólices:', err)
    }
  }

  const fetchChamado = async () => {
    try {
      const response = await api.get(`/chamados-implantacao/${chamadoId}`)
      const chamado = response.data
      setChamadoData({
        titulo: chamado.titulo || '',
        descricao: chamado.descricao || '',
        prioridade: chamado.prioridade || 'MEDIA'
      })
      // TODO: Carregar múltiplas apólices quando implementar no backend
      if (chamado.apoliceId) {
        setApoliceSelecionadaId(chamado.apoliceId)
        setTipoApolice('EXISTENTE')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar chamado')
    }
  }

  const fetchGruposEconomicos = async () => {
    try {
      const response = await api.get('/grupos-economicos?limit=1000')
      setGruposEconomicos(response.data.data || [])
    } catch (err) {
      console.error('Erro ao carregar grupos econômicos:', err)
    }
  }

  const fetchEmpresasPorGrupo = async () => {
    try {
      const response = await api.get(`/empresas?grupoEconomicoId=${apoliceData.grupoEconomicoId}&limit=1000`)
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
      const moduloResponse = await api.get('/modulos?nome=APOLICE')
      const modulos = moduloResponse.data.data || []
      const modulo = modulos.find((m: { nome: string }) => m.nome === 'APOLICE')

      if (!modulo) {
        setProdutos([])
        return
      }

      const configResponse = await api.get(`/configuracoes-campo?moduloId=${modulo.id}`)
      const configuracoes = configResponse.data.data || []
      const configProduto = configuracoes.find((c: { nome: string }) => 
        c.nome.toLowerCase() === 'produto'
      )

      if (!configProduto) {
        setProdutos([])
        return
      }

      const dadosResponse = await api.get(`/dados-dinamicos?configuracaoCampoId=${configProduto.id}`)
      const dados = dadosResponse.data.data || []
      const produtosFormatados = dados
        .filter((d: { ativo: boolean }) => d.ativo !== false)
        .map((d: { id: string; valor: string }) => ({ id: d.id, valor: d.valor }))
      
      setProdutos(produtosFormatados)
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
      setProdutos([])
    }
  }

  const fetchPortes = async () => {
    try {
      const moduloResponse = await api.get('/modulos?nome=APOLICE')
      const modulos = moduloResponse.data.data || []
      const modulo = modulos.find((m: { nome: string }) => m.nome === 'APOLICE')

      if (!modulo) {
        setPortes([])
        return
      }

      const configResponse = await api.get(`/configuracoes-campo?moduloId=${modulo.id}`)
      const configuracoes = configResponse.data.data || []
      const configPorte = configuracoes.find((c: { nome: string }) => 
        c.nome.toLowerCase() === 'porte'
      )

      if (!configPorte) {
        setPortes([])
        return
      }

      const dadosResponse = await api.get(`/dados-dinamicos?configuracaoCampoId=${configPorte.id}`)
      const dados = dadosResponse.data.data || []
      const portesFormatados = dados
        .filter((d: { ativo: boolean }) => d.ativo !== false)
        .map((d: { id: string; valor: string }) => ({ id: d.id, valor: d.valor }))
      
      setPortes(portesFormatados)
    } catch (err) {
      console.error('Erro ao carregar portes:', err)
      setPortes([])
    }
  }

  const handleChamadoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setChamadoData(prev => ({ ...prev, [name]: value }))
  }

  const handleApoliceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setApoliceData(prev => ({ ...prev, [name]: value }))
  }

  const handleApoliceFormChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const novasApolices = [...apolicesForm]
    novasApolices[index].dados = { ...novasApolices[index].dados, [name]: value }
    setApolicesForm(novasApolices)
  }

  const handleApoliceSelecionadaChange = (index: number, apoliceId: string) => {
    const novasApolices = [...apolicesForm]
    novasApolices[index].apoliceId = apoliceId
    setApolicesForm(novasApolices)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!chamadoData.titulo.trim()) {
      setError('Título é obrigatório')
      return
    }

    if (!mostrarFormulariosApolices || apolicesForm.length === 0) {
      setError('Defina a quantidade de apólices e preencha os dados')
      return
    }

    // Validar todas as apólices
    for (let i = 0; i < apolicesForm.length; i++) {
      const apoliceForm = apolicesForm[i]
      
      if (apoliceForm.tipo === 'EXISTENTE' && !apoliceForm.apoliceId) {
        setError(`Selecione uma apólice existente para a Apólice ${i + 1}`)
        return
      }

      if (apoliceForm.tipo === 'NOVA' || apoliceForm.tipo === 'NOMEACAO') {
        if (!apoliceForm.dados.fornecedorId) {
          setError(`Para a Apólice ${i + 1}, o Fornecedor é obrigatório`)
          return
        }
        
        // Validar cliente: se manual, precisa de CNPJ e Razão Social; se do sistema, precisa de clienteId
        if (apoliceForm.dados.clienteManual) {
          if (!apoliceForm.dados.cnpjManual.trim() || !apoliceForm.dados.razaoSocialManual.trim()) {
            setError(`Para a Apólice ${i + 1}, preencha CNPJ e Razão Social quando informar cliente manualmente`)
            return
          }
        } else {
          if (!apoliceForm.dados.clienteId) {
            setError(`Para a Apólice ${i + 1}, selecione um Cliente`)
            return
          }
        }
      }
    }

    setLoading(true)

    try {
      // Processar cada apólice e criar um chamado para cada uma
      const chamadosCriados = []
      
      for (let i = 0; i < apolicesForm.length; i++) {
        const apoliceForm = apolicesForm[i]
        let apoliceId = apoliceForm.apoliceId

        // Se for nova apólice ou nomeação, criar nova apólice primeiro
        if (apoliceForm.tipo === 'NOVA' || apoliceForm.tipo === 'NOMEACAO') {
          let clienteIdFinal = apoliceForm.dados.clienteId

          // Se for cliente manual, criar grupo econômico e empresa primeiro
          if (apoliceForm.dados.clienteManual) {
            try {
              // Criar grupo econômico com o nome da razão social
              const grupoResponse = await api.post('/grupos-economicos', {
                name: apoliceForm.dados.razaoSocialManual
              })
              
              // Criar empresa
              const empresaResponse = await api.post('/empresas', {
                grupoEconomicoId: grupoResponse.data.id,
                cnpj: apoliceForm.dados.cnpjManual.replace(/\D/g, ''), // Remove formatação do CNPJ
                razaoSocial: apoliceForm.dados.razaoSocialManual
              })
              
              clienteIdFinal = empresaResponse.data.id
            } catch (err: any) {
              // Se a empresa já existe, buscar pelo CNPJ
              if (err.response?.status === 400 && err.response?.data?.error?.includes('CNPJ já cadastrado')) {
                const cnpjLimpo = apoliceForm.dados.cnpjManual.replace(/\D/g, '')
                const empresasResponse = await api.get(`/empresas?search=${cnpjLimpo}&limit=1`)
                if (empresasResponse.data.data && empresasResponse.data.data.length > 0) {
                  clienteIdFinal = empresasResponse.data.data[0].id
                } else {
                  throw new Error(`Erro ao buscar empresa com CNPJ ${cnpjLimpo}`)
                }
              } else {
                throw err
              }
            }
          }

          const apolicePayload = {
            clienteId: clienteIdFinal,
            fornecedorId: apoliceForm.dados.fornecedorId,
            numero: apoliceForm.dados.numero || undefined,
            produto: apoliceForm.dados.produto || undefined,
            codigoCNAE: apoliceForm.dados.codigoCNAE || undefined,
            ramoAtividade: apoliceForm.dados.ramoAtividade || undefined,
            inscricaoEstadual: apoliceForm.dados.inscricaoEstadual || undefined,
            inscricaoMunicipal: apoliceForm.dados.inscricaoMunicipal || undefined,
            porteCliente: apoliceForm.dados.porteCliente || undefined,
            dataVigenciaMDS: apoliceForm.dados.dataVigenciaMDS ? new Date(apoliceForm.dados.dataVigenciaMDS).toISOString() : undefined,
            dataVigenciaContratoInicio: apoliceForm.dados.dataVigenciaContratoInicio ? new Date(apoliceForm.dados.dataVigenciaContratoInicio).toISOString() : undefined,
            dataVigenciaContratoFim: apoliceForm.dados.dataVigenciaContratoFim ? new Date(apoliceForm.dados.dataVigenciaContratoFim).toISOString() : undefined,
            periodoVigencia: apoliceForm.dados.periodoVigencia || undefined,
            limiteTecnico: apoliceForm.dados.limiteTecnico || undefined,
            regimeContratacao: apoliceForm.dados.regimeContratacao || undefined,
            tipoContrato: apoliceForm.dados.tipoContrato || undefined,
            coparticipacao: apoliceForm.dados.coparticipacao || undefined,
            mesReajuste: apoliceForm.dados.mesReajuste || undefined,
            dataVencimentoFatura: apoliceForm.dados.dataVencimentoFatura ? new Date(apoliceForm.dados.dataVencimentoFatura).toISOString() : undefined,
            emissao: apoliceForm.dados.emissao ? new Date(apoliceForm.dados.emissao).toISOString() : undefined,
            dataEntrega: apoliceForm.dados.dataEntrega ? new Date(apoliceForm.dados.dataEntrega).toISOString() : undefined,
            dataCorte: apoliceForm.dados.dataCorte ? new Date(apoliceForm.dados.dataCorte).toISOString() : undefined,
            codigoProducaoAngariador: apoliceForm.dados.codigoProducaoAngariador || undefined,
            status: apoliceForm.tipo === 'NOMEACAO' ? 'EM_IMPLANTACAO' : (apoliceForm.dados.status || 'ATIVA')
          }

          const apoliceResponse = await api.post('/apolices', apolicePayload)
          apoliceId = apoliceResponse.data.id
        }

        // Criar chamado para esta apólice
        const tituloChamado = apolicesForm.length > 1 
          ? `${chamadoData.titulo} - Apólice ${i + 1}`
          : chamadoData.titulo

        const chamadoPayload = {
          apoliceId: apoliceId!,
          titulo: tituloChamado,
          descricao: chamadoData.descricao || undefined,
          prioridade: chamadoData.prioridade
        }

        if (chamadoId && i === 0) {
          // Se estiver editando, atualizar apenas o primeiro chamado
          await api.put(`/chamados-implantacao/${chamadoId}`, chamadoPayload)
        } else {
          const chamadoResponse = await api.post('/chamados-implantacao', chamadoPayload)
          chamadosCriados.push(chamadoResponse.data)
        }
      }

      if (onSuccess) {
        onSuccess()
      } else {
        navigate('/chamados')
      }
    } catch (err: any) {
      console.error('Erro ao salvar chamado:', err)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message || 
                          err.response?.data?.details || 
                          err.message || 
                          'Erro ao salvar chamado'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate('/chamados')
    }
  }

  return (
    <div className="chamado-wizard-container">
      <div className="chamado-wizard-header">
        <h2>{chamadoId ? 'Editar Chamado' : 'NOVA IMPLANTAÇÃO'}</h2>
      </div>

      {/* Wizard Steps */}
      <div className="chamado-wizard-steps">
        {(['ESTIPULANTE', 'COMISSAO', 'OPERACIONAL', 'QUESTIONARIO'] as WizardStep[]).map((step) => {
          const stepLabels: Record<WizardStep, string> = {
            ESTIPULANTE: 'Estipulante',
            COMISSAO: 'Comissão',
            OPERACIONAL: 'Operacional',
            QUESTIONARIO: 'Questionário'
          }
          const isActive = currentStep === step
          
          return (
            <div
              key={step}
              className={`chamado-wizard-step ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentStep(step)}
            >
              <div className="chamado-step-icon">
                <Edit size={20} />
              </div>
              <div className="chamado-step-label">{stepLabels[step]}</div>
            </div>
          )
        })}
      </div>

      {/* Ficha Técnica Section */}
      <div className="ficha-tecnica-section">
        <div className="ficha-tecnica-title">
          Ficha <strong>Técnica</strong>
        </div>
        
        <ul className="ficha-tecnica-list">
          {fichaTecnicaItems.map((item) => (
            <li
              key={item.id}
              className={`ficha-tecnica-item ${expandedFichaItem === item.id ? 'active' : ''}`}
            >
              <div 
                className="ficha-tecnica-item-header"
                onClick={() => setExpandedFichaItem(expandedFichaItem === item.id ? null : item.id)}
              >
                <div className="ficha-tecnica-item-dot"></div>
                <div className="ficha-tecnica-item-icon">
                  <Edit size={20} />
                </div>
                <div className="ficha-tecnica-item-title">{item.title}</div>
                <ChevronDown className="ficha-tecnica-item-chevron" size={20} />
              </div>
              <div 
                className="ficha-tecnica-item-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="ficha-tecnica-item-body" onClick={(e) => e.stopPropagation()}>
                  {item.id === 'abertura-chamado' && (
                    <form onSubmit={handleSubmit} className="form">
                      {error && <div className="error-message">{error}</div>}

        {/* Seleção de Perfil */}
        <div className="form-group">
          <label className="label">Perfil *</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="perfil"
                value="COMERCIAL"
                checked={perfil === 'COMERCIAL'}
                onChange={(e) => setPerfil(e.target.value as Perfil)}
                disabled={loading}
              />
              <span>Comercial</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="perfil"
                value="RELACIONAMENTO"
                checked={perfil === 'RELACIONAMENTO'}
                onChange={(e) => setPerfil(e.target.value as Perfil)}
                disabled={loading}
              />
              <span>Relacionamento</span>
            </label>
          </div>
        </div>

        {/* Dados do Chamado */}
        <div className="form-section">
          <h3>Dados do Chamado</h3>
          
          <div className="form-group">
            <label htmlFor="titulo" className="label">
              Título *
            </label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              className="input"
              value={chamadoData.titulo}
              onChange={handleChamadoChange}
              required
              placeholder="Título do chamado"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="descricao" className="label">
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              className="input"
              value={chamadoData.descricao}
              onChange={handleChamadoChange}
              placeholder="Descrição da solicitação"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="prioridade" className="label">
              Prioridade
            </label>
            <select
              id="prioridade"
              name="prioridade"
              className="input"
              value={chamadoData.prioridade}
              onChange={handleChamadoChange}
              disabled={loading}
            >
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
        </div>

        {/* Quantidade de Apólices */}
        {!mostrarFormulariosApolices && (
          <div className="form-section">
            <h3>Apólices</h3>
            
            <div className="form-group">
              <label htmlFor="quantidadeApolices" className="label">
                Quantas apólices serão implantadas? *
              </label>
              <input
                id="quantidadeApolices"
                type="number"
                min="1"
                max="50"
                className="input"
                value={quantidadeApolices}
                onChange={(e) => {
                  const qtd = parseInt(e.target.value) || 1
                  setQuantidadeApolices(qtd)
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                disabled={loading}
                required
              />
            </div>

            <div className="form-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (quantidadeApolices > 0) {
                    // Inicializar array de apólices
                    const novasApolices = Array.from({ length: quantidadeApolices }, () => ({
                      tipo: perfil === 'COMERCIAL' ? 'NOVA' as const : 'EXISTENTE' as const,
                      apoliceId: undefined,
                      dados: {
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
                        dataVigenciaContratoFim: '',
                        periodoVigencia: '',
                        limiteTecnico: '',
                        regimeContratacao: '',
                        tipoContrato: '',
                        coparticipacao: '',
                        mesReajuste: '',
                        dataVencimentoFatura: '',
                        emissao: '',
                        dataEntrega: '',
                        dataCorte: '',
                        codigoProducaoAngariador: '',
                        status: 'ATIVA',
                        clienteManual: false,
                        cnpjManual: '',
                        razaoSocialManual: ''
                      }
                    }))
                    setApolicesForm(novasApolices)
                    setMostrarFormulariosApolices(true)
                  }
                }}
                disabled={loading || quantidadeApolices < 1}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

                      <div className="wizard-actions">
                        <div className="wizard-actions-left">
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleCancel}
                            disabled={loading}
                          >
                            Cancelar
                          </button>
                        </div>
                        <div className="wizard-actions-right">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                          >
                            {loading ? 'Salvando...' : chamadoId ? 'Atualizar' : 'Criar Chamado'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                  
                  {item.id === 'cadastro-estipulante' && mostrarFormulariosApolices && (
                    <div className="wizard-content">
                      <div className="form-section" style={{ marginTop: '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h3 style={{ margin: 0 }}>Apólices ({apolicesForm.length})</h3>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                              setMostrarFormulariosApolices(false)
                              setExpandedFichaItem('abertura-chamado')
                            }}
                            disabled={loading}
                            style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                          >
                            Alterar Quantidade
                          </button>
                        </div>

                        {apolicesForm.map((apoliceForm, index) => {
                          return (
                            <div key={index} className="apolice-form-item" style={{ marginBottom: '32px', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                              <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#00225f' }}>Apólice {index + 1}</h4>
                              
                              <div className="form-group">
                              <label className="label">Tipo de Apólice *</label>
                              <div className="radio-group">
                                {perfil === 'COMERCIAL' ? (
                                  <>
                                    <label className="radio-label">
                                      <input
                                        type="radio"
                                        name={`apoliceTipo-${index}`}
                                        value="nova"
                                        checked={apoliceForm.tipo === 'NOVA'}
                                        onChange={() => {
                                          const novasApolices = [...apolicesForm]
                                          novasApolices[index].tipo = 'NOVA'
                                          setApolicesForm(novasApolices)
                                        }}
                                        disabled={loading}
                                      />
                                      <span>Nova Apólice</span>
                                    </label>
                                    <label className="radio-label">
                                      <input
                                        type="radio"
                                        name={`apoliceTipo-${index}`}
                                        value="nomeacao"
                                        checked={apoliceForm.tipo === 'NOMEACAO'}
                                        onChange={() => {
                                          const novasApolices = [...apolicesForm]
                                          novasApolices[index].tipo = 'NOMEACAO'
                                          setApolicesForm(novasApolices)
                                        }}
                                        disabled={loading}
                                      />
                                      <span>Nomeação</span>
                                    </label>
                                  </>
                                ) : (
                                  <>
                                    <label className="radio-label">
                                      <input
                                        type="radio"
                                        name={`apoliceTipo-${index}`}
                                        value="existente"
                                        checked={apoliceForm.tipo === 'EXISTENTE'}
                                        onChange={() => {
                                          const novasApolices = [...apolicesForm]
                                          novasApolices[index].tipo = 'EXISTENTE'
                                          setApolicesForm(novasApolices)
                                        }}
                                        disabled={loading}
                                      />
                                      <span>Apólice Existente</span>
                                    </label>
                                    <label className="radio-label">
                                      <input
                                        type="radio"
                                        name={`apoliceTipo-${index}`}
                                        value="nova"
                                        checked={apoliceForm.tipo === 'NOVA'}
                                        onChange={() => {
                                          const novasApolices = [...apolicesForm]
                                          novasApolices[index].tipo = 'NOVA'
                                          setApolicesForm(novasApolices)
                                        }}
                                        disabled={loading}
                                      />
                                      <span>Nova Apólice</span>
                                    </label>
                                  </>
                                )}
                              </div>
                            </div>

                            {apoliceForm.tipo === 'EXISTENTE' ? (
                              <div className="form-group">
                                <label htmlFor={`apoliceSelecionadaId-${index}`} className="label">
                                  Selecionar Apólice *
                                </label>
                                <select
                                  id={`apoliceSelecionadaId-${index}`}
                                  className="input"
                                  value={apoliceForm.apoliceId || ''}
                                  onChange={(e) => {
                                    const novasApolices = [...apolicesForm]
                                    novasApolices[index].apoliceId = e.target.value
                                    setApolicesForm(novasApolices)
                                  }}
                                  required
                                  disabled={loading}
                                >
                                  <option value="">Selecione uma apólice</option>
                                  {apolices.map(apolice => (
                                    <option key={apolice.id} value={apolice.id}>
                                      {apolice.numero} - {apolice.empresa?.razaoSocial || 'N/A'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <>
                                {(apoliceForm.tipo as string) !== 'EXISTENTE' && (
                                  <div className="form-section">
                                    <h4 style={{ marginTop: '24px', marginBottom: '16px', color: '#00225f' }}>Dados do Cliente</h4>
                                    <div className="form-group">
                                      <label className="label">Método de Seleção do Cliente *</label>
                                      <div className="radio-group">
                                        <label className="radio-label">
                                          <input
                                            type="radio"
                                            name={`clienteManual-${index}`}
                                            checked={!apoliceForm.dados.clienteManual}
                                            onChange={() => {
                                              const novasApolices = [...apolicesForm]
                                              novasApolices[index].dados.clienteManual = false
                                              novasApolices[index].dados.cnpjManual = ''
                                              novasApolices[index].dados.razaoSocialManual = ''
                                              setApolicesForm(novasApolices)
                                            }}
                                            disabled={loading}
                                          />
                                          <span>Buscar no Sistema</span>
                                        </label>
                                        <label className="radio-label">
                                          <input
                                            type="radio"
                                            name={`clienteManual-${index}`}
                                            checked={apoliceForm.dados.clienteManual}
                                            onChange={() => {
                                              const novasApolices = [...apolicesForm]
                                              novasApolices[index].dados.clienteManual = true
                                              novasApolices[index].dados.grupoEconomicoId = ''
                                              novasApolices[index].dados.clienteId = ''
                                              setApolicesForm(novasApolices)
                                            }}
                                            disabled={loading}
                                          />
                                          <span>Informar Manualmente</span>
                                        </label>
                                      </div>
                                    </div>

                                    {!apoliceForm.dados.clienteManual ? (
                                      <>
                                        <SearchableSelect
                                          id={`grupoEconomicoId-${index}`}
                                          label="Cliente"
                                          value={apoliceForm.dados.grupoEconomicoId}
                                          onChange={(val) => {
                                            const novasApolices = [...apolicesForm]
                                            novasApolices[index].dados.grupoEconomicoId = val
                                            novasApolices[index].dados.clienteId = ''
                                            setApolicesForm(novasApolices)
                                          }}
                                          endpoint="/grupos-economicos"
                                          searchParam="search"
                                          displayField="name"
                                          valueField="id"
                                          placeholder="Digite para buscar cliente..."
                                          required
                                          disabled={loading}
                                        />

                                        <SearchableSelect
                                          id={`clienteId-${index}`}
                                          label="Empresa (CNPJ)"
                                          value={apoliceForm.dados.clienteId}
                                          onChange={(val) => {
                                            const novasApolices = [...apolicesForm]
                                            novasApolices[index].dados.clienteId = val
                                            setApolicesForm(novasApolices)
                                          }}
                                          endpoint="/empresas"
                                          searchParam="search"
                                          displayField={(item: any) => item.cnpj && item.razaoSocial ? `${item.cnpj} - ${item.razaoSocial}` : (item.razaoSocial || item.cnpj || '')}
                                          valueField="id"
                                          placeholder="Digite CNPJ ou razão social para buscar..."
                                          required
                                          disabled={loading || !apoliceForm.dados.grupoEconomicoId}
                                          filterParam={apoliceForm.dados.grupoEconomicoId ? { key: 'grupoEconomicoId', value: apoliceForm.dados.grupoEconomicoId } : undefined}
                                        />
                                      </>
                                    ) : (
                                      <div className="form-row">
                                        <div className="form-group">
                                          <label htmlFor={`cnpjManual-${index}`} className="label">
                                            CNPJ *
                                          </label>
                                          <input
                                            id={`cnpjManual-${index}`}
                                            name="cnpjManual"
                                            type="text"
                                            className="input"
                                            value={apoliceForm.dados.cnpjManual}
                                            onChange={(e) => handleApoliceFormChange(index, e)}
                                            required
                                            placeholder="CNPJ do cliente"
                                            disabled={loading}
                                          />
                                        </div>

                                        <div className="form-group">
                                          <label htmlFor={`razaoSocialManual-${index}`} className="label">
                                            Razão Social *
                                          </label>
                                          <input
                                            id={`razaoSocialManual-${index}`}
                                            name="razaoSocialManual"
                                            type="text"
                                            className="input"
                                            value={apoliceForm.dados.razaoSocialManual}
                                            onChange={(e) => handleApoliceFormChange(index, e)}
                                            required
                                            placeholder="Razão Social do cliente"
                                            disabled={loading}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Resto dos campos da apólice - manter código existente */}
                                {/* ... código dos outros campos ... */}
                              </>
                            )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {item.id !== 'abertura-chamado' && item.id !== 'cadastro-estipulante' && (
                    <div className="wizard-content">
                      <p>Seção {item.title} - Em desenvolvimento</p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ChamadoForm

