import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { enderecoSubEstipulanteSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /enderecos-sub-estipulante?subEstipulanteId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { subEstipulanteId, limit = '100', offset = '0' } = req.query;

    const where: any = {
      tenantId: req.tenantId
    };

    if (subEstipulanteId) where.subEstipulanteId = subEstipulanteId;

    const [data, total] = await Promise.all([
      prisma.enderecoSubEstipulante.findMany({
        where,
        skip: parseInt(offset as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.enderecoSubEstipulante.count({ where })
    ]);

    res.json({ data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Erro ao listar endereços:', error);
    res.status(500).json({ error: 'Erro ao listar endereços', details: error.message });
  }
});

// GET /enderecos-sub-estipulante/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.enderecoSubEstipulante.findFirst({
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

// POST /enderecos-sub-estipulante
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = enderecoSubEstipulanteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      });
    }

    const data = validationResult.data;

    const subEstipulante = await prisma.subEstipulante.findFirst({
      where: {
        id: data.subEstipulanteId,
        tenantId: req.tenantId
      }
    });

    if (!subEstipulante) {
      return res.status(404).json({ error: 'Sub Estipulante não encontrado' });
    }

    const endereco = await prisma.enderecoSubEstipulante.create({
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

// PUT /enderecos-sub-estipulante/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const validationResult = enderecoSubEstipulanteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      });
    }

    const data = validationResult.data;

    const existing = await prisma.enderecoSubEstipulante.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    const endereco = await prisma.enderecoSubEstipulante.update({
      where: { id },
      data
    });

    res.json(endereco);
  } catch (error: any) {
    console.error('Erro ao atualizar endereço:', error);
    res.status(500).json({ error: 'Erro ao atualizar endereço', details: error.message });
  }
});

// DELETE /enderecos-sub-estipulante/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.enderecoSubEstipulante.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!endereco) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    await prisma.enderecoSubEstipulante.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar endereço:', error);
    res.status(500).json({ error: 'Erro ao deletar endereço', details: error.message });
  }
});

export { router as enderecoSubEstipulanteRoutes };

