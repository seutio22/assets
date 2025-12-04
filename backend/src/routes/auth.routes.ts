import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { loginSchema, registerSchema } from '../utils/validation';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();
const prisma = new PrismaClient();

// POST /auth/login
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    console.log('Tentativa de login recebida:', { email: req.body?.email, hasPassword: !!req.body?.password });
    
    const { email, password } = loginSchema.parse(req.body);

    console.log('Tentativa de login para:', email);

    let user;
    try {
      user = await prisma.user.findFirst({
        where: { email },
        include: { tenant: true }
      });
    } catch (dbError: any) {
      console.error('Erro ao buscar usuário no banco:', dbError);
      console.error('Stack trace:', dbError.stack);
      return res.status(500).json({ 
        error: 'Erro ao buscar usuário', 
        details: dbError.message 
      });
    }

    if (!user || !user.active) {
      console.log('Usuário não encontrado ou inativo');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Senha inválida');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role
    });

    console.log('Login bem-sucedido para:', email);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error name:', error.name);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ 
      error: 'Erro ao fazer login',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { tenantName, email, password, name } = registerSchema.parse(req.body);

    // Verificar se email já existe
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: { name: tenantName }
    });

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário admin
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN'
      }
    });

    // Assinatura removida - módulo substituído por "Dados"

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Erro ao registrar' });
  }
});

export { router as authRoutes };

