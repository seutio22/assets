import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { enderecoApoliceSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /enderecos-apolice?apoliceId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, limit = '100', offset = '0' } = req.query;

    const where: any = {
      tenantId: req.tenantId
    };

    if (apoliceId) where.apoliceId = apoliceId;

    const [data, total] = await Promise.all([
      prisma.enderecoApolice.findMany({
        where,
        skip: parseInt(offset as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.enderecoApolice.count({ where })
    ]);

    res.json({ data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Erro ao listar endereços:', error);
    res.status(500).json({ error: 'Erro ao listar endereços', details: error.message });
  }
});

// GET /enderecos-apolice/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.enderecoApolice.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!endereco) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    res.json(endereco);
  } catch (error: any) {
    console.error('Erro ao buscar endereço:', error);
    res.status(500).json({ error: 'Erro ao buscar endereço', details: error.message });
  }
});

// POST /enderecos-apolice
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = enderecoApoliceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      });
    }

    const data = validationResult.data;

    const apolice = await prisma.apolice.findFirst({
      where: {
        id: data.apoliceId,
        tenantId: req.tenantId
      }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    const endereco = await prisma.enderecoApolice.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any
    });

    res.status(201).json(endereco);
  } catch (error: any) {
    console.error('Erro ao criar endereço:', error);
    res.status(500).json({ error: 'Erro ao criar endereço', details: error.message });
  }
});

// PUT /enderecos-apolice/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const validationResult = enderecoApoliceSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      });
    }

    const data = validationResult.data;

    const existing = await prisma.enderecoApolice.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    const endereco = await prisma.enderecoApolice.update({
      where: { id },
      data
    });

    res.json(endereco);
  } catch (error: any) {
    console.error('Erro ao atualizar endereço:', error);
    res.status(500).json({ error: 'Erro ao atualizar endereço', details: error.message });
  }
});

// DELETE /enderecos-apolice/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.enderecoApolice.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!endereco) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    await prisma.enderecoApolice.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar endereço:', error);
    res.status(500).json({ error: 'Erro ao deletar endereço', details: error.message });
  }
});

export { router as enderecoApoliceRoutes };

