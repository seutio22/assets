import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth.middleware';
import { planoSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /planos
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
        { nomePlano: { contains: search as string } },
        { codANS: { contains: search as string } },
        { codPlano: { contains: search as string } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.plano.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          apolice: {
            select: { id: true, numero: true }
          },
          elegibilidade: {
            select: { id: true, nome: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.plano.count({ where })
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
    console.error('Erro ao listar planos:', error);
    res.status(500).json({ 
      error: 'Erro ao listar planos', 
      details: error.message
    });
  }
});

// GET /planos/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const plano = await prisma.plano.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        },
        reembolsos: true,
        coparticipacoes: true,
        elegibilidade: true
      }
    });

    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    res.json(plano);
  } catch (error: any) {
    console.error('Erro ao buscar plano:', error);
    res.status(500).json({ error: 'Erro ao buscar plano', details: error.message });
  }
});

// POST /planos
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const rawData = req.body;
    // Converter string vazia para null antes da validação
    if (rawData.elegibilidadeId === '') {
      rawData.elegibilidadeId = null;
    }
    const data = planoSchema.parse(rawData);

    // Verificar se a apólice pertence ao tenant
    const apolice = await prisma.apolice.findFirst({
      where: { id: data.apoliceId, tenantId: req.tenantId }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    // Verificar se já existe cobertura para esta apólice (mutuamente exclusivo)
    const existingCobertura = await prisma.cobertura.findFirst({
      where: {
        apoliceId: data.apoliceId,
        tenantId: req.tenantId
      }
    });

    if (existingCobertura) {
      return res.status(400).json({ error: 'Já existe uma cobertura para esta apólice. Plano e Cobertura são mutuamente exclusivos.' });
    }

    const plano = await prisma.plano.create({
      data: {
        apoliceId: data.apoliceId,
        nomePlano: data.nomePlano,
        codANS: data.codANS || null,
        codPlano: data.codPlano || null,
        vidasImplantadas: data.vidasImplantadas || null,
        tipoValorPlano: data.tipoValorPlano || null,
        valorPlano: data.tipoValorPlano === 'custo_medio' ? (data.valorPlano || data.custoMedio || null) : null,
        custoMedio: data.tipoValorPlano === 'custo_medio' ? (data.valorPlano || data.custoMedio || null) : null,
        faixa0a18: data.faixa0a18 || null,
        faixa19a23: data.faixa19a23 || null,
        faixa24a28: data.faixa24a28 || null,
        faixa29a33: data.faixa29a33 || null,
        faixa34a38: data.faixa34a38 || null,
        faixa39a43: data.faixa39a43 || null,
        faixa44a48: data.faixa44a48 || null,
        faixa49a53: data.faixa49a53 || null,
        faixa54a58: data.faixa54a58 || null,
        faixa59ouMais: data.faixa59ouMais || null,
        inicioVigencia: data.inicioVigencia && data.inicioVigencia !== '' ? new Date(data.inicioVigencia) : null,
        fimVigencia: data.fimVigencia && data.fimVigencia !== '' ? new Date(data.fimVigencia) : null,
        upgrade: data.upgrade ?? false,
        downgrade: data.downgrade ?? false,
        liberadoMovimentacao: data.liberadoMovimentacao ?? false,
        elegibilidadeId: data.elegibilidadeId && data.elegibilidadeId !== '' ? data.elegibilidadeId : null,
        reembolso: data.reembolso ?? false,
        coparticipacao: data.coparticipacao ?? false,
        tenantId: req.tenantId!
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        },
        reembolsos: true,
        coparticipacoes: true,
        elegibilidade: true
      }
    });

    res.status(201).json(plano);
  } catch (error: any) {
    console.error('Erro ao criar plano:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ 
      error: 'Erro ao criar plano', 
      details: error.message
    });
  }
});

// PUT /planos/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const rawData = req.body;
    // Converter string vazia para null antes da validação
    if (rawData.elegibilidadeId === '') {
      rawData.elegibilidadeId = null;
    }
    const data = planoSchema.parse(rawData);

    const existing = await prisma.plano.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Plano não encontrado' });
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

    const plano = await prisma.plano.update({
      where: { id },
      data: {
        apoliceId: data.apoliceId,
        nomePlano: data.nomePlano,
        codANS: data.codANS || null,
        codPlano: data.codPlano || null,
        vidasImplantadas: data.vidasImplantadas || null,
        tipoValorPlano: data.tipoValorPlano || null,
        valorPlano: data.tipoValorPlano === 'custo_medio' ? (data.valorPlano || data.custoMedio || null) : null,
        custoMedio: data.tipoValorPlano === 'custo_medio' ? (data.valorPlano || data.custoMedio || null) : null,
        faixa0a18: data.faixa0a18 || null,
        faixa19a23: data.faixa19a23 || null,
        faixa24a28: data.faixa24a28 || null,
        faixa29a33: data.faixa29a33 || null,
        faixa34a38: data.faixa34a38 || null,
        faixa39a43: data.faixa39a43 || null,
        faixa44a48: data.faixa44a48 || null,
        faixa49a53: data.faixa49a53 || null,
        faixa54a58: data.faixa54a58 || null,
        faixa59ouMais: data.faixa59ouMais || null,
        inicioVigencia: data.inicioVigencia && data.inicioVigencia !== '' ? new Date(data.inicioVigencia) : null,
        fimVigencia: data.fimVigencia && data.fimVigencia !== '' ? new Date(data.fimVigencia) : null,
        upgrade: data.upgrade ?? false,
        downgrade: data.downgrade ?? false,
        liberadoMovimentacao: data.liberadoMovimentacao ?? false,
        elegibilidadeId: data.elegibilidadeId && data.elegibilidadeId !== '' ? data.elegibilidadeId : null,
        reembolso: data.reembolso ?? false,
        coparticipacao: data.coparticipacao ?? false
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        },
        reembolsos: true,
        coparticipacoes: true,
        elegibilidade: true
      }
    });

    res.json(plano);
  } catch (error: any) {
    console.error('Erro ao atualizar plano:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Erro ao atualizar plano', details: error.message });
  }
});

// DELETE /planos/:id
router.delete('/:id', requireRole('ADMIN', 'GESTOR'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const plano = await prisma.plano.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    await prisma.plano.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar plano' });
  }
});

export { router as planoRoutes };

