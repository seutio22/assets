import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth.middleware';
import { subEstipulanteSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /sub-estipulantes
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '10', search = '', apoliceId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (apoliceId) where.apoliceId = apoliceId;

    if (search) {
      where.OR = [
        { codigoEstipulante: { contains: search as string } },
        { razaoSocial: { contains: search as string } },
        { cnpj: { contains: search as string } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.subEstipulante.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          apolice: {
            select: { id: true, numero: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subEstipulante.count({ where })
    ]);

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
    console.error('Erro ao listar sub estipulantes:', error);
    res.status(500).json({ 
      error: 'Erro ao listar sub estipulantes', 
      details: error.message
    });
  }
});

// GET /sub-estipulantes/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const subEstipulante = await prisma.subEstipulante.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        }
      }
    });

    if (!subEstipulante) {
      return res.status(404).json({ error: 'Sub estipulante não encontrado' });
    }

    res.json(subEstipulante);
  } catch (error: any) {
    console.error('Erro ao buscar sub estipulante:', error);
    res.status(500).json({ error: 'Erro ao buscar sub estipulante', details: error.message });
  }
});

// POST /sub-estipulantes
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const rawData = req.body;
    // Converter string vazia para null antes da validação
    if (rawData.tipo === '') {
      rawData.tipo = null;
    }
    const data = subEstipulanteSchema.parse(rawData);

    // Verificar se a apólice pertence ao tenant
    const apolice = await prisma.apolice.findFirst({
      where: { id: data.apoliceId, tenantId: req.tenantId }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    const createData: any = {
      apoliceId: data.apoliceId,
      codigoEstipulante: data.codigoEstipulante,
      razaoSocial: data.razaoSocial,
      status: data.status || 'ATIVA',
      tenantId: req.tenantId!
    };

    // Adicionar campos opcionais apenas se estiverem presentes
    if (data.cnpj !== undefined && data.cnpj !== null && data.cnpj !== '') {
      createData.cnpj = data.cnpj;
    }
    if (data.codigoCNAE !== undefined && data.codigoCNAE !== null && data.codigoCNAE !== '') {
      createData.codigoCNAE = data.codigoCNAE;
    }
    if (data.ramoAtividade !== undefined && data.ramoAtividade !== null && data.ramoAtividade !== '') {
      createData.ramoAtividade = data.ramoAtividade;
    }
    if (data.inscricaoEstadual !== undefined && data.inscricaoEstadual !== null && data.inscricaoEstadual !== '') {
      createData.inscricaoEstadual = data.inscricaoEstadual;
    }
    if (data.inscricaoMunicipal !== undefined && data.inscricaoMunicipal !== null && data.inscricaoMunicipal !== '') {
      createData.inscricaoMunicipal = data.inscricaoMunicipal;
    }
    if (data.tipo !== undefined && data.tipo !== null) {
      createData.tipo = data.tipo;
    }
    if (data.dataVigenciaContrato !== undefined && data.dataVigenciaContrato !== null && data.dataVigenciaContrato !== '') {
      createData.dataVigenciaContrato = new Date(data.dataVigenciaContrato);
    }
    if (data.dataCancelamento !== undefined && data.dataCancelamento !== null && data.dataCancelamento !== '') {
      createData.dataCancelamento = new Date(data.dataCancelamento);
    }

    console.log('Dados para criar sub estipulante:', JSON.stringify(createData, null, 2));

    const subEstipulante = await prisma.subEstipulante.create({
      data: createData,
      include: {
        apolice: {
          select: { id: true, numero: true }
        }
      }
    });

    res.status(201).json(subEstipulante);
  } catch (error: any) {
    console.error('Erro ao criar sub estipulante:', error);
    console.error('Stack trace:', error.stack);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ 
      error: 'Erro ao criar sub estipulante', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /sub-estipulantes/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const rawData = req.body;
    // Converter string vazia para null antes da validação
    if (rawData.tipo === '') {
      rawData.tipo = null;
    }
    const data = subEstipulanteSchema.parse(rawData);

    const existing = await prisma.subEstipulante.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Sub estipulante não encontrado' });
    }

    // Verificar se a apólice pertence ao tenant (se foi alterada)
    if (data.apoliceId && data.apoliceId !== existing.apoliceId) {
      const apolice = await prisma.apolice.findFirst({
        where: { id: data.apoliceId, tenantId: req.tenantId }
      });

      if (!apolice) {
        return res.status(404).json({ error: 'Apólice não encontrada' });
      }
    }

    const subEstipulante = await prisma.subEstipulante.update({
      where: { id },
      data: {
        apoliceId: data.apoliceId,
        codigoEstipulante: data.codigoEstipulante,
        cnpj: data.cnpj || null,
        razaoSocial: data.razaoSocial,
        codigoCNAE: data.codigoCNAE || null,
        ramoAtividade: data.ramoAtividade || null,
        inscricaoEstadual: data.inscricaoEstadual || null,
        inscricaoMunicipal: data.inscricaoMunicipal || null,
        tipo: data.tipo || null,
        dataVigenciaContrato: data.dataVigenciaContrato && data.dataVigenciaContrato !== '' ? new Date(data.dataVigenciaContrato) : null,
        dataCancelamento: data.dataCancelamento && data.dataCancelamento !== '' ? new Date(data.dataCancelamento) : null,
        status: data.status || 'ATIVA'
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        }
      }
    });

    res.json(subEstipulante);
  } catch (error: any) {
    console.error('Erro ao atualizar sub estipulante:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Erro ao atualizar sub estipulante', details: error.message });
  }
});

// DELETE /sub-estipulantes/:id
router.delete('/:id', requireRole('ADMIN', 'GESTOR'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const subEstipulante = await prisma.subEstipulante.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!subEstipulante) {
      return res.status(404).json({ error: 'Sub estipulante não encontrado' });
    }

    await prisma.subEstipulante.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar sub estipulante' });
  }
});

export { router as subEstipulanteRoutes };

