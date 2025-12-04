import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { ArrowLeft, Edit, Save, FileText, Plus, Trash2, ChevronDown, ChevronUp, Eye, X } from 'lucide-react'
import Modal from '../components/Modal'
import SubEstipulanteForm from '../components/SubEstipulanteForm'
import PlanoForm from '../components/PlanoForm'
import CoberturaForm from '../components/CoberturaForm'
import RelacionamentoForm from '../components/RelacionamentoForm'
import ReembolsoPlanoForm from '../components/ReembolsoPlanoForm'
import ElegibilidadeForm from '../components/ElegibilidadeForm'
import EnderecoApoliceForm from '../components/EnderecoApoliceForm'
import ContatoApoliceForm from '../components/ContatoApoliceForm'
import EnderecoSubEstipulanteForm from '../components/EnderecoSubEstipulanteForm'
import ContatoSubEstipulanteForm from '../components/ContatoSubEstipulanteForm'
import ReajusteForm from '../components/ReajusteForm'
import DocumentacaoTab from '../components/DocumentacaoTab'
import ServicosTab from '../components/ServicosTab'
import './ApoliceDetalhes.css'

interface Apolice {
  id: string
  numero: string
  produto?: string
  codigoCNAE?: string
  ramoAtividade?: string
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  porteCliente?: string
  dataVigenciaMDS?: string
  dataVigenciaContratoInicio?: string
  periodoVigencia?: string
  limiteTecnico?: string
  regimeContratacao?: string
  tipoContrato?: string
  coparticipacao?: string
  mesReajuste?: string
  dataVencimentoFatura?: string
  emissao?: string
  dataEntrega?: string
  dataCorte?: string
  codigoProducaoAngariador?: string
  status: string
  empresa?: {
    id: string
    cnpj: string
    razaoSocial: string
    grupoEconomico?: {
      id: string
      name: string
    }
  }
  fornecedor?: {
    id: string
    razaoSocial: string
    cnpj?: string
  }
}

const ApoliceDetalhes = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [apolice, setApolice] = useState<Apolice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'dados' | 'informacoes' | 'relacionamento' | 'financeiro' | 'documentacao' | 'servicos'>('dados')
  const [tipoFinanceiro, setTipoFinanceiro] = useState<'comissionamento' | 'fee' | 'comissionamento_fee' | null>(null)
  const [comissionamento, setComissionamento] = useState<any | null>(null)
  const [fee, setFee] = useState<any | null>(null)
  const [mesInicial, setMesInicial] = useState<number | null>(null)
  const [editandoComissionamento, setEditandoComissionamento] = useState(false)
  const [formData, setFormData] = useState<Partial<Apolice>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [subEstipulantes, setSubEstipulantes] = useState<any[]>([])
  const [showSubEstipulanteModal, setShowSubEstipulanteModal] = useState(false)
  const [editingSubEstipulanteId, setEditingSubEstipulanteId] = useState<string | null>(null)
  const [viewingSubEstipulanteId, setViewingSubEstipulanteId] = useState<string | null>(null)
  const [showViewAllSubEstipulantes, setShowViewAllSubEstipulantes] = useState(false)
  const [enderecosSubEstipulante, setEnderecosSubEstipulante] = useState<any[]>([])
  const [contatosSubEstipulante, setContatosSubEstipulante] = useState<any[]>([])
  const [showEnderecoSubEstipulanteModal, setShowEnderecoSubEstipulanteModal] = useState(false)
  const [showContatoSubEstipulanteModal, setShowContatoSubEstipulanteModal] = useState(false)
  const [editingEnderecoSubEstipulanteId, setEditingEnderecoSubEstipulanteId] = useState<string | null>(null)
  const [editingContatoSubEstipulanteId, setEditingContatoSubEstipulanteId] = useState<string | null>(null)
  const [planos, setPlanos] = useState<any[]>([])
  const [showPlanoModal, setShowPlanoModal] = useState(false)
  const [editingPlanoId, setEditingPlanoId] = useState<string | null>(null)
  const [cobertura, setCobertura] = useState<any | null>(null)
  const [showCoberturaModal, setShowCoberturaModal] = useState(false)
  const [editingCoberturaId, setEditingCoberturaId] = useState<string | null>(null)
  const [tipoCadastro, setTipoCadastro] = useState<'plano' | 'cobertura' | null>(null)
  const [subEstipulantesExpanded, setSubEstipulantesExpanded] = useState(false)
  const [planosExpanded, setPlanosExpanded] = useState(false)
  const [dadosRegrasExpanded, setDadosRegrasExpanded] = useState(false)
  const [dadosCadastraisExpanded, setDadosCadastraisExpanded] = useState(false)
  const [isEditingDadosRegras, setIsEditingDadosRegras] = useState(false)
  const [reajustes, setReajustes] = useState<any[]>([])
  const [reajustesExpanded, setReajustesExpanded] = useState(false)
  const [showReajusteModal, setShowReajusteModal] = useState(false)
  const [editingReajusteId, setEditingReajusteId] = useState<string | null>(null)
  const [relacionamento, setRelacionamento] = useState<any | null>(null)
  const [showRelacionamentoModal, setShowRelacionamentoModal] = useState(false)
  const [reembolsos, setReembolsos] = useState<{ [planoId: string]: any[] }>({})
  const [showReembolsoModal, setShowReembolsoModal] = useState(false)
  const [editingReembolsoId, setEditingReembolsoId] = useState<string | null>(null)
  const [selectedPlanoIdForReembolso, setSelectedPlanoIdForReembolso] = useState<string | null>(null)
  const [showPlanoDetalhesModal, setShowPlanoDetalhesModal] = useState(false)
  const [planoDetalhes, setPlanoDetalhes] = useState<any | null>(null)
  const [coparticipacoes, setCoparticipacoes] = useState<{ [planoId: string]: any[] }>({})
  const [elegibilidades, setElegibilidades] = useState<any[]>([])
  const [showElegibilidadeModal, setShowElegibilidadeModal] = useState(false)
  const [editingElegibilidadeId, setEditingElegibilidadeId] = useState<string | null>(null)
  const [elegibilidadesExpanded, setElegibilidadesExpanded] = useState(false)
  const [enderecosApolice, setEnderecosApolice] = useState<any[]>([])
  const [showEnderecoModal, setShowEnderecoModal] = useState(false)
  const [editingEnderecoId, setEditingEnderecoId] = useState<string | null>(null)
  const [enderecosExpanded, setEnderecosExpanded] = useState(false)
  const [contatosApolice, setContatosApolice] = useState<any[]>([])
  const [showContatoModal, setShowContatoModal] = useState(false)
  const [editingContatoId, setEditingContatoId] = useState<string | null>(null)
  const [contatosExpanded, setContatosExpanded] = useState(false)
  const [produtos, setProdutos] = useState<Array<{ id: string; valor: string }>>([])
  const [portes, setPortes] = useState<Array<{ id: string; valor: string }>>([])
  const [agrupamentosFaturamento, setAgrupamentosFaturamento] = useState<any[]>([])
  const [showAgrupamentoModal, setShowAgrupamentoModal] = useState(false)
  const [editingAgrupamentoNome, setEditingAgrupamentoNome] = useState<string | null>(null)
  const [agrupamentoForm, setAgrupamentoForm] = useState<{
    nome: string
    estipulanteId: string | null
    subEstipulanteIds: string[]
    liderId: string | null // ID do item que é líder (estipulanteId ou subEstipulanteId)
    emails: string[] // E-mails para entrega
    informacoesAdicionaisMailing: string // Informações adicionais de mailing
  }>({
    nome: '',
    estipulanteId: null,
    subEstipulanteIds: [],
    liderId: null,
    emails: [],
    informacoesAdicionaisMailing: ''
  })
  const [loadingEmails, setLoadingEmails] = useState(false)

  useEffect(() => {
    if (id) {
      const loadData = async () => {
        try {
          // Carregar dados críticos primeiro (apólice, produtos e portes em paralelo)
          await Promise.all([
            fetchApolice(),
            fetchProdutos(),
            fetchPortes()
          ])
          
          // Após a apólice estar carregada, carregar todos os outros dados em paralelo
          await Promise.all([
            fetchSubEstipulantes(),
            fetchAgrupamentosFaturamento(),
            fetchPlanos(),
            fetchCobertura(),
            fetchReajustes(),
            fetchRelacionamento(),
            fetchElegibilidades(),
            fetchEnderecosApolice(),
            fetchContatosApolice(),
            fetchComissionamento(),
            fetchFee()
          ])
        } catch (error) {
          console.error('Erro ao carregar dados:', error)
        }
      }
      loadData()
    }
  }, [id])

  // Adicionar produto/porte temporariamente se não estiverem na lista
  useEffect(() => {
    if (apolice && produtos.length > 0 && apolice.produto) {
      const produtoExiste = produtos.some((p: { valor: string }) => p.valor === apolice.produto)
      if (!produtoExiste) {
        setProdutos(prev => [...prev, { id: `temp-${Date.now()}`, valor: apolice.produto! }])
      }
    }
  }, [apolice?.produto, produtos])

  useEffect(() => {
    if (apolice && portes.length > 0 && apolice.porteCliente) {
      const porteExiste = portes.some((p: { valor: string }) => p.valor === apolice.porteCliente)
      if (!porteExiste) {
        setPortes(prev => [...prev, { id: `temp-${Date.now()}`, valor: apolice.porteCliente! }])
      }
    }
  }, [apolice?.porteCliente, portes])

  // Carregar endereços e contatos quando visualizar um Sub Estipulante
  useEffect(() => {
    if (viewingSubEstipulanteId) {
      const fetchEnderecosEContatos = async () => {
        try {
          const [enderecosRes, contatosRes] = await Promise.all([
            api.get(`/enderecos-sub-estipulante?subEstipulanteId=${viewingSubEstipulanteId}&limit=1000`),
            api.get(`/contatos-sub-estipulante?subEstipulanteId=${viewingSubEstipulanteId}&limit=1000`)
          ])
          setEnderecosSubEstipulante(enderecosRes.data.data || [])
          setContatosSubEstipulante(contatosRes.data.data || [])
        } catch (err: any) {
          console.error('Erro ao carregar endereços/contatos:', err)
        }
      }
      fetchEnderecosEContatos()
    } else {
      // Limpar dados quando fechar o modal
      setEnderecosSubEstipulante([])
      setContatosSubEstipulante([])
    }
  }, [viewingSubEstipulanteId])

  useEffect(() => {
    if (apolice?.dataVigenciaContratoInicio) {
      const dataInicio = new Date(apolice.dataVigenciaContratoInicio)
      setMesInicial(dataInicio.getMonth())
    } else {
      setMesInicial(new Date().getMonth())
    }
  }, [apolice])

  const fetchApolice = async () => {
    try {
      setError(null)
      const response = await api.get(`/apolices/${id}`)
      const data = response.data
      
      if (!data) {
        throw new Error('Apólice não encontrada')
      }
      
      setApolice(data)
      setFormData(data)
      setLoading(false) // Marcar como carregado assim que a apólice estiver disponível
      
      // Adicionar produto/porte temporariamente se não estiverem na lista (usando useEffect separado)
    } catch (error: any) {
      console.error('Erro ao carregar apólice:', error)
      setError(error.response?.data?.error || error.message || 'Erro ao carregar apólice')
      setLoading(false)
      
      // Se for erro 404, redirecionar após 2 segundos
      if (error.response?.status === 404) {
        setTimeout(() => {
          navigate('/apolices')
        }, 2000)
      }
    }
  }

  const fetchProdutos = async () => {
    try {
      // Buscar módulo "Apolice" ou "Apólice"
      const modulosResponse = await api.get('/modulos')
      const modulos = modulosResponse.data.data || []
      const moduloApolice = modulos.find((m: { nome: string }) => 
        m.nome.toLowerCase() === 'apolice' || m.nome.toLowerCase() === 'apólice'
      )

      if (!moduloApolice) {
        setProdutos([])
        return
      }

      // Buscar configuração de campo "produto" no módulo Apolice
      const configsResponse = await api.get(`/configuracoes-campos?moduloId=${moduloApolice.id}`)
      const configs = configsResponse.data.data || []
      const configProduto = configs.find((c: { nome: string }) => 
        c.nome.toLowerCase() === 'produto'
      )

      if (!configProduto) {
        setProdutos([])
        return
      }

      // Buscar dados dinâmicos do campo produto (apenas ativos)
      const dadosResponse = await api.get(`/dados-dinamicos?configuracaoCampoId=${configProduto.id}`)
      const dados = dadosResponse.data.data || []
      
      const produtosFormatados = dados
        .filter((d: { ativo: boolean }) => d.ativo !== false) // Filtrar apenas ativos
        .map((d: { id: string; valor: string }) => ({ id: d.id, valor: d.valor }))
      
      setProdutos(produtosFormatados)
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
      setProdutos([])
    }
  }

  const fetchPortes = async () => {
    try {
      // Buscar módulo "Apolice" ou "Apólice"
      const modulosResponse = await api.get('/modulos')
      const modulos = modulosResponse.data.data || []
      const moduloApolice = modulos.find((m: { nome: string }) => 
        m.nome.toLowerCase() === 'apolice' || m.nome.toLowerCase() === 'apólice'
      )

      if (!moduloApolice) {
        setPortes([])
        return
      }

      // Buscar configuração de campo "porte" no módulo Apolice
      const configsResponse = await api.get(`/configuracoes-campos?moduloId=${moduloApolice.id}`)
      const configs = configsResponse.data.data || []
      const configPorte = configs.find((c: { nome: string }) => 
        c.nome.toLowerCase() === 'porte'
      )

      if (!configPorte) {
        setPortes([])
        return
      }

      // Buscar dados dinâmicos do campo porte (apenas ativos)
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

  const fetchSubEstipulantes = async () => {
    try {
      const response = await api.get(`/sub-estipulantes?apoliceId=${id}&limit=1000`)
      setSubEstipulantes(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar sub estipulantes:', error)
    }
  }

  const fetchAgrupamentosFaturamento = async () => {
    if (!id) {
      return
    }
    
    try {
      const response = await api.get(`/agrupamentos-faturamento?apoliceId=${id}`)
      
      // Garantir que estamos pegando o array correto
      const agrupamentos = response.data?.data || response.data || []
      
      // Garantir que cada agrupamento tem a estrutura correta
      const agrupamentosProcessados = agrupamentos.map((ag: any) => {
        // Processar emails: pode vir como string, array JSON, ou null
        let emailsProcessados: string[] = [];
        if (ag.emails) {
          if (typeof ag.emails === 'string') {
            // Se for string, separar por vírgula
            emailsProcessados = ag.emails.split(',').map((e: string) => e.trim()).filter((e: string) => e.length > 0);
          } else if (Array.isArray(ag.emails)) {
            // Se já for array, usar diretamente
            emailsProcessados = ag.emails.filter((e: string) => e && typeof e === 'string' && e.trim().length > 0);
          }
        }
        
        return {
          id: ag.id,
          nome: ag.nome,
          estipulanteId: ag.estipulanteId || null,
          subEstipulanteId: ag.subEstipulanteId || null,
          isLider: ag.isLider || false,
          ordem: ag.ordem || 0,
          emails: emailsProcessados,
          informacoesAdicionaisMailing: ag.informacoesAdicionaisMailing || ''
        };
      })
      
      setAgrupamentosFaturamento(agrupamentosProcessados)
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Erro ao carregar agrupamentos:', error)
      }
      setAgrupamentosFaturamento([])
    }
  }

  const handleSaveAgrupamentos = async (agrupamentosParaSalvar?: any[]) => {
    if (!id) {
      return
    }
    
    // Usar os agrupamentos passados como parâmetro ou o estado atual
    const agrupamentosSource = agrupamentosParaSalvar || agrupamentosFaturamento
    
    try {
      const agrupamentosToSave = agrupamentosSource.map((ag) => {
        // Processar emails: sempre enviar como string separada por vírgula (o schema é String?)
        let emailsProcessados: string | null = null;
        if (ag.emails) {
          if (Array.isArray(ag.emails)) {
            // Se for array, converter para string separada por vírgula
            const emailsFiltrados = ag.emails.filter((e: string) => e && typeof e === 'string' && e.trim().length > 0);
            if (emailsFiltrados.length > 0) {
              emailsProcessados = emailsFiltrados.join(', ');
            }
          } else if (typeof ag.emails === 'string' && ag.emails.trim().length > 0) {
            // Se já for string, usar diretamente
            emailsProcessados = ag.emails;
          }
        }
        
        return {
          nome: ag.nome,
          estipulanteId: ag.estipulanteId || null,
          subEstipulanteId: ag.subEstipulanteId || null,
          isLider: ag.isLider || false,
          emails: emailsProcessados,
          informacoesAdicionaisMailing: ag.informacoesAdicionaisMailing || null
        };
      })
      
      await api.post('/agrupamentos-faturamento', {
        apoliceId: id,
        agrupamentos: agrupamentosToSave
      })
      
      // Aguardar um pouco antes de buscar novamente para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await fetchAgrupamentosFaturamento()
    } catch (error: any) {
      console.error('Erro ao salvar agrupamentos:', error)
      throw error
    }
  }

  const handleAddAgrupamento = () => {
    if (!agrupamentoForm.nome) {
      alert('Por favor, informe o nome do agrupamento')
      return
    }
    
    if (!agrupamentoForm.estipulanteId && agrupamentoForm.subEstipulanteIds.length === 0) {
      alert('Por favor, selecione a estipulante principal ou pelo menos uma sub estipulante')
      return
    }

    // Se está editando um agrupamento existente, remover os itens antigos desse agrupamento
    let agrupamentosAtualizados = agrupamentosFaturamento
    if (editingAgrupamentoNome && editingAgrupamentoNome === agrupamentoForm.nome) {
      // Editando o mesmo agrupamento - substituir todos os itens
      agrupamentosAtualizados = agrupamentosFaturamento.filter(ag => ag.nome !== editingAgrupamentoNome)
    } else if (editingAgrupamentoNome && editingAgrupamentoNome !== agrupamentoForm.nome) {
      // Renomeando o agrupamento - remover itens antigos
      agrupamentosAtualizados = agrupamentosFaturamento.filter(ag => ag.nome !== editingAgrupamentoNome)
    }

    const novosAgrupamentos: any[] = []

    // Adicionar estipulante principal se selecionada e ainda não estiver no agrupamento
    if (agrupamentoForm.estipulanteId) {
      const jaExiste = agrupamentosAtualizados.some(
        ag => ag.nome === agrupamentoForm.nome && ag.estipulanteId === agrupamentoForm.estipulanteId
      )
      if (!jaExiste) {
        novosAgrupamentos.push({
          nome: agrupamentoForm.nome,
          estipulanteId: agrupamentoForm.estipulanteId,
          subEstipulanteId: null,
          isLider: agrupamentoForm.liderId === agrupamentoForm.estipulanteId,
          emails: agrupamentoForm.emails,
          informacoesAdicionaisMailing: agrupamentoForm.informacoesAdicionaisMailing,
          id: `temp-${Date.now()}-estipulante`
        })
      }
    }

    // Adicionar todas as sub estipulantes selecionadas que ainda não estão no agrupamento
    agrupamentoForm.subEstipulanteIds.forEach((subEstipulanteId) => {
      const jaExiste = agrupamentosAtualizados.some(
        ag => ag.nome === agrupamentoForm.nome && ag.subEstipulanteId === subEstipulanteId
      )
      if (!jaExiste) {
        novosAgrupamentos.push({
          nome: agrupamentoForm.nome,
          estipulanteId: null,
          subEstipulanteId: subEstipulanteId,
          isLider: agrupamentoForm.liderId === subEstipulanteId,
          emails: agrupamentoForm.emails,
          informacoesAdicionaisMailing: agrupamentoForm.informacoesAdicionaisMailing,
          id: `temp-${Date.now()}-${subEstipulanteId}`
        })
      }
    })

    // Se tem líder definido, remover líder de outros itens do mesmo grupo
    if (agrupamentoForm.liderId) {
      agrupamentosAtualizados = agrupamentosAtualizados.map(ag => ({
        ...ag,
        isLider: ag.nome === agrupamentoForm.nome ? false : ag.isLider
      }))
    }

    // Aplicar e-mails e informações adicionais a todos os itens do mesmo agrupamento
    const agrupamentosFinais = [...agrupamentosAtualizados, ...novosAgrupamentos].map(ag => {
      if (ag.nome === agrupamentoForm.nome) {
        return {
          ...ag,
          emails: agrupamentoForm.emails,
          informacoesAdicionaisMailing: agrupamentoForm.informacoesAdicionaisMailing
        }
      }
      return ag
    })
    setAgrupamentosFaturamento(agrupamentosFinais)
    
    // Salvar automaticamente no banco de dados usando o estado atualizado
    setTimeout(async () => {
      try {
        await handleSaveAgrupamentos(agrupamentosFinais)
      } catch (error: any) {
        console.error('Erro ao salvar agrupamentos:', error)
      }
    }, 100)
  }

  const handleRemoveAgrupamento = async (agrupamentoId: string) => {
    const novosAgrupamentos = agrupamentosFaturamento.filter(ag => ag.id !== agrupamentoId)
    setAgrupamentosFaturamento(novosAgrupamentos)
    
    // Salvar automaticamente no banco de dados usando o estado atualizado
    setTimeout(async () => {
      try {
        await handleSaveAgrupamentos(novosAgrupamentos)
      } catch (error: any) {
        console.error('Erro ao salvar agrupamentos:', error)
      }
    }, 100)
  }

  const handleToggleLider = async (agrupamentoId: string) => {
    const agrupamento = agrupamentosFaturamento.find(ag => ag.id === agrupamentoId)
    if (!agrupamento) return

    const updatedAgrupamentos = agrupamentosFaturamento.map(ag => {
      if (ag.id === agrupamentoId) {
        return { ...ag, isLider: !ag.isLider }
      }
      // Se está marcando como líder, remover líder de outros do mesmo grupo
      if (ag.nome === agrupamento.nome && ag.id !== agrupamentoId) {
        return { ...ag, isLider: false }
      }
      return ag
    })
    setAgrupamentosFaturamento(updatedAgrupamentos)
    
    // Salvar automaticamente no banco de dados usando o estado atualizado
    setTimeout(async () => {
      try {
        await handleSaveAgrupamentos(updatedAgrupamentos)
      } catch (error: any) {
        console.error('Erro ao salvar agrupamentos:', error)
      }
    }, 100)
  }

  const fetchCobertura = async () => {
    try {
      const response = await api.get(`/coberturas?apoliceId=${id}`)
      setCobertura(response.data)
    } catch (error: any) {
      // 404 é esperado quando não há cobertura para a apólice
      if (error.response?.status === 404) {
        setCobertura(null)
        // Não logar erro 404, pois é um caso esperado
        return
      }
      // Apenas logar erros inesperados
      console.error('Erro ao carregar cobertura:', error)
      console.error('Detalhes do erro:', error.response?.data)
      setCobertura(null)
    }
  }

  const fetchPlanos = async () => {
    try {
      const response = await api.get(`/planos?apoliceId=${id}&limit=1000`)
      const planosData = response.data.data || []
      setPlanos(planosData)
      
      // Carregar reembolsos e coparticipações para cada plano
      const reembolsosMap: { [planoId: string]: any[] } = {}
      const coparticipacoesMap: { [planoId: string]: any[] } = {}
      
      // Primeiro, usar os dados que já vêm na resposta
      for (const plano of planosData) {
        if (plano.reembolsos && plano.reembolsos.length > 0) {
          reembolsosMap[plano.id] = plano.reembolsos
        } else {
          reembolsosMap[plano.id] = []
        }
        
        if (plano.coparticipacoes && plano.coparticipacoes.length > 0) {
          coparticipacoesMap[plano.id] = plano.coparticipacoes
        } else {
          coparticipacoesMap[plano.id] = []
        }
      }
      
      // Carregar apenas os que não vieram na resposta, em paralelo
      const planosSemReembolsos = planosData.filter(p => !p.reembolsos || p.reembolsos.length === 0)
      const planosSemCoparticipacoes = planosData.filter(p => !p.coparticipacoes || p.coparticipacoes.length === 0)
      
      // Carregar reembolsos em paralelo
      if (planosSemReembolsos.length > 0) {
        const reembolsosPromises = planosSemReembolsos.map(async (plano) => {
          try {
            const response = await api.get(`/reembolsos-plano?planoId=${plano.id}&limit=1000`)
            return { planoId: plano.id, data: response.data.data || [] }
          } catch (err) {
            console.error(`Erro ao carregar reembolsos do plano ${plano.id}:`, err)
            return { planoId: plano.id, data: [] }
          }
        })
        
        const reembolsosResults = await Promise.all(reembolsosPromises)
        reembolsosResults.forEach(({ planoId, data }) => {
          reembolsosMap[planoId] = data
        })
      }
      
      // Carregar coparticipações em paralelo
      if (planosSemCoparticipacoes.length > 0) {
        const coparticipacoesPromises = planosSemCoparticipacoes.map(async (plano) => {
          try {
            const response = await api.get(`/coparticipacoes-plano?planoId=${plano.id}&limit=1000`)
            return { planoId: plano.id, data: response.data.data || [] }
          } catch (err) {
            console.error(`Erro ao carregar coparticipações do plano ${plano.id}:`, err)
            return { planoId: plano.id, data: [] }
          }
        })
        
        const coparticipacoesResults = await Promise.all(coparticipacoesPromises)
        coparticipacoesResults.forEach(({ planoId, data }) => {
          coparticipacoesMap[planoId] = data
        })
      }
      
      setReembolsos(reembolsosMap)
      setCoparticipacoes(coparticipacoesMap)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    }
  }

  const fetchReajustes = async () => {
    try {
      const response = await api.get(`/reajustes?apoliceId=${id}&limit=1000`)
      setReajustes(response.data.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar reajustes:', error)
      console.error('Detalhes do erro:', error.response?.data)
      // Em caso de erro, definir como array vazio
      setReajustes([])
    }
  }

  const handleDeleteReajuste = async (reajusteId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este reajuste?')) return
    try {
      await api.delete(`/reajustes/${reajusteId}`)
      fetchReajustes()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir reajuste')
    }
  }

  const fetchRelacionamento = async () => {
    try {
      const response = await api.get(`/relacionamentos?apoliceId=${id}&limit=1`)
      const relacionamentos = response.data.data || []
      setRelacionamento(relacionamentos.length > 0 ? relacionamentos[0] : null)
    } catch (error) {
      console.error('Erro ao carregar relacionamento:', error)
    }
  }

  const fetchElegibilidades = async () => {
    try {
      const response = await api.get(`/elegibilidades?apoliceId=${id}&limit=1000`)
      setElegibilidades(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar elegibilidades:', error)
    }
  }

  const handleDeleteElegibilidade = async (elegibilidadeId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta elegibilidade?')) return
    try {
      await api.delete(`/elegibilidades/${elegibilidadeId}`)
      fetchElegibilidades()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir elegibilidade')
    }
  }

  const fetchEnderecosApolice = async () => {
    try {
      const response = await api.get(`/enderecos-apolice?apoliceId=${id}&limit=1000`)
      setEnderecosApolice(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar endereços:', error)
    }
  }

  const fetchContatosApolice = async () => {
    try {
      const response = await api.get(`/contatos-apolice?apoliceId=${id}&limit=1000`)
      setContatosApolice(response.data.data || [])
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    }
  }

  const handleDeleteEndereco = async (enderecoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este endereço?')) return
    try {
      await api.delete(`/enderecos-apolice/${enderecoId}`)
      fetchEnderecosApolice()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir endereço')
    }
  }

  const handleDeleteContato = async (contatoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este contato?')) return
    try {
      await api.delete(`/contatos-apolice/${contatoId}`)
      fetchContatosApolice()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir contato')
    }
  }

  const fetchComissionamento = async () => {
    try {
      const response = await api.get(`/comissionamentos-apolice?apoliceId=${id}&limit=1`)
      // Pode retornar o objeto diretamente ou dentro de data.data
      let comissionamentoData = null
      if (response.data.id) {
        // Retornou o objeto diretamente
        comissionamentoData = response.data
      } else if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        // Retornou dentro de data.data
        comissionamentoData = response.data.data[0]
      }
      if (comissionamentoData) {
        setComissionamento(comissionamentoData)
      }
    } catch (error) {
      console.error('Erro ao carregar comissionamento:', error)
    }
  }

  const fetchFee = async () => {
    try {
      const response = await api.get(`/fees-apolice?apoliceId=${id}&limit=1`)
      // Pode retornar o objeto diretamente ou dentro de data.data
      let feeData = null
      if (response.data.id) {
        // Retornou o objeto diretamente
        feeData = response.data
      } else if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        // Retornou dentro de data.data
        feeData = response.data.data[0]
      }
      if (feeData) {
        setFee(feeData)
      }
    } catch (error) {
      console.error('Erro ao carregar fee:', error)
    }
  }

  // Determinar tipo financeiro baseado nos dados carregados
  useEffect(() => {
    if (comissionamento && fee) {
      setTipoFinanceiro('comissionamento_fee')
    } else if (comissionamento) {
      setTipoFinanceiro('comissionamento')
    } else if (fee) {
      setTipoFinanceiro('fee')
    }
  }, [comissionamento, fee])

  // Inicializar modo de edição baseado se já existe comissionamento salvo
  useEffect(() => {
    if (comissionamento?.id) {
      setEditandoComissionamento(false)
    }
  }, [comissionamento?.id])

  const handleDeleteSubEstipulante = async (subEstipulanteId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este sub estipulante?')) return
    try {
      await api.delete(`/sub-estipulantes/${subEstipulanteId}`)
      fetchSubEstipulantes()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir sub estipulante')
    }
  }

  const handleDeletePlano = async (planoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano?')) return
    try {
      await api.delete(`/planos/${planoId}`)
      fetchPlanos()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir plano')
    }
  }

  const handleDeleteReembolso = async (reembolsoId: string, planoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este reembolso?')) return
    try {
      await api.delete(`/reembolsos-plano/${reembolsoId}`)
      fetchPlanos()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir reembolso')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.put(`/apolices/${id}`, formData)
      await fetchApolice()
      setIsEditing(false)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar apólice')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDadosRegras = async () => {
    try {
      setSaving(true)
      const dadosRegrasData = {
        dataVencimentoFatura: formData.dataVencimentoFatura,
        emissao: formData.emissao,
        dataEntrega: formData.dataEntrega,
        dataCorte: formData.dataCorte,
        codigoProducaoAngariador: formData.codigoProducaoAngariador
      }
      
      await api.put(`/apolices/${id}`, dadosRegrasData)
      
      // Sempre salvar agrupamentos (mesmo se vazio, para limpar os existentes)
      try {
        await handleSaveAgrupamentos()
      } catch (agrupamentoError: any) {
        console.error('Erro ao salvar agrupamentos:', agrupamentoError)
        alert(agrupamentoError.response?.data?.error || 'Erro ao salvar agrupamentos. Os dados básicos foram salvos.')
      }
      
      await fetchApolice()
      await fetchAgrupamentosFaturamento()
      setIsEditingDadosRegras(false)
    } catch (error: any) {
      console.error('Erro ao salvar dados e regras:', error)
      alert(error.response?.data?.error || 'Erro ao salvar dados e regras')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelDadosRegras = () => {
    setIsEditingDadosRegras(false)
    if (apolice) {
      setFormData({
        ...formData,
        dataVencimentoFatura: apolice.dataVencimentoFatura,
        emissao: apolice.emissao,
        dataEntrega: apolice.dataEntrega,
        dataCorte: apolice.dataCorte,
        codigoProducaoAngariador: apolice.codigoProducaoAngariador
      })
    }
  }

  // Mostrar erro se houver
  if (error && !loading) {
    return (
      <div className="apolice-detalhes-page">
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          margin: '20px'
        }}>
          <h2 style={{ color: '#a42340', marginBottom: '16px' }}>Erro ao carregar apólice</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/apolices')}
          >
            <ArrowLeft size={16} />
            Voltar para Apólices
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="apolice-detalhes-page">
        <div className="loading">Carregando...</div>
      </div>
    )
  }

  if (!apolice && !loading) {
    return (
      <div className="apolice-detalhes-page">
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          margin: '20px'
        }}>
          <h2 style={{ color: '#a42340', marginBottom: '16px' }}>Apólice não encontrada</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>A apólice solicitada não foi encontrada ou você não tem permissão para visualizá-la.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/apolices')}
          >
            <ArrowLeft size={16} />
            Voltar para Apólices
          </button>
        </div>
      </div>
    )
  }

  // Se ainda estiver carregando ou não houver apólice, não renderizar o conteúdo
  if (loading || !apolice) {
    return null
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '-'
    const numbers = cnpj.toString().replace(/\D/g, '')
    if (numbers.length === 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    }
    return cnpj.toString()
  }

  return (
    <div className="apolice-detalhes-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/apolices')}>
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button className="btn btn-outline" onClick={() => {
                setIsEditing(false)
                setFormData(apolice || {})
              }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={20} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit size={20} />
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="apolice-header">
        <div className="apolice-title">
          <FileText size={32} />
          <div>
            <h1>Apólice {apolice.numero}</h1>
            <p className="apolice-subtitle">
              {apolice.empresa?.razaoSocial} - {apolice.fornecedor?.razaoSocial}
            </p>
          </div>
        </div>
        <div className={`status-badge status-${apolice.status.toLowerCase().replace('_', '-')}`}>
          {apolice.status === 'ATIVA' ? 'Ativa' :
           apolice.status === 'CANCELADA' ? 'Cancelada' :
           apolice.status === 'EM_IMPLANTACAO' ? 'Em implantação' :
           apolice.status}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveTab('dados')}
        >
          Dados Básicos
        </button>
        <button
          className={`tab ${activeTab === 'informacoes' ? 'active' : ''}`}
          onClick={() => setActiveTab('informacoes')}
        >
          Informações Adicionais
        </button>
        <button
          className={`tab ${activeTab === 'relacionamento' ? 'active' : ''}`}
          onClick={() => setActiveTab('relacionamento')}
        >
          Relacionamento
        </button>
        <button
          className={`tab ${activeTab === 'financeiro' ? 'active' : ''}`}
          onClick={() => setActiveTab('financeiro')}
        >
          Financeiro
        </button>
        <button
          className={`tab ${activeTab === 'documentacao' ? 'active' : ''}`}
          onClick={() => setActiveTab('documentacao')}
        >
          Documentação
        </button>
        <button
          className={`tab ${activeTab === 'servicos' ? 'active' : ''}`}
          onClick={() => setActiveTab('servicos')}
        >
          Serviços
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dados' && (
          <div className="form-section">
            <div className="section-title">Dados da Apólice - Estipulante</div>
            <div className="form-grid">
              <div className="form-group">
                <label>N° Apólice</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="numero"
                    className="input"
                    value={formData.numero || ''}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="field-value">{apolice.numero}</div>
                )}
              </div>

              <div className="form-group small-field">
                <label>Status</label>
                {isEditing ? (
                  <select
                    name="status"
                    className="input"
                    value={formData.status || 'ATIVA'}
                    onChange={handleChange}
                  >
                    <option value="ATIVA">Ativa</option>
                    <option value="CANCELADA">Cancelada</option>
                    <option value="EM_IMPLANTACAO">Em implantação</option>
                  </select>
                ) : (
                  <div className="field-value">
                    {apolice.status === 'ATIVA' ? 'Ativa' :
                     apolice.status === 'CANCELADA' ? 'Cancelada' :
                     apolice.status === 'EM_IMPLANTACAO' ? 'Em implantação' :
                     apolice.status}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Produto</label>
                {isEditing ? (
                  <>
                    <input
                      name="produto"
                      type="text"
                      className="input"
                      value={formData.produto || ''}
                      onChange={handleChange}
                      list="produtos-list-detalhes"
                      placeholder="Selecione ou digite um produto"
                    />
                    <datalist id="produtos-list-detalhes">
                      {produtos.map(produto => (
                        <option key={produto.id} value={produto.valor}>
                          {produto.valor}
                        </option>
                      ))}
                    </datalist>
                  </>
                ) : (
                  <div className="field-value">{apolice.produto || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Cliente</label>
                <div className="field-value">{apolice.empresa?.grupoEconomico?.name || '-'}</div>
              </div>

              <div className="form-group small-field">
                <label>CNPJ</label>
                <div className="field-value">
                  {formatCNPJ(apolice.empresa?.cnpj)}
                </div>
              </div>

              <div className="form-group">
                <label>Razão Social</label>
                <div className="field-value">
                  {apolice.empresa?.razaoSocial || '-'}
                </div>
              </div>

              <div className="form-group">
                <label>Fornecedor</label>
                <div className="field-value">{apolice.fornecedor?.razaoSocial || '-'}</div>
              </div>

              <div className="form-group">
                <label>Data de Vigência MDS</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="dataVigenciaMDS"
                    className="input"
                    value={formData.dataVigenciaMDS ? new Date(formData.dataVigenciaMDS).toISOString().split('T')[0] : ''}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="field-value">{formatDate(apolice.dataVigenciaMDS)}</div>
                )}
              </div>

              <div className="form-group">
                <label>Data de Vigência do Contrato</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="dataVigenciaContratoInicio"
                    className="input"
                    value={formData.dataVigenciaContratoInicio ? new Date(formData.dataVigenciaContratoInicio).toISOString().split('T')[0] : ''}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="field-value">{formatDate(apolice.dataVigenciaContratoInicio)}</div>
                )}
              </div>

              <div className="form-group small-field">
                <label>Período de Vigência</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="periodoVigencia"
                    className="input"
                    value={formData.periodoVigencia || ''}
                    onChange={handleChange}
                    placeholder="Ex: 12 meses, Anual, etc."
                  />
                ) : (
                  <div className="field-value">{apolice.periodoVigencia || '-'}</div>
                )}
              </div>

              <div className="form-group small-field">
                <label>Porte do Cliente</label>
                {isEditing ? (
                  <>
                    <input
                      name="porteCliente"
                      type="text"
                      className="input"
                      value={formData.porteCliente || ''}
                      onChange={handleChange}
                      list="portes-list-detalhes"
                      placeholder="Selecione ou digite o porte"
                    />
                    <datalist id="portes-list-detalhes">
                      {portes.map(porte => (
                        <option key={porte.id} value={porte.valor}>
                          {porte.valor}
                        </option>
                      ))}
                    </datalist>
                  </>
                ) : (
                  <div className="field-value">{apolice.porteCliente || '-'}</div>
                )}
              </div>
            </div>

            {/* Dados Cadastrais - Seção Expansível */}
            <div className="collapsible-section" style={{ marginTop: '24px' }}>
              <div 
                className="collapsible-header"
                onClick={() => setDadosCadastraisExpanded(!dadosCadastraisExpanded)}
              >
                <div className="collapsible-title">
                  {dadosCadastraisExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <h4>Dados Cadastrais</h4>
                </div>
              </div>
              {dadosCadastraisExpanded && (
                <div className="collapsible-content">
                  <div className="form-grid">
                    <div className="form-group small-field">
                      <label>Código CNAE</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="codigoCNAE"
                          className="input"
                          value={formData.codigoCNAE || ''}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{apolice.codigoCNAE || '-'}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Ramo de Atividade</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="ramoAtividade"
                          className="input"
                          value={formData.ramoAtividade || ''}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{apolice.ramoAtividade || '-'}</div>
                      )}
                    </div>

                    <div className="form-group small-field">
                      <label>Inscrição Estadual</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="inscricaoEstadual"
                          className="input"
                          value={formData.inscricaoEstadual || ''}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{apolice.inscricaoEstadual || '-'}</div>
                      )}
                    </div>

                    <div className="form-group small-field">
                      <label>Inscrição Municipal</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="inscricaoMunicipal"
                          className="input"
                          value={formData.inscricaoMunicipal || ''}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{apolice.inscricaoMunicipal || '-'}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub Estipulantes */}
            <div className="collapsible-section" style={{ marginTop: '24px' }}>
              <div 
                className="collapsible-header"
                onClick={() => setSubEstipulantesExpanded(!subEstipulantesExpanded)}
              >
                <div className="collapsible-title">
                  {subEstipulantesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <h4>Sub Estipulantes</h4>
                  <span className="item-count">({subEstipulantes.length})</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {subEstipulantes.length > 0 && (
                    <button 
                      className="btn-icon"
                      title="Visualizar Todos"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowViewAllSubEstipulantes(true)
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  <button 
                    className="btn-icon"
                    title="Adicionar Sub Estipulante"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingSubEstipulanteId(null)
                      setShowSubEstipulanteModal(true)
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {subEstipulantesExpanded && (
                <div className="collapsible-content">
                  {subEstipulantes.length === 0 ? (
                    <div className="empty-subsection">
                      Nenhum sub estipulante cadastrado
                    </div>
                  ) : (
                    <table className="sub-table">
                      <thead>
                        <tr>
                          <th>Cód. Estipulante</th>
                          <th>Razão Social</th>
                          <th>Tipo</th>
                          <th>Data de Vigência</th>
                          <th>Data de Cancelamento</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subEstipulantes.map((subEstipulante) => (
                          <tr key={subEstipulante.id}>
                            <td>{subEstipulante.codigoEstipulante}</td>
                            <td>{subEstipulante.razaoSocial}</td>
                            <td>{subEstipulante.tipo === 'PRESTADOR_SERVICO' ? 'Prestador de Serviço' : subEstipulante.tipo === 'OUTRO' ? 'Outro' : '-'}</td>
                            <td>{formatDate(subEstipulante.dataVigenciaContrato)}</td>
                            <td>{formatDate(subEstipulante.dataCancelamento)}</td>
                            <td>
                              <span className={`status-badge status-${subEstipulante.status.toLowerCase()}`}>
                                {subEstipulante.status}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn-icon"
                                  title="Visualizar"
                                  onClick={() => {
                                    setViewingSubEstipulanteId(subEstipulante.id)
                                  }}
                                >
                                  <Eye size={16} />
                                </button>
                                <button 
                                  className="btn-icon"
                                  title="Editar"
                                  onClick={() => {
                                    setEditingSubEstipulanteId(subEstipulante.id)
                                    setShowSubEstipulanteModal(true)
                                  }}
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  className="btn-icon"
                                  title="Excluir"
                                  onClick={() => handleDeleteSubEstipulante(subEstipulante.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Plano e Cobertura */}
            <div className="collapsible-section" style={{ marginTop: '24px' }}>
              <div 
                className="collapsible-header"
                onClick={() => setPlanosExpanded(!planosExpanded)}
              >
                <div className="collapsible-title">
                  {planosExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <h4>Plano e Cobertura</h4>
                  <span className="item-count">
                    ({cobertura ? '1 Cobertura' : `${planos.length} ${planos.length === 1 ? 'Plano' : 'Planos'}`})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!cobertura && (
                    <button 
                      className="btn-icon"
                      title="Adicionar Plano"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTipoCadastro('plano')
                        setEditingPlanoId(null)
                        setShowPlanoModal(true)
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                  {planos.length === 0 && (
                    <button 
                      className="btn-icon"
                      title="Adicionar Cobertura"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTipoCadastro('cobertura')
                        setEditingCoberturaId(null)
                        setShowCoberturaModal(true)
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>

              {planosExpanded && (
                <div className="collapsible-content">
                  {cobertura ? (
                    <div>
                      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h5 style={{ margin: 0 }}>Cobertura</h5>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn-icon"
                            title="Editar Cobertura"
                            onClick={() => {
                              setEditingCoberturaId(cobertura.id)
                              setShowCoberturaModal(true)
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn-icon"
                            title="Excluir Cobertura"
                            onClick={async () => {
                              if (window.confirm('Tem certeza que deseja excluir esta cobertura?')) {
                                try {
                                  await api.delete(`/coberturas/${cobertura.id}`)
                                  setCobertura(null)
                                  fetchCobertura()
                                } catch (error: any) {
                                  alert(error.response?.data?.error || 'Erro ao excluir cobertura')
                                }
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="label">Tipo de Multiplicador</label>
                          <div className="field-value">
                            {cobertura.tipoMultiplicador === 'SALARIAL' ? 'Múltiplo Salarial' :
                             cobertura.tipoMultiplicador === 'UNIFORME' ? 'Uniforme' :
                             cobertura.tipoMultiplicador === 'ESCALONADO' ? 'Escalonado' :
                             cobertura.tipoMultiplicador === 'GLOBAL' ? 'Global' : '-'}
                          </div>
                        </div>
                        {cobertura.tipoMultiplicador && (
                          <>
                            <div className="form-group">
                              <label className="label">Mínimo</label>
                              <div className="field-value">{cobertura.multiplicadorMin || '-'}</div>
                            </div>
                            <div className="form-group">
                              <label className="label">Máximo</label>
                              <div className="field-value">{cobertura.multiplicadorMax || '-'}</div>
                            </div>
                          </>
                        )}
                      </div>
                      {cobertura.tipoMultiplicador === 'SALARIAL' && (
                        <div className="form-row">
                          <div className="form-group">
                            <label className="label">Múltiplo</label>
                            <div className="field-value">{cobertura.multiplo || '-'}</div>
                          </div>
                        </div>
                      )}
                      <div className="form-row">
                        <div className="form-group">
                          <label className="label">Taxa Adm</label>
                          <div className="field-value">{cobertura.taxaAdm || '-'}</div>
                        </div>
                      </div>
                      {cobertura.items && cobertura.items.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                          <h5 style={{ marginBottom: '16px' }}>Itens de Cobertura</h5>
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
                                  <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Cobertura</th>
                                  <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Tipo</th>
                                  <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Titular</th>
                                  <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Cônjuge</th>
                                  <th style={{ background: '#00225f', color: 'white', padding: '8px 10px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Filhos</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cobertura.items.filter((item: any) => item.selecionado).map((item: any, index: number) => (
                                  <tr key={item.id}>
                                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>{item.nome}</td>
                                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                                      {item.tipoValor === 'VALOR_FIXO' ? 'Valor Fixo' : 'Percentual'}
                                    </td>
                                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                                      {item.tipoValor === 'VALOR_FIXO' 
                                        ? (item.valorFixoTitular ? `R$ ${parseFloat(item.valorFixoTitular.toString()).toFixed(2)}` : '-')
                                        : (item.percentualTitular ? `${item.percentualTitular}%` : '-')}
                                    </td>
                                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                                      {item.tipoValor === 'VALOR_FIXO' 
                                        ? (item.valorFixoConjuge ? `R$ ${parseFloat(item.valorFixoConjuge.toString()).toFixed(2)}` : '-')
                                        : (item.percentualConjuge ? `${item.percentualConjuge}%` : '-')}
                                    </td>
                                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                                      {item.tipoValor === 'VALOR_FIXO' 
                                        ? (item.valorFixoFilhos ? `R$ ${parseFloat(item.valorFixoFilhos.toString()).toFixed(2)}` : '-')
                                        : (item.percentualFilhos ? `${item.percentualFilhos}%` : '-')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : planos.length === 0 ? (
                    <div className="empty-subsection">
                      Nenhum plano ou cobertura cadastrado
                    </div>
                  ) : (
                    <table className="sub-table">
                      <thead>
                        <tr>
                          <th>Nome do Plano</th>
                          <th>Código ANS</th>
                          <th>Código do Plano</th>
                          <th>Vidas Implantadas</th>
                          <th>Valor do Plano</th>
                          <th>Início de Vigência</th>
                          <th>Fim de Vigência</th>
                          <th>Upgrade</th>
                          <th>Downgrade</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {planos.map((plano) => {
                          const formatValorPlano = () => {
                            if (plano.tipoValorPlano === 'custo_medio') {
                              return plano.valorPlano || plano.custoMedio ? `R$ ${(plano.valorPlano || plano.custoMedio).toFixed(2)}` : '-'
                            } else if (plano.tipoValorPlano === 'faixa_etaria') {
                              return 'Faixa Etária'
                            }
                            return '-'
                          }

                          const planoReembolsos = reembolsos[plano.id] || []

                          return (
                            <tr key={plano.id}>
                              <td>{plano.nomePlano}</td>
                              <td>{plano.codANS || '-'}</td>
                              <td>{plano.codPlano || '-'}</td>
                              <td>{plano.vidasImplantadas || '-'}</td>
                              <td>{formatValorPlano()}</td>
                              <td>{formatDate(plano.inicioVigencia)}</td>
                              <td>{formatDate(plano.fimVigencia)}</td>
                              <td>{plano.upgrade ? 'Sim' : 'Não'}</td>
                              <td>{plano.downgrade ? 'Sim' : 'Não'}</td>
                              <td>
                                <div className="action-buttons">
                                  <button 
                                    className="btn-icon"
                                    title="Visualizar"
                                    onClick={() => {
                                      // Usar os dados já carregados em vez de fazer novas requisições
                                      const planoCompleto = plano
                                      const reembolsosData = reembolsos[plano.id] || []
                                      const coparticipacoesData = coparticipacoes[plano.id] || []
                                      
                                      setPlanoDetalhes({
                                        ...planoCompleto,
                                        reembolsos: reembolsosData,
                                        coparticipacoes: coparticipacoesData
                                      })
                                      setShowPlanoDetalhesModal(true)
                                    }}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button 
                                    className="btn-icon"
                                    title="Editar"
                                    onClick={() => {
                                      setTipoCadastro('plano')
                                      setEditingPlanoId(plano.id)
                                      setShowPlanoModal(true)
                                    }}
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button 
                                    className="btn-icon"
                                    title="Excluir"
                                    onClick={() => handleDeletePlano(plano.id)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Sub-item Dados e Regras - Faturamento */}
            <div className="collapsible-section" style={{ marginTop: '24px' }}>
              <div 
                className="collapsible-header"
                onClick={() => setDadosRegrasExpanded(!dadosRegrasExpanded)}
              >
                <div className="collapsible-title">
                  {dadosRegrasExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <h4>Dados e Regras</h4>
                </div>
                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  {isEditingDadosRegras ? (
                    <>
                      <button 
                        className="btn-icon"
                        title="Salvar"
                        onClick={handleSaveDadosRegras}
                        disabled={saving}
                      >
                        <Save size={16} />
                      </button>
                      <button 
                        className="btn-icon"
                        title="Cancelar"
                        onClick={handleCancelDadosRegras}
                        disabled={saving}
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn-icon"
                      title="Editar"
                      onClick={() => {
                        setIsEditingDadosRegras(true)
                        if (apolice) {
                          setFormData({
                            ...formData,
                            dataVencimentoFatura: apolice.dataVencimentoFatura,
                            emissao: apolice.emissao,
                            dataEntrega: apolice.dataEntrega,
                            dataCorte: apolice.dataCorte,
                            codigoProducaoAngariador: apolice.codigoProducaoAngariador
                          })
                        }
                      }}
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {dadosRegrasExpanded && (
                <div className="collapsible-content">
                  <div className="form-section-title" style={{ marginTop: 0, marginBottom: '16px' }}>Faturamento</div>
                  <div className="form-row">
                    <div className="form-group small-field">
                      <label className="label">Data de Vencimento de Fatura</label>
                      {isEditingDadosRegras ? (
                        <input
                          type="date"
                          name="dataVencimentoFatura"
                          className="input"
                          value={formData.dataVencimentoFatura ? new Date(formData.dataVencimentoFatura).toISOString().split('T')[0] : ''}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{apolice?.dataVencimentoFatura ? formatDate(apolice.dataVencimentoFatura) : '-'}</div>
                      )}
                    </div>
                    <div className="form-group small-field">
                      <label className="label">Emissão</label>
                      {isEditingDadosRegras ? (
                        <input
                          type="date"
                          name="emissao"
                          className="input"
                          value={formData.emissao ? new Date(formData.emissao).toISOString().split('T')[0] : ''}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{apolice?.emissao ? formatDate(apolice.emissao) : '-'}</div>
                      )}
                    </div>
                    <div className="form-group small-field">
                      <label className="label">Data de Entrega</label>
                      {isEditingDadosRegras ? (
                        <input
                          type="date"
                          name="dataEntrega"
                          className="input"
                          value={formData.dataEntrega ? new Date(formData.dataEntrega).toISOString().split('T')[0] : ''}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{apolice?.dataEntrega ? formatDate(apolice.dataEntrega) : '-'}</div>
                      )}
                    </div>
                    <div className="form-group small-field">
                      <label className="label">Data Corte</label>
                      {isEditingDadosRegras ? (
                        <input
                          type="date"
                          name="dataCorte"
                          className="input"
                          value={formData.dataCorte ? new Date(formData.dataCorte).toISOString().split('T')[0] : ''}
                          onChange={handleChange}
                        />
                      ) : (
                        <div className="field-value">{apolice?.dataCorte ? formatDate(apolice.dataCorte) : '-'}</div>
                      )}
                    </div>
                    <div className="form-group small-field">
                      <label className="label">Código de Produção/Angariador</label>
                      {isEditingDadosRegras ? (
                        <input
                          type="text"
                          name="codigoProducaoAngariador"
                          className="input"
                          value={formData.codigoProducaoAngariador || ''}
                          onChange={handleChange}
                          placeholder="Código de Produção/Angariador"
                        />
                      ) : (
                        <div className="field-value">{apolice?.codigoProducaoAngariador || '-'}</div>
                      )}
                    </div>
                  </div>

                  {/* Seção Agrupamento */}
                  <div style={{ marginTop: '32px' }}>
                    <div className="form-section-title" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Agrupamento</span>
                      {isEditingDadosRegras && (
                        <button
                          className="btn-primary"
                          onClick={() => {
                            setEditingAgrupamentoNome(null)
                            setAgrupamentoForm({
                              nome: '',
                              estipulanteId: null,
                              subEstipulanteIds: [],
                              liderId: null,
                              emails: [],
                              informacoesAdicionaisMailing: ''
                            })
                            setShowAgrupamentoModal(true)
                          }}
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          <Plus size={16} style={{ marginRight: '8px' }} />
                          Novo Agrupamento
                        </button>
                      )}
                    </div>

                    {agrupamentosFaturamento.length === 0 ? (
                      <div className="empty-subsection" style={{ marginTop: '16px' }}>
                        Nenhum agrupamento configurado
                      </div>
                    ) : (
                      <div style={{ marginTop: '16px' }}>
                        {Array.from(new Set(agrupamentosFaturamento.map(ag => ag.nome))).map((nomeGrupo) => {
                          const itensGrupo = agrupamentosFaturamento.filter(ag => ag.nome === nomeGrupo)
                          return (
                            <div key={nomeGrupo} style={{
                              background: '#f9f9f9',
                              padding: '16px',
                              borderRadius: '8px',
                              marginBottom: '12px',
                              border: '1px solid #e9e9e9'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginBottom: '12px' 
                              }}>
                                <div style={{ fontWeight: 600, color: '#00225f' }}>
                                  {nomeGrupo}
                                </div>
                                {isEditingDadosRegras && (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      className="btn-icon"
                                      title="Adicionar itens ao agrupamento"
                                      onClick={() => {
                                        setEditingAgrupamentoNome(nomeGrupo)
                                        // Carregar itens já existentes no agrupamento
                                        const itensExistentes = agrupamentosFaturamento.filter(ag => ag.nome === nomeGrupo)
                                        const subEstipulantesIds = itensExistentes
                                          .filter(ag => ag.subEstipulanteId)
                                          .map(ag => ag.subEstipulanteId)
                                        const temEstipulante = itensExistentes.some(ag => ag.estipulanteId)
                                        
                                        const liderExistente = itensExistentes.find(ag => ag.isLider)
                                        const liderId = liderExistente 
                                          ? (liderExistente.estipulanteId || liderExistente.subEstipulanteId || null)
                                          : null
                                        
                                        // Carregar e-mails e informações adicionais do primeiro item do agrupamento
                                        const primeiroItem = itensExistentes[0]
                                        const emailsExistentes = primeiroItem?.emails 
                                          ? (Array.isArray(primeiroItem.emails) ? primeiroItem.emails : primeiroItem.emails.split(',').filter((e: string) => e.trim()))
                                          : []
                                        
                                        setAgrupamentoForm({
                                          nome: nomeGrupo,
                                          estipulanteId: temEstipulante ? (apolice?.empresa?.id || null) : null,
                                          subEstipulanteIds: subEstipulantesIds,
                                          liderId: liderId,
                                          emails: emailsExistentes,
                                          informacoesAdicionaisMailing: primeiroItem?.informacoesAdicionaisMailing || ''
                                        })
                                        setShowAgrupamentoModal(true)
                                      }}
                                    >
                                      <Plus size={16} />
                                    </button>
                                    <button
                                      className="btn-icon"
                                      title="Editar agrupamento"
                                      onClick={() => {
                                        setEditingAgrupamentoNome(nomeGrupo)
                                        // Carregar dados do agrupamento
                                        const itensExistentes = agrupamentosFaturamento.filter(ag => ag.nome === nomeGrupo)
                                        const subEstipulantesIds = itensExistentes
                                          .filter(ag => ag.subEstipulanteId)
                                          .map(ag => ag.subEstipulanteId)
                                        const temEstipulante = itensExistentes.some(ag => ag.estipulanteId)
                                        
                                        const liderExistente = itensExistentes.find(ag => ag.isLider)
                                        const liderId = liderExistente 
                                          ? (liderExistente.estipulanteId || liderExistente.subEstipulanteId || null)
                                          : null
                                        
                                        // Carregar e-mails e informações adicionais do primeiro item do agrupamento
                                        const primeiroItem = itensExistentes[0]
                                        const emailsExistentes = primeiroItem?.emails 
                                          ? (Array.isArray(primeiroItem.emails) ? primeiroItem.emails : primeiroItem.emails.split(',').filter((e: string) => e.trim()))
                                          : []
                                        
                                        setAgrupamentoForm({
                                          nome: nomeGrupo,
                                          estipulanteId: temEstipulante ? (apolice?.empresa?.id || null) : null,
                                          subEstipulanteIds: subEstipulantesIds,
                                          liderId: liderId,
                                          emails: emailsExistentes,
                                          informacoesAdicionaisMailing: primeiroItem?.informacoesAdicionaisMailing || ''
                                        })
                                        setShowAgrupamentoModal(true)
                                      }}
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      className="btn-icon"
                                      title="Excluir agrupamento"
                                      onClick={() => {
                                        if (window.confirm(`Tem certeza que deseja excluir o agrupamento "${nomeGrupo}"?`)) {
                                          setAgrupamentosFaturamento(
                                            agrupamentosFaturamento.filter(ag => ag.nome !== nomeGrupo)
                                          )
                                        }
                                      }}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {itensGrupo.map((ag) => {
                                  let nome = 'N/A'
                                  let cnpj = '-'
                                  let identificador = '-'
                                  
                                  if (ag.estipulanteId) {
                                    // Estipulante Principal (usa a empresa/cliente da apólice)
                                    nome = apolice?.empresa?.razaoSocial || 'N/A'
                                    cnpj = apolice?.empresa?.cnpj ? formatCNPJ(apolice.empresa.cnpj) : '-'
                                    identificador = `Apólice: ${apolice?.numero || '-'}`
                                  } else {
                                    // Sub Estipulante
                                    const subEst = subEstipulantes.find(se => se.id === ag.subEstipulanteId)
                                    nome = subEst?.razaoSocial || 'N/A'
                                    cnpj = subEst?.cnpj ? formatCNPJ(subEst.cnpj) : '-'
                                    identificador = `Código: ${subEst?.codigoEstipulante || '-'}`
                                  }
                                  
                                  return (
                                    <div key={ag.id} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '12px',
                                      background: 'white',
                                      borderRadius: '6px',
                                      border: ag.isLider ? '2px solid #3d9b8e' : '1px solid #ddd'
                                    }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          {ag.isLider && (
                                            <span style={{
                                              background: '#3d9b8e',
                                              color: 'white',
                                              padding: '2px 8px',
                                              borderRadius: '4px',
                                              fontSize: '11px',
                                              fontWeight: 600
                                            }}>
                                              LÍDER
                                            </span>
                                          )}
                                          <span style={{ fontWeight: 600 }}>{nome}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
                                          <span>{identificador}</span>
                                          <span>CNPJ: {cnpj}</span>
                                          <span style={{ color: '#999' }}>
                                            {ag.estipulanteId ? '(Estipulante Principal)' : '(Sub Estipulante)'}
                                          </span>
                                        </div>
                                      </div>
                                      {isEditingDadosRegras && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <button
                                            className="btn-icon"
                                            title={ag.isLider ? 'Remover líder' : 'Definir como líder'}
                                            onClick={() => handleToggleLider(ag.id)}
                                            style={{
                                              background: ag.isLider ? '#3d9b8e' : 'transparent',
                                              color: ag.isLider ? 'white' : '#666'
                                            }}
                                          >
                                            {ag.isLider ? '✓' : '○'}
                                          </button>
                                          <button
                                            className="btn-icon"
                                            title="Remover"
                                            onClick={() => handleRemoveAgrupamento(ag.id)}
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                              
                              {/* Exibir E-mails e Informações Adicionais de Mailing */}
                              {(itensGrupo[0]?.emails?.length > 0 || itensGrupo[0]?.informacoesAdicionaisMailing) && (
                                <div style={{ 
                                  marginTop: '16px', 
                                  padding: '12px', 
                                  background: '#f0f7ff', 
                                  borderRadius: '6px',
                                  border: '1px solid #d0e7ff'
                                }}>
                                  {itensGrupo[0]?.emails?.length > 0 && (
                                    <div style={{ marginBottom: itensGrupo[0]?.informacoesAdicionaisMailing ? '12px' : '0' }}>
                                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#00225f', marginBottom: '6px' }}>
                                        E-mails para Entrega:
                                      </div>
                                      <div style={{ fontSize: '13px', color: '#333' }}>
                                        {Array.isArray(itensGrupo[0].emails) 
                                          ? itensGrupo[0].emails.join(', ')
                                          : (typeof itensGrupo[0].emails === 'string' 
                                            ? itensGrupo[0].emails.split(',').map((e: string) => e.trim()).join(', ')
                                            : itensGrupo[0].emails)
                                        }
                                      </div>
                                    </div>
                                  )}
                                  {itensGrupo[0]?.informacoesAdicionaisMailing && (
                                    <div>
                                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#00225f', marginBottom: '6px' }}>
                                        Informações Adicionais - Mailing:
                                      </div>
                                      <div style={{ fontSize: '13px', color: '#333', whiteSpace: 'pre-wrap' }}>
                                        {itensGrupo[0].informacoesAdicionaisMailing}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sub-item Reajuste e Reavaliação */}
            <div className="collapsible-section" style={{ marginTop: '24px' }}>
              <div 
                className="collapsible-header"
                onClick={() => setReajustesExpanded(!reajustesExpanded)}
              >
                <div className="collapsible-title">
                  {reajustesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <h4>Reajuste e Reavaliação</h4>
                  <span className="item-count">({reajustes.length})</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="btn-icon"
                    title="Adicionar Reajuste"
                    onClick={() => {
                      setEditingReajusteId(null)
                      setShowReajusteModal(true)
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              
              {reajustesExpanded && (
                <div className="collapsible-content">
                  {reajustes.length === 0 ? (
                    <div className="empty-subsection">
                      Nenhum reajuste cadastrado
                    </div>
                  ) : (
                    <table className="sub-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>
                            <input type="checkbox" />
                          </th>
                          <th>Tipo</th>
                          <th>Início do Período</th>
                          <th>Fim do Período</th>
                          <th>Índice Apurado</th>
                          <th>Índice Aplicado</th>
                          <th style={{ color: '#a42340' }}>Mês Aplicado</th>
                          <th>Data de Negociação</th>
                          <th>Conclusão</th>
                          <th>Observação</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reajustes.map((reajuste) => (
                          <tr key={reajuste.id}>
                            <td>
                              <input type="checkbox" />
                            </td>
                            <td>{reajuste.tipo || '-'}</td>
                            <td>{reajuste.inicioPeriodo || '-'}</td>
                            <td>{reajuste.fimPeriodo || '-'}</td>
                            <td>{reajuste.indiceApurado?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>
                            <td>{reajuste.indiceAplicado?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</td>
                            <td style={{ color: '#a42340', fontWeight: 600 }}>{reajuste.mesAplicado || '-'}</td>
                            <td>{reajuste.dataNegociacao || '-'}</td>
                            <td>{reajuste.conclusao || '-'}</td>
                            <td>{reajuste.observacao || '-'}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-icon"
                                  title="Editar"
                                  onClick={() => {
                                    setEditingReajusteId(reajuste.id)
                                    setShowReajusteModal(true)
                                  }}
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="btn-icon"
                                  title="Excluir"
                                  onClick={() => handleDeleteReajuste(reajuste.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'informacoes' && (
          <div className="form-section">
            <div className="section-title">Informações Adicionais</div>
            <div className="form-grid">
              <div className="form-group small-field">
                <label>Limite Técnico</label>
                {isEditing ? (
                  <select
                    name="limiteTecnico"
                    className="input"
                    value={formData.limiteTecnico || ''}
                    onChange={handleChange}
                  >
                    <option value="">Selecione o limite</option>
                    {Array.from({ length: 51 }, (_, i) => {
                      const valor = 50 + i
                      return (
                        <option key={valor} value={`${valor}%`}>
                          {valor}%
                        </option>
                      )
                    })}
                  </select>
                ) : (
                  <div className="field-value">{apolice.limiteTecnico || '-'}</div>
                )}
              </div>

              <div className="form-group small-field">
                <label>Regime de Contratação</label>
                {isEditing ? (
                  <select
                    name="regimeContratacao"
                    className="input"
                    value={formData.regimeContratacao || ''}
                    onChange={handleChange}
                  >
                    <option value="">Selecione o regime</option>
                    <option value="PRE_PAGAMENTO">Pré Pagamento</option>
                    <option value="POS_PAGAMENTO">Pós Pagamento</option>
                  </select>
                ) : (
                  <div className="field-value">
                    {apolice.regimeContratacao === 'PRE_PAGAMENTO' ? 'Pré Pagamento' : 
                     apolice.regimeContratacao === 'POS_PAGAMENTO' ? 'Pós Pagamento' : 
                     '-'}
                  </div>
                )}
              </div>

              <div className="form-group small-field">
                <label>Tipo de Contrato</label>
                {isEditing ? (
                  <select
                    name="tipoContrato"
                    className="input"
                    value={formData.tipoContrato || ''}
                    onChange={handleChange}
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="COMPULSORIO">Compulsório</option>
                    <option value="LIVRE_ADESAO">Livre Adesão</option>
                  </select>
                ) : (
                  <div className="field-value">
                    {apolice.tipoContrato === 'COMPULSORIO' ? 'Compulsório' : 
                     apolice.tipoContrato === 'LIVRE_ADESAO' ? 'Livre Adesão' : 
                     '-'}
                  </div>
                )}
              </div>

              <div className="form-group small-field">
                <label>Coparticipação</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="coparticipacao"
                    className="input"
                    value={formData.coparticipacao || ''}
                    onChange={handleChange}
                    placeholder="Coparticipação"
                  />
                ) : (
                  <div className="field-value">{apolice.coparticipacao || '-'}</div>
                )}
              </div>

              <div className="form-group small-field">
                <label>Mês de Reajuste</label>
                {isEditing ? (
                  <select
                    name="mesReajuste"
                    className="input"
                    value={formData.mesReajuste || ''}
                    onChange={handleChange}
                  >
                    <option value="">Selecione o mês</option>
                    <option value="JANEIRO">Janeiro</option>
                    <option value="FEVEREIRO">Fevereiro</option>
                    <option value="MARCO">Março</option>
                    <option value="ABRIL">Abril</option>
                    <option value="MAIO">Maio</option>
                    <option value="JUNHO">Junho</option>
                    <option value="JULHO">Julho</option>
                    <option value="AGOSTO">Agosto</option>
                    <option value="SETEMBRO">Setembro</option>
                    <option value="OUTUBRO">Outubro</option>
                    <option value="NOVEMBRO">Novembro</option>
                    <option value="DEZEMBRO">Dezembro</option>
                  </select>
                ) : (
                  <div className="field-value">
                    {apolice.mesReajuste ? 
                      apolice.mesReajuste.charAt(0) + apolice.mesReajuste.slice(1).toLowerCase() : 
                      '-'}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-item Endereço */}
            <div className="collapsible-section" style={{ marginTop: '24px' }}>
              <div 
                className="collapsible-header"
                onClick={() => setEnderecosExpanded(!enderecosExpanded)}
              >
                <div className="collapsible-title">
                  {enderecosExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <h4>Endereço</h4>
                  <span className="item-count">({enderecosApolice.length})</span>
                </div>
                <button 
                  className="btn-icon"
                  title="Adicionar Endereço"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingEnderecoId(null)
                    setShowEnderecoModal(true)
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {enderecosExpanded && (
                <div className="collapsible-content">
                  {enderecosApolice.length === 0 ? (
                    <div className="empty-subsection">
                      Nenhum endereço cadastrado
                    </div>
                  ) : (
                    <table className="sub-table">
                      <thead>
                        <tr>
                          <th>Tipo de Endereço</th>
                          <th>CEP</th>
                          <th>Tipo de Logradouro</th>
                          <th>Logradouro</th>
                          <th>Sem Número</th>
                          <th>Número</th>
                          <th>Complemento</th>
                          <th>Bairro</th>
                          <th>UF</th>
                          <th>Cidade</th>
                          <th style={{ width: '120px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enderecosApolice.map((endereco) => (
                          <tr key={endereco.id}>
                            <td>{endereco.tipo || '-'}</td>
                            <td>{endereco.cep || '-'}</td>
                            <td>{endereco.tipoLogradouro || '-'}</td>
                            <td>{endereco.logradouro || '-'}</td>
                            <td>{endereco.semNumero ? 'Sim' : 'Não'}</td>
                            <td>{endereco.numero || '-'}</td>
                            <td>{endereco.complemento || '-'}</td>
                            <td>{endereco.bairro || '-'}</td>
                            <td>{endereco.uf || '-'}</td>
                            <td>{endereco.cidade || '-'}</td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn-icon"
                                  title="Editar"
                                  onClick={() => {
                                    setEditingEnderecoId(endereco.id)
                                    setShowEnderecoModal(true)
                                  }}
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  className="btn-icon"
                                  title="Excluir"
                                  onClick={() => handleDeleteEndereco(endereco.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Sub-item Mailing */}
            <div className="collapsible-section" style={{ marginTop: '24px' }}>
              <div 
                className="collapsible-header"
                onClick={() => setContatosExpanded(!contatosExpanded)}
              >
                <div className="collapsible-title">
                  {contatosExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <h4>Mailing</h4>
                  <span className="item-count">({contatosApolice.length})</span>
                </div>
                <button 
                  className="btn-icon"
                  title="Adicionar Contato"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingContatoId(null)
                    setShowContatoModal(true)
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {contatosExpanded && (
                <div className="collapsible-content">
                  {contatosApolice.length === 0 ? (
                    <div className="empty-subsection">
                      Nenhum contato cadastrado
                    </div>
                  ) : (
                    <table className="sub-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Cargo</th>
                          <th>E-mail</th>
                          <th>Telefone</th>
                          <th>Data de Nascimento</th>
                          <th>Ativo</th>
                          <th style={{ width: '120px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contatosApolice.map((contato) => (
                          <tr key={contato.id}>
                            <td>{contato.nome}</td>
                            <td>{contato.cargo || '-'}</td>
                            <td>{contato.email || '-'}</td>
                            <td>{contato.telefone || '-'}</td>
                            <td>{contato.dataNascimento ? new Date(contato.dataNascimento).toLocaleDateString('pt-BR') : '-'}</td>
                            <td>{contato.ativo ? 'Sim' : 'Não'}</td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn-icon"
                                  title="Editar"
                                  onClick={() => {
                                    setEditingContatoId(contato.id)
                                    setShowContatoModal(true)
                                  }}
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  className="btn-icon"
                                  title="Excluir"
                                  onClick={() => handleDeleteContato(contato.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Sub-item Elegibilidade */}
            <div className="collapsible-section" style={{ marginTop: '24px' }}>
              <div 
                className="collapsible-header"
                onClick={() => setElegibilidadesExpanded(!elegibilidadesExpanded)}
              >
                <div className="collapsible-title">
                  {elegibilidadesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  <h4>Elegibilidade</h4>
                  <span className="item-count">({elegibilidades.length})</span>
                </div>
                <button 
                  className="btn-icon"
                  title="Adicionar Elegibilidade"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingElegibilidadeId(null)
                    setShowElegibilidadeModal(true)
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {elegibilidadesExpanded && (
                <div className="collapsible-content">
                  {elegibilidades.length === 0 ? (
                    <div className="empty-subsection">
                      Nenhuma elegibilidade cadastrada
                    </div>
                  ) : (
                    <table className="sub-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Centro de Custo</th>
                          <th>CNPJ</th>
                          <th>Descrição</th>
                          <th style={{ width: '120px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {elegibilidades.map((elegibilidade) => (
                          <tr key={elegibilidade.id}>
                            <td>{elegibilidade.nome}</td>
                            <td>{elegibilidade.centroCusto || '-'}</td>
                            <td>{elegibilidade.cnpj || '-'}</td>
                            <td>{elegibilidade.descricao || '-'}</td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn-icon"
                                  title="Editar"
                                  onClick={() => {
                                    setEditingElegibilidadeId(elegibilidade.id)
                                    setShowElegibilidadeModal(true)
                                  }}
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  className="btn-icon"
                                  title="Excluir"
                                  onClick={() => handleDeleteElegibilidade(elegibilidade.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'relacionamento' && (
          <div className="form-section">
            <div className="section-header">
              <div className="section-title">Relacionamento</div>
              <button 
                className="btn-icon"
                title={relacionamento ? 'Editar Relacionamento' : 'Adicionar Relacionamento'}
                onClick={() => setShowRelacionamentoModal(true)}
              >
                {relacionamento ? <Edit size={16} /> : <Plus size={16} />}
              </button>
            </div>

            {!relacionamento ? (
              <div className="empty-state">
                <FileText size={48} />
                <p>Nenhum relacionamento cadastrado</p>
              </div>
            ) : (
              <div className="form-grid">
                <div className="form-group">
                  <label>Executivo</label>
                  <div className="field-value">
                    {relacionamento.executivo || '-'}
                  </div>
                </div>

                <div className="form-group">
                  <label>Coordenador</label>
                  <div className="field-value">
                    {relacionamento.coordenador || '-'}
                  </div>
                </div>

                <div className="form-group">
                  <label>Gerente</label>
                  <div className="field-value">
                    {relacionamento.gerente || '-'}
                  </div>
                </div>

                <div className="form-group">
                  <label>Superintendente</label>
                  <div className="field-value">
                    {relacionamento.superintendente || '-'}
                  </div>
                </div>

                <div className="form-group">
                  <label>Diretoria</label>
                  <div className="field-value">
                    {relacionamento.diretoria || '-'}
                  </div>
                </div>

                <div className="form-group">
                  <label>Filial</label>
                  <div className="field-value">
                    {relacionamento.filial || '-'}
                  </div>
                </div>

                <div className="form-group">
                  <label>Célula de Atendimento</label>
                  <div className="field-value">
                    {relacionamento.celulaAtendimento || '-'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div className="form-section">
            <div className="section-title">Financeiro</div>
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Tipo de Configuração Financeira</label>
              <select
                className="input"
                value={tipoFinanceiro || ''}
                onChange={(e) => {
                  const value = e.target.value as 'comissionamento' | 'fee' | 'comissionamento_fee' | ''
                  setTipoFinanceiro(value || null)
                }}
              >
                <option value="">Selecione o tipo</option>
                <option value="comissionamento">Comissionamento</option>
                <option value="fee">Fee</option>
                <option value="comissionamento_fee">Comissionamento + Fee</option>
              </select>
            </div>

            {tipoFinanceiro && (
              <>
                {(tipoFinanceiro === 'comissionamento' || tipoFinanceiro === 'comissionamento_fee') && (!comissionamento?.id || editandoComissionamento) && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      background: '#00225f', 
                      color: 'white', 
                      padding: '10px 14px', 
                      borderRadius: '6px 6px 0 0',
                      fontWeight: 600,
                      fontSize: '14px',
                      marginBottom: 0
                    }}>
                      Comissionamento
                    </div>
                    <div style={{ 
                      padding: '16px',
                      background: '#f9f9f9',
                      borderRadius: '0 0 6px 6px'
                    }}>
                      {/* Valores do Contrato */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '16px',
                        marginBottom: '16px',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e9e9e9'
                      }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '6px', display: 'block' }}>
                            Valor Agenciamento do Contrato (%)
                          </label>
                          <input
                            type="number"
                            className="input"
                            placeholder="0%"
                            step="0.01"
                            style={{ fontSize: '13px', padding: '8px' }}
                            defaultValue={comissionamento?.valorAgenciamentoContrato || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null
                              if (!comissionamento) {
                                setComissionamento({ valorAgenciamentoContrato: value })
                              } else {
                                setComissionamento({ ...comissionamento, valorAgenciamentoContrato: value })
                              }
                            }}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '6px', display: 'block' }}>
                            Valor Vitalício do Contrato (%)
                          </label>
                          <input
                            type="number"
                            className="input"
                            placeholder="0%"
                            step="0.01"
                            style={{ fontSize: '13px', padding: '8px' }}
                            defaultValue={comissionamento?.valorVitalicioContrato || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null
                              if (!comissionamento) {
                                setComissionamento({ valorVitalicioContrato: value })
                              } else {
                                setComissionamento({ ...comissionamento, valorVitalicioContrato: value })
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Opção para indicar se tem corretor parceiro */}
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={comissionamento?.temCorretorParceiro || false}
                            onChange={(e) => {
                              if (!comissionamento) {
                                setComissionamento({ temCorretorParceiro: e.target.checked })
                              } else {
                                setComissionamento({ ...comissionamento, temCorretorParceiro: e.target.checked })
                              }
                            }}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span>Possui Corretor Parceiro</span>
                        </label>
                      </div>

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '16px'
                      }}>
                      {/* Agenciamento Consultoria */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, color: '#00225f', fontSize: '14px', fontWeight: 600 }}>
                            Agenciamento <span style={{ color: '#a42340' }}>Consultoria</span>
                          </h4>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Replicar valor do campo preenchido para os campos abaixo"
                            onClick={() => {
                              const percentuais = comissionamento?.agenciamentoConsultoria ? JSON.parse(comissionamento.agenciamentoConsultoria) : Array(12).fill('')
                              // Encontra o índice do primeiro campo preenchido
                              const primeiroIndicePreenchido = percentuais.findIndex((val: string) => val && val.trim() !== '')
                              
                              if (primeiroIndicePreenchido !== -1) {
                                const valorParaReplicar = percentuais[primeiroIndicePreenchido]
                                // Replica apenas para os campos abaixo do preenchido
                                const novosPercentuais = [...percentuais]
                                for (let i = primeiroIndicePreenchido + 1; i < 12; i++) {
                                  novosPercentuais[i] = valorParaReplicar
                                }
                                if (!comissionamento) {
                                  setComissionamento({ agenciamentoConsultoria: JSON.stringify(novosPercentuais) })
                                } else {
                                  setComissionamento({ ...comissionamento, agenciamentoConsultoria: JSON.stringify(novosPercentuais) })
                                }
                              }
                            }}
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Replicar
                          </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '4px', overflow: 'hidden', fontSize: '12px' }}>
                          <thead>
                            <tr>
                              <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Parcela</th>
                              <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Mês</th>
                              <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Percentual</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((parcela) => {
                              const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                              const mesIndexInicial = mesInicial !== null ? mesInicial : (apolice?.dataVigenciaContratoInicio ? new Date(apolice.dataVigenciaContratoInicio).getMonth() : new Date().getMonth())
                              const mesIndex = (mesIndexInicial + parcela - 1) % 12
                              const mes = meses[mesIndex]
                              
                              return (
                                <tr key={parcela}>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                                    {parcela}ª
                                  </td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                                    {parcela === 1 ? (
                                      <select
                                        className="input"
                                        style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                                        value={mesIndexInicial}
                                        onChange={(e) => {
                                          const novoMes = parseInt(e.target.value)
                                          setMesInicial(novoMes)
                                        }}
                                      >
                                        {meses.map((m, idx) => (
                                          <option key={idx} value={idx}>{m}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span style={{ color: '#666' }}>{mes}</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9' }}>
                                    <input
                                      type="text"
                                      className="input"
                                      style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                                      placeholder="0%"
                                      value={(() => {
                                        try {
                                          if (comissionamento?.agenciamentoConsultoria) {
                                            const parsed = JSON.parse(comissionamento.agenciamentoConsultoria)
                                            return parsed[parcela - 1] || ''
                                          }
                                          return ''
                                        } catch {
                                          return ''
                                        }
                                      })()}
                                      onChange={(e) => {
                                        try {
                                          const percentuais = comissionamento?.agenciamentoConsultoria ? JSON.parse(comissionamento.agenciamentoConsultoria) : Array(12).fill('')
                                          percentuais[parcela - 1] = e.target.value
                                          if (!comissionamento) {
                                            setComissionamento({ agenciamentoConsultoria: JSON.stringify(percentuais) })
                                          } else {
                                            setComissionamento({ ...comissionamento, agenciamentoConsultoria: JSON.stringify(percentuais) })
                                          }
                                        } catch (err) {
                                          // Se houver erro no parsing, cria novo array
                                          const percentuais = Array(12).fill('')
                                          percentuais[parcela - 1] = e.target.value
                                          if (!comissionamento) {
                                            setComissionamento({ agenciamentoConsultoria: JSON.stringify(percentuais) })
                                          } else {
                                            setComissionamento({ ...comissionamento, agenciamentoConsultoria: JSON.stringify(percentuais) })
                                          }
                                        }
                                      }}
                                    />
                                  </td>
                                </tr>
                              )
                            })}
                            <tr style={{ background: '#f5f5f5', fontWeight: 600 }}>
                              <td colSpan={2} style={{ padding: '6px 8px', fontSize: '12px' }}>TOTAL</td>
                              <td style={{ padding: '6px 8px', fontSize: '12px' }}>
                                {comissionamento?.agenciamentoConsultoria ? 
                                  JSON.parse(comissionamento.agenciamentoConsultoria).reduce((acc: number, val: string) => acc + (parseFloat(val) || 0), 0).toFixed(2) + '%' : 
                                  '0%'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Vitalício Consultoria */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, color: '#00225f', fontSize: '14px', fontWeight: 600 }}>
                            Vitalício <span style={{ color: '#a42340' }}>Consultoria</span>
                          </h4>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Replicar valor do campo preenchido para os campos abaixo"
                            onClick={() => {
                              const percentuais = comissionamento?.vitalicioConsultoria ? JSON.parse(comissionamento.vitalicioConsultoria) : Array(12).fill('')
                              // Encontra o índice do primeiro campo preenchido
                              const primeiroIndicePreenchido = percentuais.findIndex((val: string) => val && val.trim() !== '')
                              
                              if (primeiroIndicePreenchido !== -1) {
                                const valorParaReplicar = percentuais[primeiroIndicePreenchido]
                                // Replica apenas para os campos abaixo do preenchido
                                const novosPercentuais = [...percentuais]
                                for (let i = primeiroIndicePreenchido + 1; i < 12; i++) {
                                  novosPercentuais[i] = valorParaReplicar
                                }
                                if (!comissionamento) {
                                  setComissionamento({ vitalicioConsultoria: JSON.stringify(novosPercentuais) })
                                } else {
                                  setComissionamento({ ...comissionamento, vitalicioConsultoria: JSON.stringify(novosPercentuais) })
                                }
                              }
                            }}
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Replicar
                          </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '4px', overflow: 'hidden', fontSize: '12px' }}>
                          <thead>
                            <tr>
                              <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Parcela</th>
                              <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Mês</th>
                              <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Percentual</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((parcela) => {
                              const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                              const mesIndexInicial = mesInicial !== null ? mesInicial : (apolice?.dataVigenciaContratoInicio ? new Date(apolice.dataVigenciaContratoInicio).getMonth() : new Date().getMonth())
                              const mesIndex = (mesIndexInicial + parcela - 1) % 12
                              const mes = meses[mesIndex]
                              
                              return (
                                <tr key={parcela}>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                                    {parcela}ª
                                  </td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                                    {parcela === 1 ? (
                                      <select
                                        className="input"
                                        style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                                        value={mesIndexInicial}
                                        onChange={(e) => {
                                          const novoMes = parseInt(e.target.value)
                                          setMesInicial(novoMes)
                                        }}
                                      >
                                        {meses.map((m, idx) => (
                                          <option key={idx} value={idx}>{m}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span style={{ color: '#666' }}>{mes}</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9' }}>
                                    <input
                                      type="text"
                                      className="input"
                                      style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                                      placeholder="0%"
                                      value={(() => {
                                        try {
                                          if (comissionamento?.vitalicioConsultoria) {
                                            const parsed = JSON.parse(comissionamento.vitalicioConsultoria)
                                            return parsed[parcela - 1] || ''
                                          }
                                          return ''
                                        } catch {
                                          return ''
                                        }
                                      })()}
                                      onChange={(e) => {
                                        try {
                                          const percentuais = comissionamento?.vitalicioConsultoria ? JSON.parse(comissionamento.vitalicioConsultoria) : Array(12).fill('')
                                          percentuais[parcela - 1] = e.target.value
                                          if (!comissionamento) {
                                            setComissionamento({ vitalicioConsultoria: JSON.stringify(percentuais) })
                                          } else {
                                            setComissionamento({ ...comissionamento, vitalicioConsultoria: JSON.stringify(percentuais) })
                                          }
                                        } catch (err) {
                                          // Se houver erro no parsing, cria novo array
                                          const percentuais = Array(12).fill('')
                                          percentuais[parcela - 1] = e.target.value
                                          if (!comissionamento) {
                                            setComissionamento({ vitalicioConsultoria: JSON.stringify(percentuais) })
                                          } else {
                                            setComissionamento({ ...comissionamento, vitalicioConsultoria: JSON.stringify(percentuais) })
                                          }
                                        }
                                      }}
                                    />
                                  </td>
                                </tr>
                              )
                            })}
                            <tr style={{ background: '#f5f5f5', fontWeight: 600 }}>
                              <td colSpan={2} style={{ padding: '6px 8px', fontSize: '12px' }}>TOTAL</td>
                              <td style={{ padding: '6px 8px', fontSize: '12px' }}>
                                {comissionamento?.vitalicioConsultoria ? 
                                  JSON.parse(comissionamento.vitalicioConsultoria).reduce((acc: number, val: string) => acc + (parseFloat(val) || 0), 0).toFixed(2) + '%' : 
                                  '0%'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Agenciamento Corretor Parceiro - Só aparece se temCorretorParceiro for true */}
                      {comissionamento?.temCorretorParceiro && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, color: '#00225f', fontSize: '14px', fontWeight: 600 }}>
                              Agenciamento <span style={{ color: '#a42340' }}>Corretor Parceiro</span>
                            </h4>
                            <button
                              type="button"
                              className="btn-icon"
                              title="Replicar valor do campo preenchido para os campos abaixo"
                              onClick={() => {
                                const percentuais = comissionamento?.agenciamentoCorretor ? JSON.parse(comissionamento.agenciamentoCorretor) : Array(12).fill('')
                                // Encontra o índice do primeiro campo preenchido
                                const primeiroIndicePreenchido = percentuais.findIndex((val: string) => val && val.trim() !== '')
                                
                                if (primeiroIndicePreenchido !== -1) {
                                  const valorParaReplicar = percentuais[primeiroIndicePreenchido]
                                  // Replica apenas para os campos abaixo do preenchido
                                  const novosPercentuais = [...percentuais]
                                  for (let i = primeiroIndicePreenchido + 1; i < 12; i++) {
                                    novosPercentuais[i] = valorParaReplicar
                                  }
                                  if (!comissionamento) {
                                    setComissionamento({ agenciamentoCorretor: JSON.stringify(novosPercentuais) })
                                  } else {
                                    setComissionamento({ ...comissionamento, agenciamentoCorretor: JSON.stringify(novosPercentuais) })
                                  }
                                }
                              }}
                              style={{ padding: '4px 8px', fontSize: '11px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Replicar
                            </button>
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '4px', overflow: 'hidden', fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Parcela</th>
                                <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Mês</th>
                                <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Percentual</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((parcela) => {
                                const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                                const mesIndexInicial = mesInicial !== null ? mesInicial : (apolice?.dataVigenciaContratoInicio ? new Date(apolice.dataVigenciaContratoInicio).getMonth() : new Date().getMonth())
                                const mesIndex = (mesIndexInicial + parcela - 1) % 12
                                const mes = meses[mesIndex]
                                
                                return (
                                  <tr key={parcela}>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                                      {parcela}ª
                                    </td>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9', fontSize: '12px', color: '#666' }}>
                                      {mes}
                                    </td>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9' }}>
                                      <input
                                        type="text"
                                        className="input"
                                        style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                                        placeholder="0%"
                                        value={(() => {
                                          try {
                                            if (comissionamento?.agenciamentoCorretor) {
                                              const parsed = JSON.parse(comissionamento.agenciamentoCorretor)
                                              return parsed[parcela - 1] || ''
                                            }
                                            return ''
                                          } catch {
                                            return ''
                                          }
                                        })()}
                                        onChange={(e) => {
                                          try {
                                            const percentuais = comissionamento?.agenciamentoCorretor ? JSON.parse(comissionamento.agenciamentoCorretor) : Array(12).fill('')
                                            percentuais[parcela - 1] = e.target.value
                                            if (!comissionamento) {
                                              setComissionamento({ agenciamentoCorretor: JSON.stringify(percentuais) })
                                            } else {
                                              setComissionamento({ ...comissionamento, agenciamentoCorretor: JSON.stringify(percentuais) })
                                            }
                                          } catch (err) {
                                            // Se houver erro no parsing, cria novo array
                                            const percentuais = Array(12).fill('')
                                            percentuais[parcela - 1] = e.target.value
                                            if (!comissionamento) {
                                              setComissionamento({ agenciamentoCorretor: JSON.stringify(percentuais) })
                                            } else {
                                              setComissionamento({ ...comissionamento, agenciamentoCorretor: JSON.stringify(percentuais) })
                                            }
                                          }
                                        }}
                                      />
                                    </td>
                                  </tr>
                                )
                              })}
                              <tr style={{ background: '#f5f5f5', fontWeight: 600 }}>
                                <td colSpan={2} style={{ padding: '6px 8px', fontSize: '12px' }}>TOTAL</td>
                                <td style={{ padding: '6px 8px', fontSize: '12px' }}>
                                  {comissionamento?.agenciamentoCorretor ? 
                                    JSON.parse(comissionamento.agenciamentoCorretor).reduce((acc: number, val: string) => acc + (parseFloat(val) || 0), 0).toFixed(2) + '%' : 
                                    '0%'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Vitalício Corretor Parceiro - Só aparece se temCorretorParceiro for true */}
                      {comissionamento?.temCorretorParceiro && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, color: '#00225f', fontSize: '14px', fontWeight: 600 }}>
                              Vitalício <span style={{ color: '#a42340' }}>Corretor Parceiro</span>
                            </h4>
                            <button
                              type="button"
                              className="btn-icon"
                              title="Replicar valor do campo preenchido para os campos abaixo"
                              onClick={() => {
                                const percentuais = comissionamento?.vitalicioCorretor ? JSON.parse(comissionamento.vitalicioCorretor) : Array(12).fill('')
                                // Encontra o índice do primeiro campo preenchido
                                const primeiroIndicePreenchido = percentuais.findIndex((val: string) => val && val.trim() !== '')
                                
                                if (primeiroIndicePreenchido !== -1) {
                                  const valorParaReplicar = percentuais[primeiroIndicePreenchido]
                                  // Replica apenas para os campos abaixo do preenchido
                                  const novosPercentuais = [...percentuais]
                                  for (let i = primeiroIndicePreenchido + 1; i < 12; i++) {
                                    novosPercentuais[i] = valorParaReplicar
                                  }
                                  if (!comissionamento) {
                                    setComissionamento({ vitalicioCorretor: JSON.stringify(novosPercentuais) })
                                  } else {
                                    setComissionamento({ ...comissionamento, vitalicioCorretor: JSON.stringify(novosPercentuais) })
                                  }
                                }
                              }}
                              style={{ padding: '4px 8px', fontSize: '11px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Replicar
                            </button>
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '4px', overflow: 'hidden', fontSize: '12px' }}>
                            <thead>
                              <tr>
                                <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Parcela</th>
                                <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Mês</th>
                                <th style={{ background: '#00225f', color: 'white', padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Percentual</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((parcela) => {
                                const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                                const mesIndexInicial = mesInicial !== null ? mesInicial : (apolice?.dataVigenciaContratoInicio ? new Date(apolice.dataVigenciaContratoInicio).getMonth() : new Date().getMonth())
                                const mesIndex = (mesIndexInicial + parcela - 1) % 12
                                const mes = meses[mesIndex]
                                
                                return (
                                  <tr key={parcela}>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9', fontSize: '12px' }}>
                                      {parcela}ª
                                    </td>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9', fontSize: '12px', color: '#666' }}>
                                      {mes}
                                    </td>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #e9e9e9' }}>
                                      <input
                                        type="text"
                                        className="input"
                                        style={{ width: '100%', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                                        placeholder="0%"
                                        value={(() => {
                                          try {
                                            if (comissionamento?.vitalicioCorretor) {
                                              const parsed = JSON.parse(comissionamento.vitalicioCorretor)
                                              return parsed[parcela - 1] || ''
                                            }
                                            return ''
                                          } catch {
                                            return ''
                                          }
                                        })()}
                                        onChange={(e) => {
                                          try {
                                            const percentuais = comissionamento?.vitalicioCorretor ? JSON.parse(comissionamento.vitalicioCorretor) : Array(12).fill('')
                                            percentuais[parcela - 1] = e.target.value
                                            if (!comissionamento) {
                                              setComissionamento({ vitalicioCorretor: JSON.stringify(percentuais) })
                                            } else {
                                              setComissionamento({ ...comissionamento, vitalicioCorretor: JSON.stringify(percentuais) })
                                            }
                                          } catch (err) {
                                            // Se houver erro no parsing, cria novo array
                                            const percentuais = Array(12).fill('')
                                            percentuais[parcela - 1] = e.target.value
                                            if (!comissionamento) {
                                              setComissionamento({ vitalicioCorretor: JSON.stringify(percentuais) })
                                            } else {
                                              setComissionamento({ ...comissionamento, vitalicioCorretor: JSON.stringify(percentuais) })
                                            }
                                          }
                                        }}
                                      />
                                    </td>
                                  </tr>
                                )
                              })}
                              <tr style={{ background: '#f5f5f5', fontWeight: 600 }}>
                                <td colSpan={2} style={{ padding: '6px 8px', fontSize: '12px' }}>TOTAL</td>
                                <td style={{ padding: '6px 8px', fontSize: '12px' }}>
                                  {comissionamento?.vitalicioCorretor ? 
                                    JSON.parse(comissionamento.vitalicioCorretor).reduce((acc: number, val: string) => acc + (parseFloat(val) || 0), 0).toFixed(2) + '%' : 
                                    '0%'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                        onClick={async () => {
                          try {
                            const data = {
                              apoliceId: id,
                              temCorretorParceiro: comissionamento?.temCorretorParceiro || false,
                              valorAgenciamentoContrato: comissionamento?.valorAgenciamentoContrato || null,
                              valorVitalicioContrato: comissionamento?.valorVitalicioContrato || null,
                              agenciamentoConsultoria: comissionamento?.agenciamentoConsultoria || JSON.stringify(Array(12).fill('')),
                              vitalicioConsultoria: comissionamento?.vitalicioConsultoria || JSON.stringify(Array(12).fill('')),
                              agenciamentoCorretor: comissionamento?.temCorretorParceiro ? (comissionamento?.agenciamentoCorretor || JSON.stringify(Array(12).fill(''))) : null,
                              vitalicioCorretor: comissionamento?.temCorretorParceiro ? (comissionamento?.vitalicioCorretor || JSON.stringify(Array(12).fill(''))) : null
                            }
                            if (comissionamento?.id) {
                              await api.put(`/comissionamentos-apolice/${comissionamento.id}`, data)
                            } else {
                              await api.post('/comissionamentos-apolice', data)
                            }
                            await fetchComissionamento()
                            setEditandoComissionamento(false)
                            alert('Comissionamento salvo com sucesso!')
                          } catch (err: any) {
                            alert(err.response?.data?.error || 'Erro ao salvar comissionamento')
                          }
                        }}
                      >
                        Salvar Comissionamento
                      </button>
                    </div>
                    </div>
                  </div>
                )}

                {/* Visualização simplificada após salvar */}
                {(tipoFinanceiro === 'comissionamento' || tipoFinanceiro === 'comissionamento_fee') && comissionamento?.id && !editandoComissionamento && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      background: '#00225f', 
                      color: 'white', 
                      padding: '10px 14px', 
                      borderRadius: '6px 6px 0 0',
                      fontWeight: 600,
                      fontSize: '14px',
                      marginBottom: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Comissionamento</span>
                      <button
                        onClick={() => setEditandoComissionamento(true)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                    </div>
                    <div style={{ 
                      padding: '20px',
                      background: 'white',
                      borderRadius: '0 0 6px 6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {/* Valores do Contrato */}
                      {(comissionamento?.valorAgenciamentoContrato || comissionamento?.valorVitalicioContrato) && (
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '16px',
                          marginBottom: '24px',
                          padding: '16px',
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                          borderRadius: '8px'
                        }}>
                          {comissionamento?.valorAgenciamentoContrato && (
                            <div>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 500 }}>Valor Agenciamento</div>
                              <div style={{ fontSize: '18px', fontWeight: 600, color: '#00225f' }}>
                                {comissionamento.valorAgenciamentoContrato}%
                              </div>
                            </div>
                          )}
                          {comissionamento?.valorVitalicioContrato && (
                            <div>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', fontWeight: 500 }}>Valor Vitalício</div>
                              <div style={{ fontSize: '18px', fontWeight: 600, color: '#00225f' }}>
                                {comissionamento.valorVitalicioContrato}%
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tabelas simplificadas */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: comissionamento?.temCorretorParceiro ? '1fr 1fr' : '1fr', 
                        gap: '20px'
                      }}>
                        {/* Agenciamento Consultoria */}
                        {comissionamento?.agenciamentoConsultoria && (() => {
                          try {
                            const percentuais = JSON.parse(comissionamento.agenciamentoConsultoria)
                            const temValores = percentuais.some((val: string) => val && val.trim() !== '')
                            if (!temValores) return null

                            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                            const mesIndexInicial = mesInicial !== null ? mesInicial : (apolice?.dataVigenciaContratoInicio ? new Date(apolice.dataVigenciaContratoInicio).getMonth() : new Date().getMonth())
                            const total = percentuais.reduce((acc: number, val: string) => acc + (parseFloat(val) || 0), 0)

                            return (
                              <div style={{ 
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                padding: '16px',
                                border: '1px solid #e9ecef'
                              }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  marginBottom: '16px',
                                  paddingBottom: '12px',
                                  borderBottom: '2px solid #00225f'
                                }}>
                                  <h4 style={{ margin: 0, color: '#00225f', fontSize: '14px', fontWeight: 600 }}>
                                    Agenciamento <span style={{ color: '#a42340' }}>Consultoria</span>
                                  </h4>
                                  <div style={{ 
                                    background: '#00225f',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}>
                                    Total: {total.toFixed(2)}%
                                  </div>
                                </div>
                                <div style={{ 
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(4, 1fr)',
                                  gap: '8px',
                                  fontSize: '11px'
                                }}>
                                  {percentuais.map((valor: string, idx: number) => {
                                    if (!valor || valor.trim() === '') return null
                                    const mesIndex = (mesIndexInicial + idx) % 12
                                    const mes = meses[mesIndex]
                                    return (
                                      <div key={idx} style={{
                                        background: 'white',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid #dee2e6',
                                        textAlign: 'center'
                                      }}>
                                        <div style={{ color: '#666', fontSize: '10px', marginBottom: '2px' }}>{idx + 1}ª - {mes}</div>
                                        <div style={{ color: '#00225f', fontWeight: 600, fontSize: '13px' }}>{valor}%</div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          } catch {
                            return null
                          }
                        })()}

                        {/* Vitalício Consultoria */}
                        {comissionamento?.vitalicioConsultoria && (() => {
                          try {
                            const percentuais = JSON.parse(comissionamento.vitalicioConsultoria)
                            const temValores = percentuais.some((val: string) => val && val.trim() !== '')
                            if (!temValores) return null

                            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                            const mesIndexInicial = mesInicial !== null ? mesInicial : (apolice?.dataVigenciaContratoInicio ? new Date(apolice.dataVigenciaContratoInicio).getMonth() : new Date().getMonth())
                            const total = percentuais.reduce((acc: number, val: string) => acc + (parseFloat(val) || 0), 0)

                            return (
                              <div style={{ 
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                padding: '16px',
                                border: '1px solid #e9ecef'
                              }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  marginBottom: '16px',
                                  paddingBottom: '12px',
                                  borderBottom: '2px solid #00225f'
                                }}>
                                  <h4 style={{ margin: 0, color: '#00225f', fontSize: '14px', fontWeight: 600 }}>
                                    Vitalício <span style={{ color: '#a42340' }}>Consultoria</span>
                                  </h4>
                                  <div style={{ 
                                    background: '#00225f',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}>
                                    Total: {total.toFixed(2)}%
                                  </div>
                                </div>
                                <div style={{ 
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(4, 1fr)',
                                  gap: '8px',
                                  fontSize: '11px'
                                }}>
                                  {percentuais.map((valor: string, idx: number) => {
                                    if (!valor || valor.trim() === '') return null
                                    const mesIndex = (mesIndexInicial + idx) % 12
                                    const mes = meses[mesIndex]
                                    return (
                                      <div key={idx} style={{
                                        background: 'white',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid #dee2e6',
                                        textAlign: 'center'
                                      }}>
                                        <div style={{ color: '#666', fontSize: '10px', marginBottom: '2px' }}>{idx + 1}ª - {mes}</div>
                                        <div style={{ color: '#00225f', fontWeight: 600, fontSize: '13px' }}>{valor}%</div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          } catch {
                            return null
                          }
                        })()}

                        {/* Agenciamento Corretor Parceiro */}
                        {comissionamento?.temCorretorParceiro && comissionamento?.agenciamentoCorretor && (() => {
                          try {
                            const percentuais = JSON.parse(comissionamento.agenciamentoCorretor)
                            const temValores = percentuais.some((val: string) => val && val.trim() !== '')
                            if (!temValores) return null

                            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                            const mesIndexInicial = mesInicial !== null ? mesInicial : (apolice?.dataVigenciaContratoInicio ? new Date(apolice.dataVigenciaContratoInicio).getMonth() : new Date().getMonth())
                            const total = percentuais.reduce((acc: number, val: string) => acc + (parseFloat(val) || 0), 0)

                            return (
                              <div style={{ 
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                padding: '16px',
                                border: '1px solid #e9ecef'
                              }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  marginBottom: '16px',
                                  paddingBottom: '12px',
                                  borderBottom: '2px solid #00225f'
                                }}>
                                  <h4 style={{ margin: 0, color: '#00225f', fontSize: '14px', fontWeight: 600 }}>
                                    Agenciamento <span style={{ color: '#a42340' }}>Corretor Parceiro</span>
                                  </h4>
                                  <div style={{ 
                                    background: '#00225f',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}>
                                    Total: {total.toFixed(2)}%
                                  </div>
                                </div>
                                <div style={{ 
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(4, 1fr)',
                                  gap: '8px',
                                  fontSize: '11px'
                                }}>
                                  {percentuais.map((valor: string, idx: number) => {
                                    if (!valor || valor.trim() === '') return null
                                    const mesIndex = (mesIndexInicial + idx) % 12
                                    const mes = meses[mesIndex]
                                    return (
                                      <div key={idx} style={{
                                        background: 'white',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid #dee2e6',
                                        textAlign: 'center'
                                      }}>
                                        <div style={{ color: '#666', fontSize: '10px', marginBottom: '2px' }}>{idx + 1}ª - {mes}</div>
                                        <div style={{ color: '#00225f', fontWeight: 600, fontSize: '13px' }}>{valor}%</div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          } catch {
                            return null
                          }
                        })()}

                        {/* Vitalício Corretor Parceiro */}
                        {comissionamento?.temCorretorParceiro && comissionamento?.vitalicioCorretor && (() => {
                          try {
                            const percentuais = JSON.parse(comissionamento.vitalicioCorretor)
                            const temValores = percentuais.some((val: string) => val && val.trim() !== '')
                            if (!temValores) return null

                            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                            const mesIndexInicial = mesInicial !== null ? mesInicial : (apolice?.dataVigenciaContratoInicio ? new Date(apolice.dataVigenciaContratoInicio).getMonth() : new Date().getMonth())
                            const total = percentuais.reduce((acc: number, val: string) => acc + (parseFloat(val) || 0), 0)

                            return (
                              <div style={{ 
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                padding: '16px',
                                border: '1px solid #e9ecef'
                              }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  marginBottom: '16px',
                                  paddingBottom: '12px',
                                  borderBottom: '2px solid #00225f'
                                }}>
                                  <h4 style={{ margin: 0, color: '#00225f', fontSize: '14px', fontWeight: 600 }}>
                                    Vitalício <span style={{ color: '#a42340' }}>Corretor Parceiro</span>
                                  </h4>
                                  <div style={{ 
                                    background: '#00225f',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}>
                                    Total: {total.toFixed(2)}%
                                  </div>
                                </div>
                                <div style={{ 
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(4, 1fr)',
                                  gap: '8px',
                                  fontSize: '11px'
                                }}>
                                  {percentuais.map((valor: string, idx: number) => {
                                    if (!valor || valor.trim() === '') return null
                                    const mesIndex = (mesIndexInicial + idx) % 12
                                    const mes = meses[mesIndex]
                                    return (
                                      <div key={idx} style={{
                                        background: 'white',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        border: '1px solid #dee2e6',
                                        textAlign: 'center'
                                      }}>
                                        <div style={{ color: '#666', fontSize: '10px', marginBottom: '2px' }}>{idx + 1}ª - {mes}</div>
                                        <div style={{ color: '#00225f', fontWeight: 600, fontSize: '13px' }}>{valor}%</div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          } catch {
                            return null
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {(tipoFinanceiro === 'fee' || tipoFinanceiro === 'comissionamento_fee') && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      background: '#00225f', 
                      color: 'white', 
                      padding: '10px 14px', 
                      borderRadius: '6px 6px 0 0',
                      fontWeight: 600,
                      fontSize: '14px',
                      marginBottom: 0
                    }}>
                      Fee Mensal
                    </div>
                    <div style={{ 
                      padding: '16px',
                      background: '#f9f9f9',
                      borderRadius: '0 0 6px 6px'
                    }}>
                      <div className="form-grid" style={{ gap: '16px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '13px' }}>Valor do Fee Mensal</label>
                          <input
                            type="number"
                            className="input"
                            placeholder="0.00"
                            step="0.01"
                            style={{ fontSize: '13px', padding: '8px' }}
                            defaultValue={fee?.valorFeeMensal || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null
                              if (!fee) {
                                setFee({ valorFeeMensal: value })
                              } else {
                                setFee({ ...fee, valorFeeMensal: value })
                              }
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '13px' }}>Fee Consultoria</label>
                          <input
                            type="number"
                            className="input"
                            placeholder="0.00"
                            step="0.01"
                            style={{ fontSize: '13px', padding: '8px' }}
                            defaultValue={fee?.feeConsultoria || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null
                              if (!fee) {
                                setFee({ feeConsultoria: value })
                              } else {
                                setFee({ ...fee, feeConsultoria: value })
                              }
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '13px' }}>Fee Corretor Parceiro</label>
                          <input
                            type="number"
                            className="input"
                            placeholder="0.00"
                            step="0.01"
                            style={{ fontSize: '13px', padding: '8px' }}
                            defaultValue={fee?.feeCorretorParceiro || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null
                              if (!fee) {
                                setFee({ feeCorretorParceiro: value })
                              } else {
                                setFee({ ...fee, feeCorretorParceiro: value })
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                          onClick={async () => {
                            try {
                              const data = {
                                apoliceId: id,
                                valorFeeMensal: fee?.valorFeeMensal || null,
                                feeConsultoria: fee?.feeConsultoria || null,
                                feeCorretorParceiro: fee?.feeCorretorParceiro || null
                              }
                              if (fee?.id) {
                                await api.put(`/fees-apolice/${fee.id}`, data)
                              } else {
                                await api.post('/fees-apolice', data)
                              }
                              fetchFee()
                              alert('Fee salvo com sucesso!')
                            } catch (err: any) {
                              alert(err.response?.data?.error || 'Erro ao salvar fee')
                            }
                          }}
                        >
                          Salvar Fee
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'documentacao' && (
          <DocumentacaoTab apoliceId={id || ''} />
        )}

        {activeTab === 'servicos' && (
          <ServicosTab apoliceId={id || ''} />
        )}
      </div>

      <Modal
        isOpen={showSubEstipulanteModal}
        onClose={() => {
          setShowSubEstipulanteModal(false)
          setEditingSubEstipulanteId(null)
        }}
        title={editingSubEstipulanteId ? 'Editar Sub Estipulante' : 'Novo Sub Estipulante'}
        size="large"
      >
        <SubEstipulanteForm
          subEstipulanteId={editingSubEstipulanteId || undefined}
          apoliceId={id || ''}
          onSuccess={() => {
            setShowSubEstipulanteModal(false)
            setEditingSubEstipulanteId(null)
            fetchSubEstipulantes()
          }}
          onCancel={() => {
            setShowSubEstipulanteModal(false)
            setEditingSubEstipulanteId(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={showReajusteModal}
        onClose={() => {
          setShowReajusteModal(false)
          setEditingReajusteId(null)
        }}
        title={editingReajusteId ? 'Editar Reajuste' : 'Novo Reajuste'}
        size="large"
      >
        <ReajusteForm
          reajusteId={editingReajusteId || undefined}
          apoliceId={id || ''}
          onSuccess={() => {
            setShowReajusteModal(false)
            setEditingReajusteId(null)
            fetchReajustes()
          }}
          onCancel={() => {
            setShowReajusteModal(false)
            setEditingReajusteId(null)
          }}
        />
      </Modal>

      {/* Modal para visualizar Sub Estipulante individual */}
      <Modal
        isOpen={viewingSubEstipulanteId !== null}
        onClose={() => {
          setViewingSubEstipulanteId(null)
          setEnderecosSubEstipulante([])
          setContatosSubEstipulante([])
        }}
        title="Detalhes do Sub Estipulante"
        size="large"
      >
        {viewingSubEstipulanteId && (() => {
          const subEstipulante = subEstipulantes.find(s => s.id === viewingSubEstipulanteId)
          if (!subEstipulante) return <div>Sub Estipulante não encontrado</div>
          
          const fetchEnderecosEContatos = async () => {
            try {
              const [enderecosRes, contatosRes] = await Promise.all([
                api.get(`/enderecos-sub-estipulante?subEstipulanteId=${viewingSubEstipulanteId}&limit=1000`),
                api.get(`/contatos-sub-estipulante?subEstipulanteId=${viewingSubEstipulanteId}&limit=1000`)
              ])
              setEnderecosSubEstipulante(enderecosRes.data.data || [])
              setContatosSubEstipulante(contatosRes.data.data || [])
            } catch (err: any) {
              console.error('Erro ao carregar endereços/contatos:', err)
            }
          }

          const handleDeleteEndereco = async (enderecoId: string) => {
            if (!window.confirm('Tem certeza que deseja excluir este endereço?')) return
            try {
              await api.delete(`/enderecos-sub-estipulante/${enderecoId}`)
              fetchEnderecosEContatos()
            } catch (err: any) {
              alert(err.response?.data?.error || 'Erro ao excluir endereço')
            }
          }

          const handleDeleteContato = async (contatoId: string) => {
            if (!window.confirm('Tem certeza que deseja excluir este contato?')) return
            try {
              await api.delete(`/contatos-sub-estipulante/${contatoId}`)
              fetchEnderecosEContatos()
            } catch (err: any) {
              alert(err.response?.data?.error || 'Erro ao excluir contato')
            }
          }
          
          return (
            <div className="form-section">
              <div className="form-section-title">Dados Principais</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Código Estipulante</label>
                  <div className="field-value">{subEstipulante.codigoEstipulante}</div>
                </div>
                <div className="form-group">
                  <label className="label">CNPJ</label>
                  <div className="field-value">{subEstipulante.cnpj ? formatCNPJ(subEstipulante.cnpj) : '-'}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Razão Social</label>
                  <div className="field-value">{subEstipulante.razaoSocial}</div>
                </div>
                <div className="form-group">
                  <label className="label">Tipo</label>
                  <div className="field-value">
                    {subEstipulante.tipo === 'PRESTADOR_SERVICO' ? 'Prestador de Serviço' : 
                     subEstipulante.tipo === 'OUTRO' ? 'Outro' : '-'}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Status</label>
                  <div className="field-value">
                    <span className={`status-badge status-${subEstipulante.status.toLowerCase()}`}>
                      {subEstipulante.status}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Data de Vigência do Contrato</label>
                  <div className="field-value">{formatDate(subEstipulante.dataVigenciaContrato)}</div>
                </div>
                <div className="form-group">
                  <label className="label">Data de Cancelamento</label>
                  <div className="field-value" style={{
                    color: subEstipulante.dataCancelamento ? '#333' : '#999',
                    fontStyle: subEstipulante.dataCancelamento ? 'normal' : 'italic',
                    background: subEstipulante.dataCancelamento ? '#e9e9e9' : '#f5f5f5'
                  }}>
                    {formatDate(subEstipulante.dataCancelamento)}
                  </div>
                </div>
              </div>

              <div className="form-section-title">Informações Adicionais</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Código CNAE</label>
                  <div className="field-value">{subEstipulante.codigoCNAE || '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">Ramo de Atividade</label>
                  <div className="field-value">{subEstipulante.ramoAtividade || '-'}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Inscrição Estadual</label>
                  <div className="field-value">{subEstipulante.inscricaoEstadual || '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">Inscrição Municipal</label>
                  <div className="field-value">{subEstipulante.inscricaoMunicipal || '-'}</div>
                </div>
              </div>

              {/* Seção de Endereços */}
              <div className="form-section-title" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Endereços</span>
                <button
                  className="btn-icon"
                  title="Adicionar Endereço"
                  onClick={() => {
                    setEditingEnderecoSubEstipulanteId(null)
                    setShowEnderecoSubEstipulanteModal(true)
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {enderecosSubEstipulante.length === 0 ? (
                <div className="empty-subsection">Nenhum endereço cadastrado</div>
              ) : (
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Logradouro</th>
                      <th>Cidade/UF</th>
                      <th>CEP</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enderecosSubEstipulante.map((endereco) => (
                      <tr key={endereco.id}>
                        <td><span className="status-badge">{endereco.tipo}</span></td>
                        <td>
                          {endereco.tipoLogradouro && `${endereco.tipoLogradouro} `}
                          {endereco.logradouro}
                          {endereco.numero && !endereco.semNumero && `, ${endereco.numero}`}
                          {endereco.complemento && ` - ${endereco.complemento}`}
                          {endereco.bairro && `, ${endereco.bairro}`}
                        </td>
                        <td>{endereco.cidade}/{endereco.uf}</td>
                        <td>{endereco.cep || '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-icon"
                              title="Editar"
                              onClick={() => {
                                setEditingEnderecoSubEstipulanteId(endereco.id)
                                setShowEnderecoSubEstipulanteModal(true)
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Excluir"
                              onClick={() => handleDeleteEndereco(endereco.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Seção de Contatos (Mailing) */}
              <div className="form-section-title" style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Mailing</span>
                <button
                  className="btn-icon"
                  title="Adicionar Contato"
                  onClick={() => {
                    setEditingContatoSubEstipulanteId(null)
                    setShowContatoSubEstipulanteModal(true)
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {contatosSubEstipulante.length === 0 ? (
                <div className="empty-subsection">Nenhum contato cadastrado</div>
              ) : (
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Cargo</th>
                      <th>Email</th>
                      <th>Telefone</th>
                      <th>Data de Nascimento</th>
                      <th>Ativo</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contatosSubEstipulante.map((contato) => (
                      <tr key={contato.id}>
                        <td>{contato.nome}</td>
                        <td>{contato.cargo || '-'}</td>
                        <td>{contato.email || '-'}</td>
                        <td>{contato.telefone || '-'}</td>
                        <td>{contato.dataNascimento ? new Date(contato.dataNascimento).toLocaleDateString('pt-BR') : '-'}</td>
                        <td>
                          <span className={`status-badge ${contato.ativo ? 'status-ativa' : 'status-cancelada'}`}>
                            {contato.ativo ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-icon"
                              title="Editar"
                              onClick={() => {
                                setEditingContatoSubEstipulanteId(contato.id)
                                setShowContatoSubEstipulanteModal(true)
                              }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Excluir"
                              onClick={() => handleDeleteContato(contato.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })()}
      </Modal>

      {/* Modal para Endereço Sub Estipulante */}
      <Modal
        isOpen={showEnderecoSubEstipulanteModal}
        onClose={() => {
          setShowEnderecoSubEstipulanteModal(false)
          setEditingEnderecoSubEstipulanteId(null)
        }}
        title={editingEnderecoSubEstipulanteId ? 'Editar Endereço' : 'Novo Endereço'}
        size="large"
      >
        <EnderecoSubEstipulanteForm
          enderecoId={editingEnderecoSubEstipulanteId || undefined}
          subEstipulanteId={viewingSubEstipulanteId || ''}
          onSuccess={async () => {
            setShowEnderecoSubEstipulanteModal(false)
            setEditingEnderecoSubEstipulanteId(null)
            // Recarregar endereços
            if (viewingSubEstipulanteId) {
              try {
                const res = await api.get(`/enderecos-sub-estipulante?subEstipulanteId=${viewingSubEstipulanteId}&limit=1000`)
                setEnderecosSubEstipulante(res.data.data || [])
              } catch (err) {
                console.error('Erro ao recarregar endereços:', err)
              }
            }
          }}
          onCancel={() => {
            setShowEnderecoSubEstipulanteModal(false)
            setEditingEnderecoSubEstipulanteId(null)
          }}
        />
      </Modal>

      {/* Modal para Contato Sub Estipulante */}
      <Modal
        isOpen={showContatoSubEstipulanteModal}
        onClose={() => {
          setShowContatoSubEstipulanteModal(false)
          setEditingContatoSubEstipulanteId(null)
        }}
        title={editingContatoSubEstipulanteId ? 'Editar Contato' : 'Novo Contato'}
        size="medium"
      >
        <ContatoSubEstipulanteForm
          contatoId={editingContatoSubEstipulanteId || undefined}
          subEstipulanteId={viewingSubEstipulanteId || ''}
          onSuccess={async () => {
            setShowContatoSubEstipulanteModal(false)
            setEditingContatoSubEstipulanteId(null)
            // Recarregar contatos
            if (viewingSubEstipulanteId) {
              try {
                const res = await api.get(`/contatos-sub-estipulante?subEstipulanteId=${viewingSubEstipulanteId}&limit=1000`)
                setContatosSubEstipulante(res.data.data || [])
              } catch (err) {
                console.error('Erro ao recarregar contatos:', err)
              }
            }
          }}
          onCancel={() => {
            setShowContatoSubEstipulanteModal(false)
            setEditingContatoSubEstipulanteId(null)
          }}
        />
      </Modal>

      {/* Modal para visualizar todos os Sub Estipulantes unificados */}
      <Modal
        isOpen={showViewAllSubEstipulantes}
        onClose={() => setShowViewAllSubEstipulantes(false)}
        title="Todos os Sub Estipulantes"
        size="xlarge"
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {subEstipulantes.length === 0 ? (
            <div className="empty-subsection">
              Nenhum sub estipulante cadastrado
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {subEstipulantes.map((subEstipulante, index) => (
                <div key={subEstipulante.id} style={{
                  background: '#f9f9f9',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e9e9e9'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #3d9b8e'
                  }}>
                    <h4 style={{ margin: 0, color: '#00225f', fontSize: '16px', fontWeight: 600 }}>
                      Sub Estipulante {index + 1}
                    </h4>
                    <span className={`status-badge status-${subEstipulante.status.toLowerCase()}`}>
                      {subEstipulante.status}
                    </span>
                  </div>
                  
                  <div className="form-section">
                    <div className="form-section-title">Dados Principais</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="label">Código Estipulante</label>
                        <div className="field-value" style={{
                          background: '#e9e9e9'
                        }}>
                          {subEstipulante.codigoEstipulante}
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="label">CNPJ</label>
                        <div className="field-value" style={{
                          color: subEstipulante.cnpj ? '#333' : '#999',
                          fontStyle: subEstipulante.cnpj ? 'normal' : 'italic',
                          background: subEstipulante.cnpj ? '#e9e9e9' : '#f5f5f5'
                        }}>
                          {subEstipulante.cnpj ? formatCNPJ(subEstipulante.cnpj) : '-'}
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="label">Razão Social</label>
                        <div className="field-value" style={{
                          background: '#e9e9e9'
                        }}>
                          {subEstipulante.razaoSocial}
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="label">Tipo</label>
                        <div className="field-value" style={{
                          color: subEstipulante.tipo ? '#333' : '#999',
                          fontStyle: subEstipulante.tipo ? 'normal' : 'italic',
                          background: subEstipulante.tipo ? '#e9e9e9' : '#f5f5f5'
                        }}>
                          {subEstipulante.tipo === 'PRESTADOR_SERVICO' ? 'Prestador de Serviço' : 
                           subEstipulante.tipo === 'OUTRO' ? 'Outro' : '-'}
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="label">Data de Vigência do Contrato</label>
                        {(() => {
                          const hasValue = subEstipulante.dataVigenciaContrato && formatDate(subEstipulante.dataVigenciaContrato) !== '-'
                          return (
                            <div className="field-value" style={{
                              color: hasValue ? '#333' : '#999',
                              fontStyle: hasValue ? 'normal' : 'italic',
                              background: hasValue ? '#e9e9e9' : '#f5f5f5'
                            }}>
                              {formatDate(subEstipulante.dataVigenciaContrato)}
                            </div>
                          )
                        })()}
                      </div>
                      <div className="form-group">
                        <label className="label">Data de Cancelamento</label>
                        {(() => {
                          const hasValue = subEstipulante.dataCancelamento && formatDate(subEstipulante.dataCancelamento) !== '-'
                          return (
                            <div className="field-value" style={{
                              color: hasValue ? '#333' : '#999',
                              fontStyle: hasValue ? 'normal' : 'italic',
                              background: hasValue ? '#e9e9e9' : '#f5f5f5'
                            }}>
                              {formatDate(subEstipulante.dataCancelamento)}
                            </div>
                          )
                        })()}
                      </div>
                    </div>

                    <div className="form-section-title">Informações Adicionais</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="label">Código CNAE</label>
                        <div className="field-value" style={{
                          color: subEstipulante.codigoCNAE ? '#333' : '#999',
                          fontStyle: subEstipulante.codigoCNAE ? 'normal' : 'italic',
                          background: subEstipulante.codigoCNAE ? '#e9e9e9' : '#f5f5f5'
                        }}>
                          {subEstipulante.codigoCNAE || '-'}
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="label">Ramo de Atividade</label>
                        <div className="field-value" style={{
                          color: subEstipulante.ramoAtividade ? '#333' : '#999',
                          fontStyle: subEstipulante.ramoAtividade ? 'normal' : 'italic',
                          background: subEstipulante.ramoAtividade ? '#e9e9e9' : '#f5f5f5'
                        }}>
                          {subEstipulante.ramoAtividade || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="label">Inscrição Estadual</label>
                        <div className="field-value" style={{
                          color: subEstipulante.inscricaoEstadual ? '#333' : '#999',
                          fontStyle: subEstipulante.inscricaoEstadual ? 'normal' : 'italic',
                          background: subEstipulante.inscricaoEstadual ? '#e9e9e9' : '#f5f5f5'
                        }}>
                          {subEstipulante.inscricaoEstadual || '-'}
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="label">Inscrição Municipal</label>
                        <div className="field-value" style={{
                          color: subEstipulante.inscricaoMunicipal ? '#333' : '#999',
                          fontStyle: subEstipulante.inscricaoMunicipal ? 'normal' : 'italic',
                          background: subEstipulante.inscricaoMunicipal ? '#e9e9e9' : '#f5f5f5'
                        }}>
                          {subEstipulante.inscricaoMunicipal || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showPlanoModal && tipoCadastro === 'plano'}
        onClose={() => {
          setShowPlanoModal(false)
          setEditingPlanoId(null)
          setTipoCadastro(null)
        }}
        title={editingPlanoId ? 'Editar Plano' : 'Novo Plano'}
        size="large"
      >
        <PlanoForm
          planoId={editingPlanoId || undefined}
          apoliceId={id || ''}
          onSuccess={() => {
            setShowPlanoModal(false)
            setEditingPlanoId(null)
            setTipoCadastro(null)
            fetchPlanos()
          }}
          onCancel={() => {
            setShowPlanoModal(false)
            setEditingPlanoId(null)
            setTipoCadastro(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={showCoberturaModal}
        onClose={() => {
          setShowCoberturaModal(false)
          setEditingCoberturaId(null)
          setTipoCadastro(null)
        }}
        title={editingCoberturaId ? 'Editar Cobertura' : 'Nova Cobertura'}
        size="large"
      >
        <CoberturaForm
          coberturaId={editingCoberturaId || undefined}
          apoliceId={id || ''}
          onSuccess={() => {
            setShowCoberturaModal(false)
            setEditingCoberturaId(null)
            setTipoCadastro(null)
            fetchCobertura()
          }}
          onCancel={() => {
            setShowCoberturaModal(false)
            setEditingCoberturaId(null)
            setTipoCadastro(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={showRelacionamentoModal}
        onClose={() => {
          setShowRelacionamentoModal(false)
        }}
        title={relacionamento ? 'Editar Relacionamento' : 'Novo Relacionamento'}
        size="large"
      >
        <RelacionamentoForm
          relacionamentoId={relacionamento?.id || undefined}
          apoliceId={id || ''}
          onSuccess={() => {
            setShowRelacionamentoModal(false)
            fetchRelacionamento()
          }}
          onCancel={() => {
            setShowRelacionamentoModal(false)
          }}
        />
      </Modal>

      <Modal
        isOpen={showReembolsoModal}
        onClose={() => {
          setShowReembolsoModal(false)
          setEditingReembolsoId(null)
          setSelectedPlanoIdForReembolso(null)
        }}
        title={editingReembolsoId ? 'Editar Reembolso' : 'Novo Reembolso'}
      >
        {selectedPlanoIdForReembolso && (
          <ReembolsoPlanoForm
            reembolsoId={editingReembolsoId || undefined}
            planoId={selectedPlanoIdForReembolso}
            onSuccess={() => {
              fetchPlanos()
              setShowReembolsoModal(false)
              setEditingReembolsoId(null)
              setSelectedPlanoIdForReembolso(null)
            }}
            onCancel={() => {
              setShowReembolsoModal(false)
              setEditingReembolsoId(null)
              setSelectedPlanoIdForReembolso(null)
            }}
          />
        )}
      </Modal>

      {/* Modal de Endereço */}
      <Modal
        isOpen={showEnderecoModal}
        onClose={() => {
          setShowEnderecoModal(false)
          setEditingEnderecoId(null)
        }}
        title={editingEnderecoId ? 'Editar Endereço' : 'Novo Endereço'}
        size="medium"
      >
        <EnderecoApoliceForm
          enderecoId={editingEnderecoId || undefined}
          apoliceId={id || ''}
          onSuccess={() => {
            fetchEnderecosApolice()
            setShowEnderecoModal(false)
            setEditingEnderecoId(null)
          }}
          onCancel={() => {
            setShowEnderecoModal(false)
            setEditingEnderecoId(null)
          }}
        />
      </Modal>

      {/* Modal de Contato (Mailing) */}
      <Modal
        isOpen={showContatoModal}
        onClose={() => {
          setShowContatoModal(false)
          setEditingContatoId(null)
        }}
        title={editingContatoId ? 'Editar Contato' : 'Novo Contato'}
        size="medium"
      >
        <ContatoApoliceForm
          contatoId={editingContatoId || undefined}
          apoliceId={id || ''}
          onSuccess={() => {
            fetchContatosApolice()
            setShowContatoModal(false)
            setEditingContatoId(null)
          }}
          onCancel={() => {
            setShowContatoModal(false)
            setEditingContatoId(null)
          }}
        />
      </Modal>

      {/* Modal de Agrupamento */}
      <Modal
        isOpen={showAgrupamentoModal}
        onClose={() => {
          setShowAgrupamentoModal(false)
          setEditingAgrupamentoNome(null)
          setAgrupamentoForm({
            nome: '',
            estipulanteId: null,
            subEstipulanteIds: [],
            liderId: null,
            emails: [],
            informacoesAdicionaisMailing: ''
          })
        }}
        title={editingAgrupamentoNome ? `Editar Agrupamento: ${editingAgrupamentoNome}` : 'Novo Agrupamento'}
        size="medium"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Nome do Agrupamento</label>
            <input
              type="text"
              className="input"
              value={agrupamentoForm.nome}
              onChange={(e) => setAgrupamentoForm({ ...agrupamentoForm, nome: e.target.value, emails: agrupamentoForm.emails || [], informacoesAdicionaisMailing: agrupamentoForm.informacoesAdicionaisMailing || '' })}
              placeholder="Digite o nome do agrupamento"
              disabled={!!editingAgrupamentoNome}
            />
            {editingAgrupamentoNome && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                Para renomear, exclua o agrupamento e crie um novo
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="label">Estipulantes e Sub Estipulantes (selecione uma ou mais)</label>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '8px',
              background: '#f9f9f9'
            }}>
              {/* Estipulante Principal */}
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '12px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  background: agrupamentoForm.estipulanteId ? '#e3f2fd' : 'transparent',
                  marginBottom: '8px'
                }}
              >
                <input
                  type="checkbox"
                  checked={!!agrupamentoForm.estipulanteId}
                  onChange={(e) => setAgrupamentoForm({ 
                    ...agrupamentoForm, 
                    estipulanteId: e.target.checked ? (apolice?.empresa?.id || null) : null,
                    liderId: e.target.checked && !agrupamentoForm.liderId ? (apolice?.empresa?.id || null) : agrupamentoForm.liderId
                  })}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{apolice?.empresa?.razaoSocial || 'Estipulante Principal'}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Apólice: {apolice?.numero || '-'} | CNPJ: {apolice?.empresa?.cnpj ? formatCNPJ(apolice.empresa.cnpj) : '-'}
                  </div>
                </div>
              </label>

              {/* Sub Estipulantes */}
              {subEstipulantes.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                  Nenhuma sub estipulante cadastrada
                </div>
              ) : (
                subEstipulantes.map((se) => (
                  <label 
                    key={se.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: agrupamentoForm.subEstipulanteIds.includes(se.id) ? '#e3f2fd' : 'transparent',
                      marginBottom: '8px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={agrupamentoForm.subEstipulanteIds.includes(se.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAgrupamentoForm({
                            ...agrupamentoForm,
                            subEstipulanteIds: [...agrupamentoForm.subEstipulanteIds, se.id]
                          })
                        } else {
                          setAgrupamentoForm({
                            ...agrupamentoForm,
                            subEstipulanteIds: agrupamentoForm.subEstipulanteIds.filter(id => id !== se.id),
                            liderId: agrupamentoForm.liderId === se.id ? null : agrupamentoForm.liderId
                          })
                        }
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{se.razaoSocial}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Código: {se.codigoEstipulante || '-'} | CNPJ: {se.cnpj ? formatCNPJ(se.cnpj) : '-'}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {(agrupamentoForm.estipulanteId || agrupamentoForm.subEstipulanteIds.length > 0) && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                {agrupamentoForm.estipulanteId ? '1' : '0'} estipulante principal, {agrupamentoForm.subEstipulanteIds.length} sub estipulante(s) selecionada(s)
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="label">Líder do Agrupamento</label>
            <select
              className="input"
              value={agrupamentoForm.liderId || ''}
              onChange={(e) => setAgrupamentoForm({ ...agrupamentoForm, liderId: e.target.value || null })}
              disabled={!agrupamentoForm.estipulanteId && agrupamentoForm.subEstipulanteIds.length === 0}
            >
              <option value="">Selecione o líder do agrupamento</option>
              {agrupamentoForm.estipulanteId && (
                <option value={apolice?.empresa?.id || ''}>
                  {apolice?.empresa?.razaoSocial} (Estipulante Principal)
                </option>
              )}
              {agrupamentoForm.subEstipulanteIds.map((subEstId) => {
                const subEst = subEstipulantes.find(se => se.id === subEstId)
                return subEst ? (
                  <option key={subEstId} value={subEstId}>
                    {subEst.razaoSocial} - {subEst.codigoEstipulante} (Sub Estipulante)
                  </option>
                ) : null
              })}
            </select>
            {(!agrupamentoForm.estipulanteId && agrupamentoForm.subEstipulanteIds.length === 0) && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                Selecione pelo menos uma estipulante ou sub estipulante para definir o líder
              </div>
            )}
          </div>

          {/* Seção de Dados para Entrega */}
          <div className="form-group">
            <label className="label">E-mails para Entrega</label>
            <div style={{ marginBottom: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={async () => {
                  if (agrupamentoForm.subEstipulanteIds.length === 0 && !agrupamentoForm.estipulanteId) {
                    alert('Por favor, selecione pelo menos uma sub estipulante ou a estipulante principal para carregar os e-mails.')
                    return
                  }
                  
                  setLoadingEmails(true)
                  
                  try {
                    // Carregar e-mails dos contatos das sub estipulantes selecionadas E da apólice (estipulante principal)
                    const emailsCarregados: string[] = []
                    let totalContatos = 0
                    let contatosComEmail = 0
                    
                    // Se a estipulante principal estiver selecionada, buscar contatos da apólice
                    if (agrupamentoForm.estipulanteId && id) {
                      try {
                        const responseApolice = await api.get(`/contatos-apolice?apoliceId=${id}&limit=1000`)
                        const contatosApolice = responseApolice.data.data || []
                        totalContatos += contatosApolice.length
                        
                        const emailsApolice = contatosApolice
                          .filter((c: any) => {
                            const temEmail = c.email && typeof c.email === 'string' && c.email.trim().length > 0
                            const ativo = c.ativo === true || c.ativo === null || c.ativo === undefined
                            
                            if (temEmail && ativo) {
                              contatosComEmail++
                              return true
                            }
                            return false
                          })
                          .map((c: any) => c.email.trim())
                        
                        emailsCarregados.push(...emailsApolice)
                      } catch (error: any) {
                        console.error(`Erro ao carregar contatos da apólice:`, error)
                      }
                    }
                    
                    // Buscar contatos das sub estipulantes selecionadas
                    for (const subEstId of agrupamentoForm.subEstipulanteIds) {
                      try {
                        const response = await api.get(`/contatos-sub-estipulante?subEstipulanteId=${subEstId}&limit=1000`)
                        const contatos = response.data.data || []
                        totalContatos += contatos.length
                        
                        const emails = contatos
                          .filter((c: any) => {
                            // Verificar se tem email válido (não null, não undefined, não vazio)
                            const temEmail = c.email && typeof c.email === 'string' && c.email.trim().length > 0
                            // Verificar se está ativo (ativo === true ou ativo === null/undefined, já que o padrão é true)
                            const ativo = c.ativo === true || c.ativo === null || c.ativo === undefined
                            
                            if (temEmail && ativo) {
                              contatosComEmail++
                              return true
                            }
                            return false
                          })
                          .map((c: any) => c.email.trim())
                        
                        emailsCarregados.push(...emails)
                      } catch (error: any) {
                        console.error(`Erro ao carregar contatos da sub estipulante ${subEstId}:`, error)
                        alert(`Erro ao carregar contatos: ${error.response?.data?.error || error.message}`)
                      }
                    }
                    
                    // Remover duplicatas
                    const emailsUnicos = Array.from(new Set(emailsCarregados))
                    
                    if (emailsUnicos.length === 0) {
                      let mensagem = `Nenhum e-mail encontrado nos contatos.\n\n`
                      mensagem += `Total de contatos verificados: ${totalContatos}\n`
                      mensagem += `Contatos com e-mail ativo: ${contatosComEmail}\n\n`
                      if (totalContatos === 0) {
                        if (agrupamentoForm.estipulanteId && agrupamentoForm.subEstipulanteIds.length > 0) {
                          mensagem += `Nenhum contato foi encontrado na apólice nem nas sub estipulantes selecionadas. Verifique se há contatos cadastrados na seção "Mailing" (aba Informações Adicionais) ou nas sub estipulantes.`
                        } else if (agrupamentoForm.estipulanteId) {
                          mensagem += `Nenhum contato foi encontrado na apólice. Verifique se há contatos cadastrados na seção "Mailing" (aba Informações Adicionais).`
                        } else {
                          mensagem += `Nenhum contato foi encontrado para as sub estipulantes selecionadas. Verifique se há contatos cadastrados nas sub estipulantes.`
                        }
                      } else if (contatosComEmail === 0) {
                        mensagem += `Os contatos encontrados não possuem e-mail válido ou estão inativos. Verifique se os contatos têm o campo "email" preenchido e estão ativos.`
                      }
                      alert(mensagem)
                    } else {
                      setAgrupamentoForm({
                        ...agrupamentoForm,
                        emails: [...new Set([...agrupamentoForm.emails, ...emailsUnicos])]
                      })
                      alert(`${emailsUnicos.length} e-mail(s) carregado(s) com sucesso!\n\nE-mails: ${emailsUnicos.join(', ')}`)
                    }
                  } catch (error: any) {
                    console.error('Erro ao carregar e-mails:', error)
                    alert(`Erro ao carregar e-mails: ${error.response?.data?.error || error.message}`)
                  } finally {
                    setLoadingEmails(false)
                  }
                }}
                disabled={agrupamentoForm.subEstipulanteIds.length === 0 || loadingEmails}
              >
                {loadingEmails ? 'Carregando...' : 'Carregar E-mails do Mailing'}
              </button>
              {agrupamentoForm.subEstipulanteIds.length === 0 && !agrupamentoForm.estipulanteId && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                  Selecione a estipulante principal ou sub estipulantes para carregar e-mails
                </div>
              )}
            </div>
            <textarea
              className="input"
              rows={4}
              value={agrupamentoForm.emails.join(', ')}
              onChange={(e) => {
                const emails = e.target.value
                  .split(',')
                  .map(email => email.trim())
                  .filter(email => email.length > 0)
                setAgrupamentoForm({ ...agrupamentoForm, emails })
              }}
              placeholder="Digite os e-mails separados por vírgula ou use o botão acima para carregar do mailing"
            />
            {agrupamentoForm.emails.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                {agrupamentoForm.emails.length} e-mail(s) adicionado(s)
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="label">Informações Adicionais - Mailing</label>
            <textarea
              className="input"
              rows={4}
              value={agrupamentoForm.informacoesAdicionaisMailing}
              onChange={(e) => setAgrupamentoForm({ ...agrupamentoForm, informacoesAdicionaisMailing: e.target.value })}
              placeholder="Digite informações adicionais sobre o mailing para entrega"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowAgrupamentoModal(false)
                setEditingAgrupamentoNome(null)
                setAgrupamentoForm({
                  nome: '',
                  estipulanteId: null,
                  subEstipulanteIds: [],
                  liderId: null,
                  emails: [],
                  informacoesAdicionaisMailing: ''
                })
              }}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                handleAddAgrupamento()
                setShowAgrupamentoModal(false)
                setEditingAgrupamentoNome(null)
                setAgrupamentoForm({
                  nome: '',
                  estipulanteId: null,
                  subEstipulanteIds: [],
                  liderId: null,
                  emails: [],
                  informacoesAdicionaisMailing: ''
                })
              }}
              disabled={saving}
            >
              {editingAgrupamentoNome ? 'Salvar Alterações' : 'Adicionar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Elegibilidade */}
      <Modal
        isOpen={showElegibilidadeModal}
        onClose={() => {
          setShowElegibilidadeModal(false)
          setEditingElegibilidadeId(null)
        }}
        title={editingElegibilidadeId ? 'Editar Elegibilidade' : 'Nova Elegibilidade'}
        size="medium"
      >
        <ElegibilidadeForm
          elegibilidadeId={editingElegibilidadeId || undefined}
          apoliceId={id || ''}
          onSuccess={() => {
            fetchElegibilidades()
            setShowElegibilidadeModal(false)
            setEditingElegibilidadeId(null)
          }}
          onCancel={() => {
            setShowElegibilidadeModal(false)
            setEditingElegibilidadeId(null)
          }}
        />
      </Modal>

      {/* Modal de Detalhes do Plano */}
      <Modal
        isOpen={showPlanoDetalhesModal}
        onClose={() => {
          setShowPlanoDetalhesModal(false)
          setPlanoDetalhes(null)
        }}
        title={`Detalhes do Plano: ${planoDetalhes?.nomePlano || ''}`}
        size="xlarge"
      >
        {planoDetalhes && (
          <div className="plano-detalhes-content" style={{ width: '100%' }}>
            <div className="form-section-title">Dados Principais</div>
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <div className="form-group">
                <label className="label">Nome do Plano</label>
                <div className="field-value">{planoDetalhes.nomePlano || '-'}</div>
              </div>
              <div className="form-group">
                <label className="label">Código ANS</label>
                <div className="field-value">{planoDetalhes.codANS || '-'}</div>
              </div>
              <div className="form-group">
                <label className="label">Código do Plano</label>
                <div className="field-value">{planoDetalhes.codPlano || '-'}</div>
              </div>
              <div className="form-group">
                <label className="label">Vidas Implantadas</label>
                <div className="field-value">{planoDetalhes.vidasImplantadas || '-'}</div>
              </div>
            </div>

            <div className="form-section-title">Valor do Plano</div>
            {planoDetalhes.tipoValorPlano === 'custo_medio' && (
              <div className="form-group">
                <label className="label">Custo Médio</label>
                <div className="field-value">
                  {planoDetalhes.valorPlano || planoDetalhes.custoMedio 
                    ? `R$ ${(planoDetalhes.valorPlano || planoDetalhes.custoMedio).toFixed(2)}` 
                    : '-'}
                </div>
              </div>
            )}
            {planoDetalhes.tipoValorPlano === 'faixa_etaria' && (
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-group">
                  <label className="label">0 a 18 anos</label>
                  <div className="field-value">{planoDetalhes.faixa0a18 ? `R$ ${planoDetalhes.faixa0a18.toFixed(2)}` : '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">19 a 23 anos</label>
                  <div className="field-value">{planoDetalhes.faixa19a23 ? `R$ ${planoDetalhes.faixa19a23.toFixed(2)}` : '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">24 a 28 anos</label>
                  <div className="field-value">{planoDetalhes.faixa24a28 ? `R$ ${planoDetalhes.faixa24a28.toFixed(2)}` : '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">29 a 33 anos</label>
                  <div className="field-value">{planoDetalhes.faixa29a33 ? `R$ ${planoDetalhes.faixa29a33.toFixed(2)}` : '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">34 a 38 anos</label>
                  <div className="field-value">{planoDetalhes.faixa34a38 ? `R$ ${planoDetalhes.faixa34a38.toFixed(2)}` : '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">39 a 43 anos</label>
                  <div className="field-value">{planoDetalhes.faixa39a43 ? `R$ ${planoDetalhes.faixa39a43.toFixed(2)}` : '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">44 a 48 anos</label>
                  <div className="field-value">{planoDetalhes.faixa44a48 ? `R$ ${planoDetalhes.faixa44a48.toFixed(2)}` : '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">49 a 53 anos</label>
                  <div className="field-value">{planoDetalhes.faixa49a53 ? `R$ ${planoDetalhes.faixa49a53.toFixed(2)}` : '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">54 a 58 anos</label>
                  <div className="field-value">{planoDetalhes.faixa54a58 ? `R$ ${planoDetalhes.faixa54a58.toFixed(2)}` : '-'}</div>
                </div>
                <div className="form-group">
                  <label className="label">59 anos ou mais</label>
                  <div className="field-value">{planoDetalhes.faixa59ouMais ? `R$ ${planoDetalhes.faixa59ouMais.toFixed(2)}` : '-'}</div>
                </div>
              </div>
            )}

            <div className="form-section-title">Vigências</div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Início de Vigência</label>
                <div className="field-value">{formatDate(planoDetalhes.inicioVigencia)}</div>
              </div>
              <div className="form-group">
                <label className="label">Fim de Vigência</label>
                <div className="field-value">{formatDate(planoDetalhes.fimVigencia)}</div>
              </div>
            </div>

            <div className="form-section-title">Permissões</div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Upgrade</label>
                <div className="field-value">{planoDetalhes.upgrade ? 'Sim' : 'Não'}</div>
              </div>
              <div className="form-group">
                <label className="label">Downgrade</label>
                <div className="field-value">{planoDetalhes.downgrade ? 'Sim' : 'Não'}</div>
              </div>
            </div>

            <div className="form-section-title">Informações Adicionais</div>
            <div className="form-group">
              <label className="label">Elegibilidade</label>
              <div className="field-value">{planoDetalhes.elegibilidade?.nome || '-'}</div>
            </div>

            <div className="form-section-title">Reembolso</div>
            <div className="form-group">
              <label className="label">Reembolso</label>
              <div className="field-value">{planoDetalhes.reembolso ? 'Sim' : 'Não'}</div>
            </div>
            {planoDetalhes.reembolso && (
              <div style={{ marginTop: '16px' }}>
                {planoDetalhes.reembolsos && planoDetalhes.reembolsos.length > 0 ? (
                  <table className="sub-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Valor</th>
                        <th>Procedimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planoDetalhes.reembolsos.map((reembolso: any) => (
                        <tr key={reembolso.id}>
                          <td>{reembolso.valor ? `R$ ${reembolso.valor.toFixed(2)}` : '-'}</td>
                          <td>{reembolso.procedimento || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', color: '#666' }}>
                    Nenhum reembolso cadastrado
                  </div>
                )}
              </div>
            )}

            <div className="form-section-title">Coparticipação</div>
            <div className="form-group">
              <label className="label">Coparticipação</label>
              <div className="field-value">{planoDetalhes.coparticipacao ? 'Sim' : 'Não'}</div>
            </div>
            {planoDetalhes.coparticipacao && (
              <div style={{ marginTop: '16px' }}>
                {planoDetalhes.coparticipacoes && planoDetalhes.coparticipacoes.length > 0 ? (
                  <table className="sub-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Valor</th>
                        <th>Procedimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planoDetalhes.coparticipacoes.map((coparticipacao: any) => (
                        <tr key={coparticipacao.id}>
                          <td>{coparticipacao.valor ? `R$ ${coparticipacao.valor.toFixed(2)}` : '-'}</td>
                          <td>{coparticipacao.procedimento || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', color: '#666' }}>
                    Nenhuma coparticipação cadastrada
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ApoliceDetalhes

