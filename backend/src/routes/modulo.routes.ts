import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireRole } from '../middlewares/auth.middleware';
import { moduloSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /modulos - Listar todos os módulos
router.get('/', async (req: AuthRequest, res) => {
  try {
    const modulos = await prisma.modulo.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    });

    res.json({ data: modulos });
  } catch (error: any) {
    console.error('Erro ao listar módulos:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao listar módulos', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /modulos/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const modulo = await prisma.modulo.findUnique({
      where: { id },
      include: {
        configuracoes: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!modulo) {
      return res.status(404).json({ error: 'Módulo não encontrado' });
    }

    res.json(modulo);
  } catch (error: any) {
    console.error('Erro ao buscar módulo:', error);
    res.status(500).json({ error: 'Erro ao buscar módulo', details: error.message });
  }
});

// POST /modulos (apenas ADMIN)
router.post('/', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = moduloSchema.parse(req.body);

    const modulo = await prisma.modulo.create({
      data: {
        nome: data.nome || '',
        ativo: data.ativo ?? true,
        descricao: data.descricao || null
      }
    });

    res.status(201).json(modulo);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    console.error('Erro ao criar módulo:', error);
    res.status(500).json({ error: 'Erro ao criar módulo', details: error.message });
  }
});

// PUT /modulos/:id (apenas ADMIN)
router.put('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = moduloSchema.parse(req.body);

    const modulo = await prisma.modulo.update({
      where: { id },
      data
    });

    res.json(modulo);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    console.error('Erro ao atualizar módulo:', error);
    res.status(500).json({ error: 'Erro ao atualizar módulo', details: error.message });
  }
});

// DELETE /modulos/:id (apenas ADMIN)
router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.modulo.delete({
      where: { id }
    });

    res.json({ message: 'Módulo excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir módulo:', error);
    res.status(500).json({ error: 'Erro ao excluir módulo', details: error.message });
  }
});

export { router as moduloRoutes };

