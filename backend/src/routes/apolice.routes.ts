import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth.middleware';
import { apoliceSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /apolices
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '10', search = '', clienteId, fornecedorId, status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (clienteId) where.clienteId = clienteId;
    if (fornecedorId) where.fornecedorId = fornecedorId;
    if (status) where.status = status;

    if (search && (search as string).trim() !== '') {
      const searchTerm = (search as string).trim();
      // Busca otimizada: buscar empresas e fornecedores em paralelo
      // No PostgreSQL, contains já é case-sensitive, mas podemos usar searchTerm em lowercase
      const [empresasEncontradas, fornecedoresEncontrados] = await Promise.all([
        prisma.empresa.findMany({
          where: {
            tenantId: req.tenantId,
            OR: [
              { razaoSocial: { contains: searchTerm } },
              { cnpj: { contains: searchTerm } }
            ]
          },
          select: { id: true },
          take: 100 // Limitar resultados para evitar queries muito grandes
        }),
        prisma.fornecedor.findMany({
          where: {
            tenantId: req.tenantId,
            OR: [
              { razaoSocial: { contains: searchTerm } },
              { cnpj: { contains: searchTerm } }
            ]
          },
          select: { id: true },
          take: 100
        })
      ]);
      
      const empresaIds = empresasEncontradas.map(e => e.id);
      const fornecedorIds = fornecedoresEncontrados.map(f => f.id);
      
      where.OR = [
        { numero: { contains: searchTerm } },
        { produto: { contains: searchTerm } }
      ];
      
      // Se encontrou empresas, adicionar ao filtro
      if (empresaIds.length > 0) {
        where.OR.push({ clienteId: { in: empresaIds } });
      }
      
      // Se encontrou fornecedores, adicionar ao filtro
      if (fornecedorIds.length > 0) {
        where.OR.push({ fornecedorId: { in: fornecedorIds } });
      }
    }

    // SQLite não suporta contains case-insensitive, então usamos uma busca simples
    // Se necessário, podemos fazer uma busca case-insensitive manualmente

    // Logs removidos em produção para melhor performance
    if (process.env.NODE_ENV === 'development') {
      console.log('Buscando apólices com where:', JSON.stringify(where, null, 2));
      console.log('Tenant ID:', req.tenantId);
    }
    
    let data;
    let total;
    
    try {
      // Primeiro, buscar o total para paginação
      total = await prisma.apolice.count({ where });
      
      // Se não houver apólices, retornar array vazio
      if (total === 0) {
        data = [];
      } else {
        // Buscar apólices básicas sem includes
        const apolicesBasicas = await prisma.apolice.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
        });

        // Se houver apólices, buscar os relacionamentos separadamente
        if (apolicesBasicas.length > 0) {
          const clienteIds = [...new Set(apolicesBasicas.map(a => a.clienteId).filter(Boolean))];
          const fornecedorIds = [...new Set(apolicesBasicas.map(a => a.fornecedorId).filter(Boolean))];

          // Buscar relacionamentos apenas se houver IDs válidos
          const [empresas, fornecedores] = await Promise.all([
            clienteIds.length > 0 
              ? prisma.empresa.findMany({
                  where: { id: { in: clienteIds }, tenantId: req.tenantId },
                  include: { grupoEconomico: true }
                })
              : Promise.resolve([]),
            fornecedorIds.length > 0
              ? prisma.fornecedor.findMany({
                  where: { id: { in: fornecedorIds }, tenantId: req.tenantId },
                  select: { id: true, razaoSocial: true, cnpj: true }
                })
              : Promise.resolve([])
          ]);

          const empresasMap = new Map(empresas.map(e => [e.id, e]));
          const fornecedoresMap = new Map(fornecedores.map(f => [f.id, f]));

          data = apolicesBasicas.map(apolice => ({
            ...apolice,
            empresa: empresasMap.get(apolice.clienteId) || null,
            fornecedor: fornecedoresMap.get(apolice.fornecedorId) || null
          }));
        } else {
          data = [];
        }
      }
    } catch (dbError: any) {
      console.error('Erro no banco de dados ao buscar apólices:', dbError);
      console.error('Stack trace:', dbError.stack);
      console.error('Error message:', dbError.message);
      console.error('Error code:', dbError.code);
      throw dbError;
    }

    // Log para debug
    if (data.length > 0) {
      console.log('Primeira apólice retornada:', JSON.stringify(data[0], null, 2));
    }

    res.json({
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar apólices:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    res.status(500).json({ 
      error: 'Erro ao listar apólices', 
      details: error.message,
      name: error.name,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /apolices/:id/detalhes - Retorna todos os dados relacionados em uma única requisição
router.get('/:id/detalhes', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const tenantId = req.tenantId;

    // Buscar apólice com relacionamentos básicos
    const apolice = await prisma.apolice.findFirst({
      where: { id, tenantId },
      include: {
        empresa: {
          include: {
            grupoEconomico: {
              select: { id: true, name: true }
            }
          }
        },
        fornecedor: {
          select: { id: true, razaoSocial: true, cnpj: true }
        }
      }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    // Buscar todos os dados relacionados em paralelo
    const [
      subEstipulantes,
      agrupamentosFaturamento,
      planos,
      cobertura,
      reajustes,
      relacionamento,
      elegibilidades,
      enderecosApolice,
      contatosApolice,
      comissionamento,
      fee
    ] = await Promise.all([
      prisma.subEstipulante.findMany({ where: { apoliceId: id, tenantId } }),
      prisma.agrupamentoFaturamento.findMany({ where: { apoliceId: id, tenantId } }),
      prisma.plano.findMany({ where: { apoliceId: id, tenantId } }),
      prisma.cobertura.findFirst({ where: { apoliceId: id, tenantId } }),
      prisma.reajuste.findMany({ where: { apoliceId: id, tenantId }, orderBy: { createdAt: 'desc' } }),
      prisma.relacionamento.findFirst({ where: { apoliceId: id, tenantId } }),
      prisma.elegibilidade.findMany({ where: { apoliceId: id, tenantId } }),
      prisma.enderecoApolice.findMany({ where: { apoliceId: id, tenantId } }),
      prisma.contatoApolice.findMany({ where: { apoliceId: id, tenantId } }),
      prisma.comissionamentoApolice.findFirst({ where: { apoliceId: id, tenantId } }),
      prisma.feeApolice.findFirst({ where: { apoliceId: id, tenantId } })
    ]);

    res.json({
      apolice: {
        ...apolice,
        fornecedor: apolice.fornecedor ? {
          id: apolice.fornecedor.id,
          razaoSocial: apolice.fornecedor.razaoSocial,
          cnpj: apolice.fornecedor.cnpj || undefined
        } : null
      },
      subEstipulantes,
      agrupamentosFaturamento,
      planos,
      cobertura,
      reajustes,
      relacionamento,
      elegibilidades,
      enderecosApolice,
      contatosApolice,
      comissionamento,
      fee
    });
  } catch (error: any) {
    console.error('Erro ao buscar detalhes da apólice:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes da apólice', details: error.message });
  }
});

// GET /apolices/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const apolice = await prisma.apolice.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        empresa: {
          include: {
            grupoEconomico: {
              select: { id: true, name: true }
            }
          }
        },
        fornecedor: {
          select: { id: true, razaoSocial: true, cnpj: true }
        }
      }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    // Garantir que o fornecedor tenha apenas os campos necessários
    const apoliceResponse = {
      ...apolice,
      fornecedor: apolice.fornecedor ? {
        id: apolice.fornecedor.id,
        razaoSocial: apolice.fornecedor.razaoSocial,
        cnpj: apolice.fornecedor.cnpj || undefined
      } : null
    };

    console.log('Apólice retornada - Fornecedor:', JSON.stringify(apoliceResponse.fornecedor, null, 2));
    res.json(apoliceResponse);
  } catch (error: any) {
    console.error('Erro ao buscar apólice:', error);
    res.status(500).json({ error: 'Erro ao buscar apólice', details: error.message });
  }
});

// POST /apolices
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }
    
    console.log('Criando apólice com dados:', JSON.stringify(req.body, null, 2));
    const data = apoliceSchema.parse(req.body);

    // Verificar se empresa e fornecedor pertencem ao tenant
    const [empresa, fornecedor] = await Promise.all([
      prisma.empresa.findFirst({
        where: { id: data.clienteId, tenantId: req.tenantId }
      }),
      prisma.fornecedor.findFirst({
        where: { id: data.fornecedorId, tenantId: req.tenantId }
      })
    ]);

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    const apolice = await prisma.apolice.create({
      data: {
        clienteId: data.clienteId,
        fornecedorId: data.fornecedorId,
        numero: data.numero,
        produto: data.produto || null,
        codigoCNAE: data.codigoCNAE || null,
        ramoAtividade: data.ramoAtividade || null,
        inscricaoEstadual: data.inscricaoEstadual || null,
        inscricaoMunicipal: data.inscricaoMunicipal || null,
        porteCliente: data.porteCliente || null,
        dataVigenciaMDS: data.dataVigenciaMDS && data.dataVigenciaMDS !== '' ? new Date(data.dataVigenciaMDS) : null,
        dataVigenciaContratoInicio: data.dataVigenciaContratoInicio && data.dataVigenciaContratoInicio !== '' ? new Date(data.dataVigenciaContratoInicio) : null,
        dataVigenciaContratoFim: null,
        periodoVigencia: data.periodoVigencia || null,
        limiteTecnico: data.limiteTecnico || null,
        regimeContratacao: data.regimeContratacao || null,
        tipoContrato: data.tipoContrato || null,
        coparticipacao: data.coparticipacao || null,
        mesReajuste: data.mesReajuste || null,
        dataVencimentoFatura: data.dataVencimentoFatura && data.dataVencimentoFatura !== '' ? new Date(data.dataVencimentoFatura) : null,
        emissao: data.emissao && data.emissao !== '' ? new Date(data.emissao) : null,
        dataEntrega: data.dataEntrega && data.dataEntrega !== '' ? new Date(data.dataEntrega) : null,
        dataCorte: data.dataCorte && data.dataCorte !== '' ? new Date(data.dataCorte) : null,
        codigoProducaoAngariador: data.codigoProducaoAngariador || null,
        status: data.status || 'ATIVA',
        tenantId: req.tenantId!
      },
      include: {
        empresa: { 
          include: {
            grupoEconomico: {
              select: { id: true, name: true }
            }
          }
        },
        fornecedor: { select: { id: true, razaoSocial: true, cnpj: true } }
      }
    });

    res.status(201).json(apolice);
  } catch (error: any) {
    console.error('Erro ao criar apólice:', error);
    console.error('Stack trace:', error.stack);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ 
      error: 'Erro ao criar apólice', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /apolices/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = apoliceSchema.parse(req.body);

    const existing = await prisma.apolice.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    const apolice = await prisma.apolice.update({
      where: { id },
      data: {
        clienteId: data.clienteId,
        fornecedorId: data.fornecedorId,
        numero: data.numero,
        produto: data.produto || null,
        codigoCNAE: data.codigoCNAE || null,
        ramoAtividade: data.ramoAtividade || null,
        inscricaoEstadual: data.inscricaoEstadual || null,
        inscricaoMunicipal: data.inscricaoMunicipal || null,
        porteCliente: data.porteCliente || null,
        dataVigenciaMDS: data.dataVigenciaMDS && data.dataVigenciaMDS !== '' ? new Date(data.dataVigenciaMDS) : null,
        dataVigenciaContratoInicio: data.dataVigenciaContratoInicio && data.dataVigenciaContratoInicio !== '' ? new Date(data.dataVigenciaContratoInicio) : null,
        dataVigenciaContratoFim: null,
        periodoVigencia: data.periodoVigencia !== undefined ? (data.periodoVigencia || null) : existing.periodoVigencia,
        limiteTecnico: data.limiteTecnico !== undefined ? (data.limiteTecnico || null) : existing.limiteTecnico,
        regimeContratacao: data.regimeContratacao !== undefined ? (data.regimeContratacao || null) : existing.regimeContratacao,
        tipoContrato: data.tipoContrato !== undefined ? (data.tipoContrato || null) : existing.tipoContrato,
        coparticipacao: data.coparticipacao !== undefined ? (data.coparticipacao || null) : existing.coparticipacao,
        mesReajuste: data.mesReajuste !== undefined ? (data.mesReajuste || null) : existing.mesReajuste,
        dataVencimentoFatura: data.dataVencimentoFatura && data.dataVencimentoFatura !== '' ? new Date(data.dataVencimentoFatura) : (data.dataVencimentoFatura === null ? null : existing.dataVencimentoFatura),
        emissao: data.emissao && data.emissao !== '' ? new Date(data.emissao) : (data.emissao === null ? null : existing.emissao),
        dataEntrega: data.dataEntrega && data.dataEntrega !== '' ? new Date(data.dataEntrega) : (data.dataEntrega === null ? null : existing.dataEntrega),
        dataCorte: data.dataCorte && data.dataCorte !== '' ? new Date(data.dataCorte) : (data.dataCorte === null ? null : existing.dataCorte),
        codigoProducaoAngariador: data.codigoProducaoAngariador !== undefined ? (data.codigoProducaoAngariador || null) : existing.codigoProducaoAngariador,
        status: data.status || 'ATIVA'
      },
      include: {
        empresa: { 
          include: {
            grupoEconomico: {
              select: { id: true, name: true }
            }
          }
        },
        fornecedor: { select: { id: true, razaoSocial: true, cnpj: true } }
      }
    });

    res.json(apolice);
  } catch (error: any) {
    console.error('Erro ao atualizar apólice:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Erro ao atualizar apólice', details: error.message });
  }
});

// DELETE /apolices/:id
router.delete('/:id', requireRole('ADMIN', 'GESTOR'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const apolice = await prisma.apolice.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    await prisma.apolice.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar apólice' });
  }
});

export { router as apoliceRoutes };

