import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireRole } from '../middlewares/auth.middleware';
import { configuracaoCampoSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /configuracoes-campos?moduloId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { moduloId } = req.query;

    const where: any = {
      tenantId: req.tenantId
    };

    if (moduloId) where.moduloId = moduloId;

    const configuracoes = await prisma.configuracaoCampo.findMany({
      where,
      include: {
        dados: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' }
        },
        modulo: {
          select: {
            id: true,
            nome: true,
            descricao: true
          }
        }
      },
      orderBy: {
        nome: 'asc'
      }
    });

    res.json({ data: configuracoes });
  } catch (error: any) {
    console.error('Erro ao listar configurações:', error);
    res.status(500).json({ error: 'Erro ao listar configurações', details: error.message });
  }
});

// GET /configuracoes-campos/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { id } = req.params;

    const configuracao = await prisma.configuracaoCampo.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        dados: {
          orderBy: { ordem: 'asc' }
        },
        modulo: true
      }
    });

    if (!configuracao) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    res.json(configuracao);
  } catch (error: any) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({ error: 'Erro ao buscar configuração', details: error.message });
  }
});

// POST /configuracoes-campos (apenas ADMIN)
router.post('/', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = configuracaoCampoSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Verificar se já existe configuração com mesmo nome no módulo
    const existing = await prisma.configuracaoCampo.findFirst({
      where: {
        tenantId: req.tenantId,
        moduloId: data.moduloId,
        nome: data.nome
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Já existe uma configuração com este nome neste módulo' });
    }

    const configuracao = await prisma.configuracaoCampo.create({
      data: {
        ...data,
        tenantId: req.tenantId
      } as any,
      include: {
        dados: true,
        modulo: true
      }
    });

    res.status(201).json(configuracao);
  } catch (error: any) {
    console.error('Erro ao criar configuração:', error);
    res.status(500).json({ error: 'Erro ao criar configuração', details: error.message });
  }
});

// PUT /configuracoes-campos/:id (apenas ADMIN)
router.put('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { id } = req.params;
    const validationResult = configuracaoCampoSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Verificar se a configuração existe e pertence ao tenant
    const existing = await prisma.configuracaoCampo.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    // Verificar se já existe outra configuração com mesmo nome no módulo
    const duplicate = await prisma.configuracaoCampo.findFirst({
      where: {
        tenantId: req.tenantId,
        moduloId: data.moduloId,
        nome: data.nome,
        id: { not: id }
      }
    });

    if (duplicate) {
      return res.status(400).json({ error: 'Já existe outra configuração com este nome neste módulo' });
    }

    const configuracao = await prisma.configuracaoCampo.update({
      where: { id },
      data,
      include: {
        dados: {
          orderBy: { ordem: 'asc' }
        },
        modulo: true
      }
    });

    res.json(configuracao);
  } catch (error: any) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro ao atualizar configuração', details: error.message });
  }
});

// DELETE /configuracoes-campos/:id (apenas ADMIN)
router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { id } = req.params;

    const existing = await prisma.configuracaoCampo.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    await prisma.configuracaoCampo.delete({
      where: { id }
    });

    res.json({ message: 'Configuração excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir configuração:', error);
    res.status(500).json({ error: 'Erro ao excluir configuração', details: error.message });
  }
});

export { router as configuracaoCampoRoutes };

