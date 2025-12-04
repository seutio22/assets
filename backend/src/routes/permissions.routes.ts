import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/permissions.middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// ============================================
// RECURSOS
// ============================================

// GET /permissions/resources - Listar todos os recursos
router.get('/resources', async (req: AuthRequest, res) => {
  try {
    try {
      const recursos = await prisma.resource.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' }
      });

      res.json({ data: recursos });
    } catch (dbError: any) {
      if (dbError.message?.includes('no such table') || dbError.message?.includes('does not exist')) {
        return res.json({ 
          data: [],
          message: 'Sistema de permissões não inicializado. Execute a migration do Prisma.'
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Erro ao listar recursos:', error);
    res.status(500).json({ 
      error: 'Erro ao listar recursos',
      details: error.message
    });
  }
});

// ============================================
// PERMISSÕES
// ============================================

// GET /permissions/permissions - Listar todas as permissões
router.get('/permissions', async (req: AuthRequest, res) => {
  try {
    try {
      const permissoes = await prisma.permission.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' }
      });

      res.json({ data: permissoes });
    } catch (dbError: any) {
      if (dbError.message?.includes('no such table') || dbError.message?.includes('does not exist')) {
        return res.json({ 
          data: [],
          message: 'Sistema de permissões não inicializado. Execute a migration do Prisma.'
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Erro ao listar permissões:', error);
    res.status(500).json({ 
      error: 'Erro ao listar permissões',
      details: error.message
    });
  }
});

// ============================================
// PERFIS (ROLES)
// ============================================

const roleSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean().optional().default(true)
});

// GET /permissions/roles - Listar perfis
router.get('/roles', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    // Verificar se a tabela existe
    try {
      const roles = await prisma.role.findMany({
        where: {
          OR: [
            { tenantId: req.tenantId },
            { tenantId: null } // Roles globais do sistema
          ]
        },
        include: {
          permissions: {
            include: {
              permission: true,
              resource: true
            }
          },
          _count: {
            select: {
              userRoles: true
            }
          }
        },
        orderBy: [
          { tenantId: 'asc' },
          { nome: 'asc' }
        ]
      });

      res.json({ data: roles });
    } catch (dbError: any) {
      // Se a tabela não existe, retornar array vazio e mensagem informativa
      if (dbError.message?.includes('no such table') || dbError.message?.includes('does not exist')) {
        console.warn('Tabelas de permissões não encontradas. Execute a migration: npm run prisma:migrate dev');
        return res.json({ 
          data: [],
          message: 'Sistema de permissões não inicializado. Execute a migration do Prisma.'
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Erro ao listar perfis:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao listar perfis',
      details: error.message,
      message: 'Verifique se as tabelas de permissões foram criadas. Execute: npm run prisma:migrate dev'
    });
  }
});

// GET /permissions/roles/:id - Buscar perfil específico
router.get('/roles/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
            resource: true
          }
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(role);
  } catch (error: any) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// POST /permissions/roles - Criar perfil
router.post('/roles', requirePermission('PERFIS', 'CREATE'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const data = roleSchema.parse(req.body);

    // Verificar se código já existe no tenant
    const existing = await prisma.role.findUnique({
      where: {
        tenantId_codigo: {
          tenantId: req.tenantId,
          codigo: data.codigo
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Código do perfil já existe' });
    }

    const role = await prisma.role.create({
      data: {
        ...data,
        tenantId: req.tenantId,
        isSystem: false
      } as any,
      include: {
        permissions: {
          include: {
            permission: true,
            resource: true
          }
        }
      }
    });

    res.status(201).json(role);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    console.error('Erro ao criar perfil:', error);
    res.status(500).json({ error: 'Erro ao criar perfil' });
  }
});

// PUT /permissions/roles/:id - Atualizar perfil
router.put('/roles/:id', requirePermission('PERFIS', 'UPDATE'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = roleSchema.partial().parse(req.body);

    const existing = await prisma.role.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Não permitir editar roles do sistema
    if (existing.isSystem && data.codigo && data.codigo !== existing.codigo) {
      return res.status(400).json({ error: 'Não é possível alterar código de perfil do sistema' });
    }

    const role = await prisma.role.update({
      where: { id },
      data,
      include: {
        permissions: {
          include: {
            permission: true,
            resource: true
          }
        }
      }
    });

    res.json(role);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// DELETE /permissions/roles/:id - Deletar perfil
router.delete('/roles/:id', requirePermission('PERFIS', 'DELETE'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: true
          }
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Não permitir deletar roles do sistema
    if (existing.isSystem) {
      return res.status(400).json({ error: 'Não é possível deletar perfil do sistema' });
    }

    // Verificar se há usuários usando este perfil
    if (existing._count.userRoles > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar perfil com usuários associados',
        count: existing._count.userRoles
      });
    }

    await prisma.role.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao deletar perfil:', error);
    res.status(500).json({ error: 'Erro ao deletar perfil' });
  }
});

// ============================================
// PERMISSÕES DE PERFIS
// ============================================

const rolePermissionSchema = z.object({
  permissionId: z.string().uuid(),
  resourceId: z.string().uuid().optional().nullable()
});

// GET /permissions/roles/:id/permissions - Listar permissões de um perfil
router.get('/roles/:id/permissions', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
            resource: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json({ data: role.permissions });
  } catch (error: any) {
    console.error('Erro ao listar permissões do perfil:', error);
    res.status(500).json({ error: 'Erro ao listar permissões do perfil' });
  }
});

// POST /permissions/roles/:id/permissions - Adicionar permissão ao perfil
router.post('/roles/:id/permissions', requirePermission('PERFIS', 'UPDATE'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = rolePermissionSchema.parse(req.body);

    const role = await prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Verificar se permissão já existe
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId_resourceId: {
          roleId: id,
          permissionId: data.permissionId,
          resourceId: data.resourceId || ''
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Permissão já existe neste perfil' });
    }

    const rolePermission = await prisma.rolePermission.create({
      data: {
        roleId: id,
        permissionId: data.permissionId,
        resourceId: data.resourceId || null
      },
      include: {
        permission: true,
        resource: true
      }
    });

    res.status(201).json(rolePermission);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    console.error('Erro ao adicionar permissão:', error);
    res.status(500).json({ error: 'Erro ao adicionar permissão' });
  }
});

// DELETE /permissions/roles/:id/permissions/:permissionId - Remover permissão do perfil
router.delete('/roles/:id/permissions/:permissionId', requirePermission('PERFIS', 'UPDATE'), async (req: AuthRequest, res) => {
  try {
    const { id, permissionId } = req.params;
    const { resourceId } = req.query;

    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId_resourceId: {
          roleId: id,
          permissionId: permissionId,
          resourceId: (resourceId as string) || ''
        }
      }
    });

    if (!rolePermission) {
      return res.status(404).json({ error: 'Permissão não encontrada' });
    }

    await prisma.rolePermission.delete({
      where: {
        id: rolePermission.id
      }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao remover permissão:', error);
    res.status(500).json({ error: 'Erro ao remover permissão' });
  }
});

// ============================================
// USUÁRIOS E PERFIS
// ============================================

// GET /permissions/users/:id/roles - Listar perfis de um usuário
router.get('/users/:id/roles', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar se o usuário pode ver este perfil
    if (req.role !== 'ADMIN' && req.userId !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                    resource: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ data: user.roles.map(ur => ur.role) });
  } catch (error: any) {
    console.error('Erro ao listar perfis do usuário:', error);
    res.status(500).json({ error: 'Erro ao listar perfis do usuário' });
  }
});

// POST /permissions/users/:id/roles - Adicionar perfil ao usuário
router.post('/users/:id/roles', requirePermission('USUARIOS', 'UPDATE'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ error: 'roleId é obrigatório' });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se perfil já está atribuído
    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: id,
          roleId: roleId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Perfil já está atribuído ao usuário' });
    }

    const userRole = await prisma.userRole.create({
      data: {
        userId: id,
        roleId: roleId
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
                resource: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(userRole);
  } catch (error: any) {
    console.error('Erro ao adicionar perfil ao usuário:', error);
    res.status(500).json({ error: 'Erro ao adicionar perfil ao usuário' });
  }
});

// DELETE /permissions/users/:id/roles/:roleId - Remover perfil do usuário
router.delete('/users/:id/roles/:roleId', requirePermission('USUARIOS', 'UPDATE'), async (req: AuthRequest, res) => {
  try {
    const { id, roleId } = req.params;

    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: id,
          roleId: roleId
        }
      }
    });

    if (!userRole) {
      return res.status(404).json({ error: 'Perfil não encontrado no usuário' });
    }

    await prisma.userRole.delete({
      where: {
        id: userRole.id
      }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Erro ao remover perfil do usuário:', error);
    res.status(500).json({ error: 'Erro ao remover perfil do usuário' });
  }
});

// ============================================
// PERMISSÕES DO USUÁRIO ATUAL
// ============================================

// GET /permissions/me - Listar permissões do usuário atual
router.get('/me', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                    resource: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Consolidar todas as permissões
    const permissionsMap = new Map<string, Set<string>>();

    for (const userRole of user.roles) {
      for (const rolePermission of userRole.role.permissions) {
        const resourceCodigo = rolePermission.resource?.codigo || 'GLOBAL';
        const permissionCodigo = rolePermission.permission.codigo;

        if (!permissionsMap.has(resourceCodigo)) {
          permissionsMap.set(resourceCodigo, new Set());
        }

        permissionsMap.get(resourceCodigo)!.add(permissionCodigo);
      }
    }

    // Converter para formato de resposta
    const permissions = Array.from(permissionsMap.entries()).map(([resource, perms]) => ({
      resource,
      permissions: Array.from(perms)
    }));

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      roles: user.roles.map(ur => ({
        id: ur.role.id,
        codigo: ur.role.codigo,
        nome: ur.role.nome
      })),
      permissions
    });
  } catch (error: any) {
    console.error('Erro ao listar permissões do usuário:', error);
    res.status(500).json({ error: 'Erro ao listar permissões do usuário' });
  }
});

export { router as permissionsRoutes };

