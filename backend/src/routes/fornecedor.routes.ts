import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth.middleware';
import { fornecedorSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /fornecedores
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { page = '1', limit = '10', search = '', tipo } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      tenantId: req.tenantId
    };

    // Filtro por tipo (FORNECEDOR ou CORRETOR_PARCEIRO)
    if (tipo && (tipo === 'FORNECEDOR' || tipo === 'CORRETOR_PARCEIRO')) {
      where.tipo = tipo;
    }

    if (search && (search as string).trim() !== '') {
      const searchTerm = (search as string).trim();
      where.OR = [
        { razaoSocial: { contains: searchTerm } },
        { nomeFantasia: { contains: searchTerm } },
        { cnpj: { contains: searchTerm } }
      ];
    }

    try {
      // Otimizar: usar select em vez de incluir todos os campos
      const [data, total] = await Promise.all([
        prisma.fornecedor.findMany({
          where,
          skip,
          take: limitNum,
          select: {
            id: true,
            tenantId: true,
            tipo: true,
            cnpj: true,
            registroANS: true,
            razaoSocial: true,
            nomeFantasia: true,
            situacaoOperadora: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.fornecedor.count({ where })
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
    } catch (dbError: any) {
      console.error('Erro no banco de dados ao buscar fornecedores:', dbError);
      console.error('Stack trace:', dbError.stack);
      console.error('Error message:', dbError.message);
      console.error('Error code:', dbError.code);
      throw dbError;
    }
  } catch (error: any) {
    console.error('Erro ao listar fornecedores:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao listar fornecedores',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /fornecedores/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const fornecedor = await prisma.fornecedor.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    res.json(fornecedor);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fornecedor' });
  }
});

// POST /fornecedores
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = fornecedorSchema.parse(req.body);

    const fornecedor = await prisma.fornecedor.create({
      data: {
        ...data,
        tenantId: req.tenantId!
      } as any
    });

    res.status(201).json(fornecedor);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
});

// PUT /fornecedores/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = fornecedorSchema.parse(req.body);

    const existing = await prisma.fornecedor.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    const fornecedor = await prisma.fornecedor.update({
      where: { id },
      data
    });

    res.json(fornecedor);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
  }
});

// DELETE /fornecedores/:id
router.delete('/:id', requireRole('ADMIN', 'GESTOR'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const fornecedor = await prisma.fornecedor.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!fornecedor) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    await prisma.fornecedor.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar fornecedor' });
  }
});

export { router as fornecedorRoutes };

