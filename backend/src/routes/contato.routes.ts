import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const contatoSchema = z.object({
  empresaId: z.string().uuid('ID da empresa inválido'),
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  cargo: z.string().optional(),
  dataNascimento: z.string().optional(),
  ativo: z.boolean().optional(),
  observacoes: z.string().optional()
});

router.use(authenticateToken);

// GET /contatos/:id (deve vir antes de /)
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const contato = await prisma.contato.findFirst({
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
    res.status(500).json({ 
      error: 'Erro ao buscar contato',
      details: error.message 
    });
  }
});

// GET /contatos?empresaId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { empresaId } = req.query;

    if (!empresaId) {
      return res.status(400).json({ error: 'empresaId é obrigatório' });
    }

    const contatos = await prisma.contato.findMany({
      where: {
        empresaId: empresaId as string,
        tenantId: req.tenantId
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: contatos });
  } catch (error: any) {
    console.error('Erro ao listar contatos:', error);
    res.status(500).json({ 
      error: 'Erro ao listar contatos',
      details: error.message 
    });
  }
});

// POST /contatos
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = contatoSchema.parse(req.body);

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

    const createData: any = {
      empresaId: data.empresaId,
      nome: data.nome,
      email: data.email || null,
      telefone: data.telefone || null,
      cargo: data.cargo || null,
      observacoes: data.observacoes || null,
      tenantId: req.tenantId!
    };

    if (data.dataNascimento && data.dataNascimento !== '') {
      createData.dataNascimento = new Date(data.dataNascimento);
    }

    if (data.ativo !== undefined) {
      createData.ativo = data.ativo;
    }

    const contato = await prisma.contato.create({
      data: createData
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

// PUT /contatos/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = contatoSchema.parse(req.body);

    const existing = await prisma.contato.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const updateData: any = {
      nome: data.nome,
      email: data.email || null,
      telefone: data.telefone || null,
      cargo: data.cargo || null,
      observacoes: data.observacoes || null
    };

    if (data.dataNascimento !== undefined) {
      updateData.dataNascimento = data.dataNascimento && data.dataNascimento !== '' 
        ? new Date(data.dataNascimento) 
        : null;
    }

    if (data.ativo !== undefined) {
      updateData.ativo = data.ativo;
    }

    const contato = await prisma.contato.update({
      where: { id },
      data: updateData
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

// DELETE /contatos/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const contato = await prisma.contato.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    await prisma.contato.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar contato:', error);
    res.status(500).json({ error: 'Erro ao deletar contato' });
  }
});

export { router as contatoRoutes };
