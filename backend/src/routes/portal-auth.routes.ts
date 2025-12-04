import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// POST /portal/auth/login - Login do portal
router.post('/login', async (req, res) => {
  try {
    const { email, senha, tenantId } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário do portal
    const usuario = await prisma.usuarioCliente.findFirst({
      where: {
        email: email,
        ativo: true
      },
      include: {
        tenant: true,
        apolices: {
          include: {
            apolice: {
              include: {
                empresa: {
                  select: {
                    razaoSocial: true,
                    cnpj: true
                  }
                }
              }
            }
          }
        },
        subEstipulantes: {
          include: {
            subEstipulante: {
              include: {
                apolice: {
                  select: {
                    numero: true,
                    empresa: {
                      select: {
                        razaoSocial: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar tenant se fornecido
    if (tenantId && usuario.tenantId !== tenantId) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último acesso
    await prisma.usuarioCliente.update({
      where: { id: usuario.id },
      data: { ultimoAcesso: new Date() }
    });

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: usuario.id,
        tenantId: usuario.tenantId,
        email: usuario.email,
        tipo: 'portal'
      },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Preparar dados do usuário (sem senha)
    const { senha: _, ...usuarioSemSenha } = usuario;

    res.json({
      token,
      usuario: usuarioSemSenha
    });
  } catch (error) {
    console.error('Erro no login do portal:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /portal/auth/me - Obter dados do usuário logado
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-change-in-production') as any;

    if (decoded.tipo !== 'portal') {
      return res.status(401).json({ error: 'Token inválido para portal' });
    }

    const usuario = await prisma.usuarioCliente.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        telefone: true,
        ativo: true,
        ultimoAcesso: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true
          }
        },
        apolices: {
          select: {
            id: true,
            apoliceId: true,
            apolice: {
              select: {
                id: true,
                numero: true,
                empresa: {
                  select: {
                    razaoSocial: true,
                    cnpj: true
                  }
                }
              }
            }
          }
        },
        subEstipulantes: {
          select: {
            id: true,
            subEstipulanteId: true,
            subEstipulante: {
              select: {
                id: true,
                codigoEstipulante: true,
                razaoSocial: true,
                apoliceId: true,
                apolice: {
                  select: {
                    numero: true,
                    empresa: {
                      select: {
                        razaoSocial: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

export { router as portalAuthRoutes };

