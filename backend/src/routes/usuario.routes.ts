import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth.middleware';
import { usuarioSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /usuarios (apenas ADMIN)
router.get('/', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    console.log('Buscando usuários para tenant:', req.tenantId);
    
    const usuarios = await prisma.user.findMany({
      where: { tenantId: req.tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Encontrados ${usuarios.length} usuários`);
    res.json({ data: usuarios });
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao listar usuários',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /usuarios/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Usuários podem ver apenas seu próprio perfil, exceto ADMIN
    if (req.role !== 'ADMIN' && req.userId !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const usuario = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// POST /usuarios (apenas ADMIN)
router.post('/', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = usuarioSchema.parse(req.body);

    // Verificar se email já existe no tenant
    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId: req.tenantId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    if (!data.password) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const usuario = await prisma.user.create({
      data: {
        tenantId: req.tenantId!,
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'OPERADOR'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    res.status(201).json(usuario);
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    console.error('Stack trace:', error.stack);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar usuário',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /usuarios/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar permissões
    if (req.role !== 'ADMIN' && req.userId !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Para atualização, senha é opcional
    const updateSchema = usuarioSchema.extend({
      password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional()
    });
    const data = updateSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Apenas ADMIN pode alterar role
    const updateData: any = {
      name: data.name,
      email: data.email
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (req.role === 'ADMIN' && data.role) {
      updateData.role = data.role;
    }

    const usuario = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        updatedAt: true
      }
    });

    res.json(usuario);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// DELETE /usuarios/:id (apenas ADMIN)
router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Não permitir deletar a si mesmo
    if (req.userId === id) {
      return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    }

    const usuario = await prisma.user.findFirst({
      where: { id, tenantId: req.tenantId }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

export { router as usuarioRoutes };

