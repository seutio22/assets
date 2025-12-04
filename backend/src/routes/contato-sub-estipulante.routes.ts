import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { contatoSubEstipulanteSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /contatos-sub-estipulante?subEstipulanteId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { subEstipulanteId, limit = '100', offset = '0' } = req.query;

    const where: any = {
      tenantId: req.tenantId
    };

    if (subEstipulanteId) where.subEstipulanteId = subEstipulanteId;

    const [data, total] = await Promise.all([
      prisma.contatoSubEstipulante.findMany({
        where,
        skip: parseInt(offset as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.contatoSubEstipulante.count({ where })
    ]);

    res.json({ data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error: any) {
    console.error('Erro ao listar contatos:', error);
    res.status(500).json({ error: 'Erro ao listar contatos', details: error.message });
  }
});

// GET /contatos-sub-estipulante/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const contato = await prisma.contatoSubEstipulante.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.json(contato);
  } catch (error: any) {
    console.error('Erro ao buscar contato:', error);
    res.status(500).json({ error: 'Erro ao buscar contato', details: error.message });
  }
});

// POST /contatos-sub-estipulante
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = contatoSubEstipulanteSchema.safeParse(req.body);
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

    const contato = await prisma.contatoSubEstipulante.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any
    });

    res.status(201).json(contato);
  } catch (error: any) {
    console.error('Erro ao criar contato:', error);
    res.status(500).json({ error: 'Erro ao criar contato', details: error.message });
  }
});

// PUT /contatos-sub-estipulante/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const validationResult = contatoSubEstipulanteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      });
    }

    const data = validationResult.data;

    const existing = await prisma.contatoSubEstipulante.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const contato = await prisma.contatoSubEstipulante.update({
      where: { id },
      data
    });

    res.json(contato);
  } catch (error: any) {
    console.error('Erro ao atualizar contato:', error);
    res.status(500).json({ error: 'Erro ao atualizar contato', details: error.message });
  }
});

// DELETE /contatos-sub-estipulante/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const contato = await prisma.contatoSubEstipulante.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    await prisma.contatoSubEstipulante.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar contato:', error);
    res.status(500).json({ error: 'Erro ao deletar contato', details: error.message });
  }
});

export { router as contatoSubEstipulanteRoutes };

