import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

export const registerSchema = z.object({
  tenantName: z.string().min(3, 'Nome do tenant deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres')
});

export const clienteSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional()
});

export const fornecedorSchema = z.object({
  tipo: z.enum(['FORNECEDOR', 'CORRETOR_PARCEIRO']).default('FORNECEDOR'),
  cnpj: z.string().optional(),
  registroANS: z.string().optional(),
  razaoSocial: z.string().min(3, 'Razão Social deve ter no mínimo 3 caracteres'),
  nomeFantasia: z.string().optional(),
  inscricaoEstadual: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  iof: z.string().optional(),
  tipoProduto: z.string().optional(),
  produtos: z.string().optional(),
  planosComReembolso: z.string().optional(),
  divulgacaoIndiceFinanceiro: z.string().optional(),
  vidasEmpresarialANS: z.string().optional(),
  custoMedioANS: z.number().optional(),
  compAtualizacaoANS: z.string().optional(),
  observacao: z.string().optional(),
  situacaoOperadora: z.string().optional()
});

export const enderecoFornecedorSchema = z.object({
  fornecedorId: z.string().uuid('ID do fornecedor inválido'),
  tipo: z.string().default('COMERCIAL'),
  cep: z.string().optional(),
  tipoLogradouro: z.string().optional(),
  logradouro: z.string().min(3, 'Logradouro deve ter no mínimo 3 caracteres'),
  semNumero: z.boolean().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  uf: z.string().min(2, 'UF deve ter 2 caracteres'),
  cidade: z.string().min(3, 'Cidade deve ter no mínimo 3 caracteres'),
  observacoes: z.string().optional()
});

export const contatoFornecedorSchema = z.object({
  fornecedorId: z.string().uuid('ID do fornecedor inválido'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cargo: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  ativo: z.boolean().optional(),
  observacoes: z.string().optional()
});

export const apoliceSchema = z.object({
  clienteId: z.string().uuid('ID do cliente inválido'),
  fornecedorId: z.string().uuid('ID do fornecedor inválido'),
  numero: z.string().min(1, 'Número da apólice é obrigatório'),
  produto: z.string().optional().nullable(),
  codigoCNAE: z.string().optional().nullable(),
  ramoAtividade: z.string().optional().nullable(),
  inscricaoEstadual: z.string().optional().nullable(),
  inscricaoMunicipal: z.string().optional().nullable(),
  porteCliente: z.string().optional().nullable(),
  dataVigenciaMDS: z.string().optional().nullable(),
  dataVigenciaContratoInicio: z.string().optional().nullable(),
  dataVigenciaContratoFim: z.string().optional().nullable(),
  periodoVigencia: z.string().optional().nullable(),
  limiteTecnico: z.string().optional().nullable(),
  regimeContratacao: z.string().optional().nullable(),
  tipoContrato: z.string().optional().nullable(),
  coparticipacao: z.string().optional().nullable(),
  mesReajuste: z.string().optional().nullable(),
  dataVencimentoFatura: z.string().optional().nullable(),
  emissao: z.string().optional().nullable(),
  dataEntrega: z.string().optional().nullable(),
  dataCorte: z.string().optional().nullable(),
  codigoProducaoAngariador: z.string().optional().nullable(),
  status: z.string().optional()
});

export const subEstipulanteSchema = z.object({
  apoliceId: z.string().uuid('ID da apólice inválido'),
  codigoEstipulante: z.string().min(1, 'Código do estipulante é obrigatório'),
  cnpj: z.string().optional().nullable(),
  razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
  codigoCNAE: z.string().optional().nullable(),
  ramoAtividade: z.string().optional().nullable(),
  inscricaoEstadual: z.string().optional().nullable(),
  inscricaoMunicipal: z.string().optional().nullable(),
  tipo: z.enum(['PRESTADOR_SERVICO', 'OUTRO']).optional().nullable(),
  dataVigenciaContrato: z.string().optional().nullable(),
  dataCancelamento: z.string().optional().nullable(),
  status: z.string().optional()
});

export const planoSchema = z.object({
  apoliceId: z.string().uuid('ID da apólice inválido'),
  nomePlano: z.string().min(1, 'Nome do plano é obrigatório'),
  codANS: z.string().optional().nullable(),
  codPlano: z.string().optional().nullable(),
  vidasImplantadas: z.number().int().optional().nullable(),
  tipoValorPlano: z.enum(['custo_medio', 'faixa_etaria']).optional().nullable(),
  valorPlano: z.number().optional().nullable(),
  custoMedio: z.number().optional().nullable(),
  faixa0a18: z.number().optional().nullable(),
  faixa19a23: z.number().optional().nullable(),
  faixa24a28: z.number().optional().nullable(),
  faixa29a33: z.number().optional().nullable(),
  faixa34a38: z.number().optional().nullable(),
  faixa39a43: z.number().optional().nullable(),
  faixa44a48: z.number().optional().nullable(),
  faixa49a53: z.number().optional().nullable(),
  faixa54a58: z.number().optional().nullable(),
  faixa59ouMais: z.number().optional().nullable(),
  inicioVigencia: z.string().optional().nullable(),
  fimVigencia: z.string().optional().nullable(),
  upgrade: z.boolean().optional().nullable(),
  downgrade: z.boolean().optional().nullable(),
  liberadoMovimentacao: z.boolean().optional().nullable(),
  elegibilidadeId: z.string().uuid('ID da elegibilidade inválido').optional().nullable(),
  reembolso: z.boolean().optional().nullable(),
  coparticipacao: z.boolean().optional().nullable()
});

export const reembolsoPlanoSchema = z.object({
  planoId: z.string().uuid('ID do plano inválido'),
  valor: z.number().optional().nullable(),
  procedimento: z.string().optional().nullable()
});

export const coparticipacaoPlanoSchema = z.object({
  planoId: z.string().uuid('ID do plano inválido'),
  valor: z.number().optional().nullable(),
  procedimento: z.string().optional().nullable()
});

export const relacionamentoSchema = z.object({
  apoliceId: z.string().uuid('ID da apólice inválido'),
  executivo: z.string().optional().nullable(),
  coordenador: z.string().optional().nullable(),
  gerente: z.string().optional().nullable(),
  superintendente: z.string().optional().nullable(),
  diretoria: z.string().optional().nullable(),
  filial: z.string().optional().nullable(),
  celulaAtendimento: z.string().optional().nullable()
});

export const elegibilidadeSchema = z.object({
  apoliceId: z.string().uuid('ID da apólice inválido').optional().nullable(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  centroCusto: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  descricao: z.string().optional().nullable()
});

export const enderecoApoliceSchema = z.object({
  apoliceId: z.string().uuid('ID da apólice inválido'),
  tipo: z.string().default('COMERCIAL'),
  cep: z.string().optional().nullable(),
  tipoLogradouro: z.string().optional().nullable(),
  logradouro: z.string().min(3, 'Logradouro deve ter no mínimo 3 caracteres'),
  semNumero: z.boolean().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  uf: z.string().min(2, 'UF deve ter 2 caracteres'),
  cidade: z.string().min(3, 'Cidade deve ter no mínimo 3 caracteres'),
  observacoes: z.string().optional().nullable()
});

export const contatoApoliceSchema = z.object({
  apoliceId: z.string().uuid('ID da apólice inválido'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cargo: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional().nullable(),
  ativo: z.boolean().optional().nullable(),
  observacoes: z.string().optional().nullable()
});

export const enderecoSubEstipulanteSchema = z.object({
  subEstipulanteId: z.string().uuid('ID do sub estipulante inválido'),
  tipo: z.string().default('COMERCIAL'),
  cep: z.string().optional().nullable(),
  tipoLogradouro: z.string().optional().nullable(),
  logradouro: z.string().min(3, 'Logradouro deve ter no mínimo 3 caracteres'),
  semNumero: z.boolean().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  uf: z.string().min(2, 'UF deve ter 2 caracteres'),
  cidade: z.string().min(3, 'Cidade deve ter no mínimo 3 caracteres'),
  observacoes: z.string().optional().nullable()
});

export const contatoSubEstipulanteSchema = z.object({
  subEstipulanteId: z.string().uuid('ID do sub estipulante inválido'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cargo: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional().nullable(),
  ativo: z.boolean().optional().nullable(),
  observacoes: z.string().optional().nullable()
});

export const reajusteSchema = z.object({
  apoliceId: z.string().uuid('ID da apólice inválido'),
  tipo: z.string().optional().nullable(),
  inicioPeriodo: z.string().optional().nullable(), // MM/YYYY
  fimPeriodo: z.string().optional().nullable(), // MM/YYYY
  indiceApurado: z.number().optional().nullable(),
  indiceAplicado: z.number().optional().nullable(),
  mesAplicado: z.string().optional().nullable(), // MM/YYYY
  dataNegociacao: z.string().optional().nullable(), // MM/YYYY
  conclusao: z.string().optional().nullable(),
  observacao: z.string().optional().nullable()
});

export const coberturaSchema = z.object({
  apoliceId: z.string().uuid('ID da apólice inválido'),
  tipoMultiplicador: z.enum(['SALARIAL', 'UNIFORME', 'ESCALONADO', 'GLOBAL']).optional().nullable(),
  multiplicadorMin: z.number().optional().nullable(),
  multiplicadorMax: z.number().optional().nullable(),
  multiplo: z.number().optional().nullable(),
  taxaAdm: z.number().optional().nullable()
});

export const coberturaItemSchema = z.object({
  coberturaId: z.string().uuid('ID da cobertura inválido'),
  nome: z.string().min(1, 'Nome da cobertura é obrigatório'),
  selecionado: z.boolean().default(false),
  tipoValor: z.enum(['PERCENTUAL', 'VALOR_FIXO']).optional().nullable(),
  percentualTitular: z.number().optional().nullable(),
  percentualConjuge: z.number().optional().nullable(),
  percentualFilhos: z.number().optional().nullable(),
  valorFixoTitular: z.number().optional().nullable(),
  valorFixoConjuge: z.number().optional().nullable(),
  valorFixoFilhos: z.number().optional().nullable()
});

export const comissionamentoApoliceSchema = z.object({
  apoliceId: z.string().uuid('ID da apólice inválido'),
  temCorretorParceiro: z.boolean().optional().nullable(),
  valorAgenciamentoContrato: z.number().optional().nullable(),
  valorVitalicioContrato: z.number().optional().nullable(),
  agenciamentoConsultoria: z.string().optional().nullable(),
  vitalicioConsultoria: z.string().optional().nullable(),
  agenciamentoCorretor: z.string().optional().nullable(),
  vitalicioCorretor: z.string().optional().nullable()
});

export const feeApoliceSchema = z.object({
  apoliceId: z.string().uuid('ID da apólice inválido'),
  valorFeeMensal: z.number().optional().nullable(),
  feeConsultoria: z.number().optional().nullable(),
  feeCorretorParceiro: z.number().optional().nullable()
});

// Módulo Dados - Configurações Dinâmicas
export const moduloSchema = z.object({
  nome: z.string().min(1, 'Nome do módulo é obrigatório'),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().default(true)
});

export const dadoDinamicoSchema = z.object({
  configuracaoCampoId: z.string().uuid('ID da configuração inválido'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  ordem: z.number().int().default(0),
  ativo: z.boolean().default(true)
});

export const configuracaoCampoSchema = z.object({
  moduloId: z.string().uuid('ID do módulo inválido'),
  nome: z.string().min(1, 'Nome do campo é obrigatório')
});

export const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  role: z.string().optional()
});
