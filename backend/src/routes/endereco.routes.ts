import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const enderecoSchema = z.object({
  empresaId: z.string().uuid('ID da empresa inválido'),
  tipo: z.string().default('COMERCIAL'),
  logradouro: z.string().min(3, 'Logradouro deve ter no mínimo 3 caracteres'),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(2, 'Cidade deve ter no mínimo 2 caracteres'),
  estado: z.string().min(2, 'Estado deve ter no mínimo 2 caracteres'),
  cep: z.string().optional(),
  observacoes: z.string().optional()
});

router.use(authenticateToken);

// GET /enderecos/:id (deve vir antes de /)
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.endereco.findFirst({
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

// GET /enderecos?empresaId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { empresaId } = req.query;

    if (!empresaId) {
      return res.status(400).json({ error: 'empresaId é obrigatório' });
    }

    const enderecos = await prisma.endereco.findMany({
      where: {
        empresaId: empresaId as string,
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

// POST /enderecos
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = enderecoSchema.parse(req.body);

    // Verificar se a empresa pertence ao tenant
    const empresa = await prisma.empresa.findFirst({
      where: {
        id: data.empresaId,
        tenantId: req.tenantId
      }
    });

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const endereco = await prisma.endereco.create({
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

// PUT /enderecos/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = enderecoSchema.parse(req.body);

    const existing = await prisma.endereco.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    const endereco = await prisma.endereco.update({
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

// DELETE /enderecos/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const endereco = await prisma.endereco.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!endereco) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    await prisma.endereco.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    res.status(500).json({ error: 'Erro ao deletar endereço' });
  }
});

export { router as enderecoRoutes };
