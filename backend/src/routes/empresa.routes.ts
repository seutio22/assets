import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const empresaSchema = z.object({
  grupoEconomicoId: z.string().uuid('ID do grupo econômico inválido'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  razaoSocial: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  dataCadastro: z.string().datetime('Data de cadastro inválida').optional()
});

router.use(authenticateToken);

// GET /empresas
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { page = '1', limit = '10', search = '', grupoEconomicoId } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      tenantId: req.tenantId
    };

    if (grupoEconomicoId) {
      where.grupoEconomicoId = grupoEconomicoId;
    }

    if (search && (search as string).trim() !== '') {
      const searchTerm = (search as string).trim();
      where.OR = [
        { cnpj: { contains: searchTerm } },
        { razaoSocial: { contains: searchTerm } }
      ];
    }

    try {
      const [data, total] = await Promise.all([
      prisma.empresa.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          grupoEconomico: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.empresa.count({ where })
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
      console.error('Erro no banco de dados ao buscar empresas:', dbError);
      console.error('Stack trace:', dbError.stack);
      console.error('Error message:', dbError.message);
      console.error('Error code:', dbError.code);
      throw dbError;
    }
  } catch (error: any) {
    console.error('Erro ao listar empresas:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao listar empresas',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /empresas/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const empresa = await prisma.empresa.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        grupoEconomico: true
      }
    });

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json(empresa);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

// POST /empresas
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = empresaSchema.parse(req.body);

    // Verificar se o grupo econômico pertence ao tenant
    const grupo = await prisma.grupoEconomico.findFirst({
      where: {
        id: data.grupoEconomicoId,
        tenantId: req.tenantId
      }
    });

    if (!grupo) {
      return res.status(404).json({ error: 'Grupo econômico não encontrado' });
    }

    // Verificar se CNPJ já existe no tenant
    const existing = await prisma.empresa.findFirst({
      where: {
        tenantId: req.tenantId,
        cnpj: data.cnpj
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }

    const empresa = await prisma.empresa.create({
      data: {
        ...data,
        dataCadastro: data.dataCadastro ? new Date(data.dataCadastro) : new Date(),
        tenantId: req.tenantId!
      } as any,
      include: {
        grupoEconomico: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(empresa);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

// PUT /empresas/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = empresaSchema.parse(req.body);

    const existing = await prisma.empresa.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Verificar se o grupo econômico pertence ao tenant
    if (data.grupoEconomicoId) {
      const grupo = await prisma.grupoEconomico.findFirst({
        where: {
          id: data.grupoEconomicoId,
          tenantId: req.tenantId
        }
      });

      if (!grupo) {
        return res.status(404).json({ error: 'Grupo econômico não encontrado' });
      }
    }

    // Verificar se CNPJ já existe (se foi alterado)
    if (data.cnpj && data.cnpj !== existing.cnpj) {
      const cnpjExists = await prisma.empresa.findFirst({
        where: {
          tenantId: req.tenantId,
          cnpj: data.cnpj,
          id: { not: id }
        }
      });

      if (cnpjExists) {
        return res.status(400).json({ error: 'CNPJ já cadastrado' });
      }
    }

    const empresa = await prisma.empresa.update({
      where: { id },
      data: {
        ...data,
        dataCadastro: data.dataCadastro ? new Date(data.dataCadastro) : existing.dataCadastro
      },
      include: {
        grupoEconomico: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(empresa);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

// DELETE /empresas/:id
router.delete('/:id', requireRole('ADMIN', 'GESTOR'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const empresa = await prisma.empresa.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    await prisma.empresa.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    res.status(500).json({ error: 'Erro ao deletar empresa' });
  }
});

export { router as empresaRoutes };

