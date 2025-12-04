import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { contatoFornecedorSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /contatos-fornecedores/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const contato = await prisma.contatoFornecedor.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.json(contato);
  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    res.status(500).json({ error: 'Erro ao buscar contato' });
  }
});

// GET /contatos-fornecedores?fornecedorId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { fornecedorId } = req.query;

    if (!fornecedorId) {
      return res.status(400).json({ error: 'fornecedorId é obrigatório' });
    }

    const contatos = await prisma.contatoFornecedor.findMany({
      where: {
        fornecedorId: fornecedorId as string,
        tenantId: req.tenantId
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: contatos });
  } catch (error) {
    console.error('Erro ao listar contatos:', error);
    res.status(500).json({ error: 'Erro ao listar contatos' });
  }
});

// POST /contatos-fornecedores
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = contatoFornecedorSchema.parse(req.body);

    const fornecedor = await prisma.fornecedor.findFirst({
      where: {
        id: data.fornecedorId,
        tenantId: req.tenantId
      }
    });

    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    const contato = await prisma.contatoFornecedor.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any
    });

    res.status(201).json(contato);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    console.error('Erro ao criar contato:', error);
    res.status(500).json({ error: 'Erro ao criar contato' });
  }
});

// PUT /contatos-fornecedores/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = contatoFornecedorSchema.parse(req.body);

    const existing = await prisma.contatoFornecedor.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const contato = await prisma.contatoFornecedor.update({
      where: { id },
      data
    });

    res.json(contato);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    console.error('Erro ao atualizar contato:', error);
    res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
});

// DELETE /contatos-fornecedores/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const contato = await prisma.contatoFornecedor.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    await prisma.contatoFornecedor.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar contato:', error);
    res.status(500).json({ error: 'Erro ao deletar contato' });
  }
});

export { router as contatoFornecedorRoutes };

