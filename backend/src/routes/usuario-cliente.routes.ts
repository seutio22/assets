import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /usuarios-cliente - Listar usuários do portal
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, subEstipulanteId, ativo, limit = '100' } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (ativo !== undefined) {
      where.ativo = ativo === 'true';
    }

    // Buscar usuários com relacionamentos de forma mais segura
    const usuarios = await prisma.usuarioCliente.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        telefone: true,
        ativo: true,
        ultimoAcesso: true,
        createdAt: true,
        updatedAt: true,
        criador: {
          select: {
            id: true,
            name: true,
            email: true
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
                apolice: {
                  select: {
                    id: true,
                    numero: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            solicitacoesAtendimento: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string)
    });

    // Filtrar por apólice se especificado
    let filtered = usuarios;
    if (apoliceId) {
      filtered = usuarios.filter(u => 
        u.apolices && u.apolices.some(ua => ua.apoliceId === apoliceId)
      );
    }

    // Filtrar por sub-estipulante se especificado
    if (subEstipulanteId) {
      filtered = filtered.filter(u => 
        u.subEstipulantes && u.subEstipulantes.some(us => us.subEstipulanteId === subEstipulanteId)
      );
    }

    res.json({
      data: filtered,
      total: filtered.length
    });
  } catch (error: any) {
    console.error('Erro ao listar usuários do portal:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao listar usuários do portal',
      details: error.message 
    });
  }
});

// GET /usuarios-cliente/:id - Detalhes do usuário
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const usuario = await prisma.usuarioCliente.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      },
      include: {
        criador: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
        },
        solicitacoesAtendimento: {
          include: {
            responsavel: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// POST /usuarios-cliente - Criar novo usuário do portal
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      nome,
      email,
      senha,
      cargo,
      telefone,
      apoliceIds,
      subEstipulanteIds
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'nome, email e senha são obrigatórios' });
    }

    // Verificar se email já existe
    const existing = await prisma.usuarioCliente.findFirst({
      where: {
        tenantId: req.tenantId,
        email: email
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar usuário
    const usuario = await prisma.usuarioCliente.create({
      data: {
        tenantId: req.tenantId!,
        nome: nome,
        email: email,
        senha: hashedPassword,
        cargo: cargo || null,
        telefone: telefone || null,
        criadoPor: req.userId || null,
        ativo: true
      },
      include: {
        criador: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Vincular apólices se fornecidas
    if (apoliceIds && Array.isArray(apoliceIds) && apoliceIds.length > 0) {
      await prisma.usuarioClienteApolice.createMany({
        data: apoliceIds.map((apoliceId: string) => ({
          tenantId: req.tenantId!,
          usuarioClienteId: usuario.id,
          apoliceId: apoliceId
        }))
      });
    }

    // Vincular sub-estipulantes se fornecidos
    if (subEstipulanteIds && Array.isArray(subEstipulanteIds) && subEstipulanteIds.length > 0) {
      await prisma.usuarioClienteSubEstipulante.createMany({
        data: subEstipulanteIds.map((subEstipulanteId: string) => ({
          tenantId: req.tenantId!,
          usuarioClienteId: usuario.id,
          subEstipulanteId: subEstipulanteId
        }))
      });
    }

    // Buscar usuário completo com vínculos
    const usuarioCompleto = await prisma.usuarioCliente.findUnique({
      where: { id: usuario.id },
      include: {
        criador: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
              select: {
                id: true,
                codigoEstipulante: true,
                razaoSocial: true,
                apoliceId: true,
                apolice: {
                  select: {
                    id: true,
                    numero: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.status(201).json(usuarioCompleto);
  } catch (error: any) {
    console.error('Erro ao criar usuário do portal:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Erro ao criar usuário do portal',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT /usuarios-cliente/:id - Atualizar usuário
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      cargo,
      telefone,
      ativo
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const usuario = await prisma.usuarioCliente.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se email já existe (se mudou)
    if (email && email !== usuario.email) {
      const existing = await prisma.usuarioCliente.findFirst({
        where: {
          tenantId: req.tenantId,
          email: email,
          id: { not: id }
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
    }

    const updated = await prisma.usuarioCliente.update({
      where: { id: id },
      data: {
        nome: nome !== undefined ? nome : usuario.nome,
        email: email !== undefined ? email : usuario.email,
        cargo: cargo !== undefined ? cargo : usuario.cargo,
        telefone: telefone !== undefined ? telefone : usuario.telefone,
        ativo: ativo !== undefined ? ativo : usuario.ativo
      },
      include: {
        criador: {
          select: {
            id: true,
            name: true
          }
        },
        apolices: {
          include: {
            apolice: {
              include: {
                empresa: true
              }
            }
          }
        },
        subEstipulantes: {
          include: {
            subEstipulante: {
              include: {
                apolice: true
              }
            }
          }
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'Erro ao atualizar usuário',
      details: error.message
    });
  }
});

// DELETE /usuarios-cliente/:id - Desativar/Excluir usuário
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const usuario = await prisma.usuarioCliente.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Desativar ao invés de excluir (soft delete)
    await prisma.usuarioCliente.update({
      where: { id: id },
      data: { ativo: false }
    });

    res.json({ message: 'Usuário desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({ error: 'Erro ao desativar usuário' });
  }
});

// PUT /usuarios-cliente/:id/resetar-senha - Resetar senha
router.put('/:id/resetar-senha', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { novaSenha } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!novaSenha) {
      return res.status(400).json({ error: 'novaSenha é obrigatória' });
    }

    const usuario = await prisma.usuarioCliente.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await prisma.usuarioCliente.update({
      where: { id: id },
      data: { senha: hashedPassword }
    });

    res.json({ message: 'Senha resetada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({
      error: 'Erro ao resetar senha',
      details: error.message
    });
  }
});

// POST /usuarios-cliente/:id/apolices - Vincular apólice(s)
router.post('/:id/apolices', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { apoliceIds } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!apoliceIds || !Array.isArray(apoliceIds) || apoliceIds.length === 0) {
      return res.status(400).json({ error: 'apoliceIds é obrigatório e deve ser um array' });
    }

    const usuario = await prisma.usuarioCliente.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se apólices pertencem ao tenant
    const apolices = await prisma.apolice.findMany({
      where: {
        id: { in: apoliceIds },
        tenantId: req.tenantId
      }
    });

    if (apolices.length !== apoliceIds.length) {
      return res.status(400).json({ error: 'Uma ou mais apólices não foram encontradas' });
    }

    // Criar vínculos (ignorar duplicatas)
    const vinculos = apoliceIds.map((apoliceId: string) => ({
      tenantId: req.tenantId!,
      usuarioClienteId: id,
      apoliceId: apoliceId
    }));

    await prisma.usuarioClienteApolice.createMany({
      data: vinculos,
      skipDuplicates: true
    });

    // Buscar usuário atualizado
    const usuarioAtualizado = await prisma.usuarioCliente.findUnique({
      where: { id: id },
      include: {
        apolices: {
          include: {
            apolice: {
              include: {
                empresa: true
              }
            }
          }
        }
      }
    });

    res.json(usuarioAtualizado);
  } catch (error: any) {
    console.error('Erro ao vincular apólices:', error);
    res.status(500).json({
      error: 'Erro ao vincular apólices',
      details: error.message
    });
  }
});

// DELETE /usuarios-cliente/:id/apolices/:apoliceId - Desvincular apólice
router.delete('/:id/apolices/:apoliceId', async (req: AuthRequest, res) => {
  try {
    const { id, apoliceId } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const vinculo = await prisma.usuarioClienteApolice.findFirst({
      where: {
        usuarioClienteId: id,
        apoliceId: apoliceId,
        tenantId: req.tenantId
      }
    });

    if (!vinculo) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    await prisma.usuarioClienteApolice.delete({
      where: { id: vinculo.id }
    });

    res.json({ message: 'Apólice desvinculada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desvincular apólice:', error);
    res.status(500).json({
      error: 'Erro ao desvincular apólice',
      details: error.message
    });
  }
});

// POST /usuarios-cliente/:id/sub-estipulantes - Vincular sub-estipulante(s)
router.post('/:id/sub-estipulantes', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { subEstipulanteIds } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!subEstipulanteIds || !Array.isArray(subEstipulanteIds) || subEstipulanteIds.length === 0) {
      return res.status(400).json({ error: 'subEstipulanteIds é obrigatório e deve ser um array' });
    }

    const usuario = await prisma.usuarioCliente.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se sub-estipulantes pertencem ao tenant
    const subEstipulantes = await prisma.subEstipulante.findMany({
      where: {
        id: { in: subEstipulanteIds },
        tenantId: req.tenantId
      }
    });

    if (subEstipulantes.length !== subEstipulanteIds.length) {
      return res.status(400).json({ error: 'Um ou mais sub-estipulantes não foram encontrados' });
    }

    // Criar vínculos (ignorar duplicatas)
    const vinculos = subEstipulanteIds.map((subEstipulanteId: string) => ({
      tenantId: req.tenantId!,
      usuarioClienteId: id,
      subEstipulanteId: subEstipulanteId
    }));

    await prisma.usuarioClienteSubEstipulante.createMany({
      data: vinculos,
      skipDuplicates: true
    });

    // Buscar usuário atualizado
    const usuarioAtualizado = await prisma.usuarioCliente.findUnique({
      where: { id: id },
      include: {
        subEstipulantes: {
          include: {
            subEstipulante: {
              include: {
                apolice: {
                  include: {
                    empresa: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json(usuarioAtualizado);
  } catch (error: any) {
    console.error('Erro ao vincular sub-estipulantes:', error);
    res.status(500).json({
      error: 'Erro ao vincular sub-estipulantes',
      details: error.message
    });
  }
});

// DELETE /usuarios-cliente/:id/sub-estipulantes/:subEstipulanteId - Desvincular sub-estipulante
router.delete('/:id/sub-estipulantes/:subEstipulanteId', async (req: AuthRequest, res) => {
  try {
    const { id, subEstipulanteId } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const vinculo = await prisma.usuarioClienteSubEstipulante.findFirst({
      where: {
        usuarioClienteId: id,
        subEstipulanteId: subEstipulanteId,
        tenantId: req.tenantId
      }
    });

    if (!vinculo) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    await prisma.usuarioClienteSubEstipulante.delete({
      where: { id: vinculo.id }
    });

    res.json({ message: 'Sub-estipulante desvinculado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desvincular sub-estipulante:', error);
    res.status(500).json({
      error: 'Erro ao desvincular sub-estipulante',
      details: error.message
    });
  }
});

export { router as usuarioClienteRoutes };

