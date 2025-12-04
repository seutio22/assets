import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { enderecoFornecedorSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /enderecos-fornecedores/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.enderecoFornecedor.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!endereco) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    res.json(endereco);
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    res.status(500).json({ error: 'Erro ao buscar endereço' });
  }
});

// GET /enderecos-fornecedores?fornecedorId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { fornecedorId } = req.query;

    if (!fornecedorId) {
      return res.status(400).json({ error: 'fornecedorId é obrigatório' });
    }

    const enderecos = await prisma.enderecoFornecedor.findMany({
      where: {
        fornecedorId: fornecedorId as string,
        tenantId: req.tenantId
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: enderecos });
  } catch (error) {
    console.error('Erro ao listar endereços:', error);
    res.status(500).json({ error: 'Erro ao listar endereços' });
  }
});

// POST /enderecos-fornecedores
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = enderecoFornecedorSchema.parse(req.body);

    const fornecedor = await prisma.fornecedor.findFirst({
      where: {
        id: data.fornecedorId,
        tenantId: req.tenantId
      }
    });

    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    const endereco = await prisma.enderecoFornecedor.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any
    });

    res.status(201).json(endereco);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    console.error('Erro ao criar endereço:', error);
    res.status(500).json({ error: 'Erro ao criar endereço' });
  }
});

// PUT /enderecos-fornecedores/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = enderecoFornecedorSchema.parse(req.body);

    const existing = await prisma.enderecoFornecedor.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    const endereco = await prisma.enderecoFornecedor.update({
      where: { id },
      data
    });

    res.json(endereco);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    console.error('Erro ao atualizar endereço:', error);
    res.status(500).json({ error: 'Erro ao atualizar endereço' });
  }
});

// DELETE /enderecos-fornecedores/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.enderecoFornecedor.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!endereco) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    await prisma.enderecoFornecedor.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    res.status(500).json({ error: 'Erro ao deletar endereço' });
  }
});

export { router as enderecoFornecedorRoutes };

