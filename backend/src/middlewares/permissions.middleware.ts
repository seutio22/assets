import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

const prisma = new PrismaClient();

/**
 * Middleware para verificar se o usuário tem uma permissão específica em um recurso
 * 
 * @param resourceCodigo - Código do recurso (ex: "APOLICES", "USUARIOS")
 * @param permissionCodigo - Código da permissão (ex: "CREATE", "READ", "UPDATE", "DELETE")
 * @returns Middleware function
 */
export const requirePermission = (
  resourceCodigo: string,
  permissionCodigo: string
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId || !req.tenantId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Buscar usuário com seus perfis e permissões
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

      if (!user || !user.active) {
        return res.status(401).json({ error: 'Usuário inválido ou inativo' });
      }

      // Verificar se o usuário tem a permissão necessária
      let hasPermission = false;

      for (const userRole of user.roles) {
        const role = userRole.role;

        // Verificar permissões globais (sem recurso específico)
        const globalPermission = role.permissions.find(
          rp => 
            !rp.resourceId && 
            rp.permission.codigo === permissionCodigo &&
            rp.permission.ativo
        );

        if (globalPermission) {
          hasPermission = true;
          break;
        }

        // Verificar permissão específica do recurso
        const resourcePermission = role.permissions.find(
          rp => 
            rp.resource?.codigo === resourceCodigo &&
            rp.permission.codigo === permissionCodigo &&
            rp.permission.ativo &&
            rp.resource?.ativo
        );

        if (resourcePermission) {
          hasPermission = true;
          break;
        }

        // Verificar permissão MANAGE (acesso total ao recurso)
        const managePermission = role.permissions.find(
          rp => 
            rp.resource?.codigo === resourceCodigo &&
            rp.permission.codigo === 'MANAGE' &&
            rp.permission.ativo &&
            rp.resource?.ativo
        );

        if (managePermission) {
          hasPermission = true;
          break;
        }
      }

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Acesso negado',
          message: `Você não tem permissão para ${permissionCodigo} em ${resourceCodigo}`
        });
      }

      // Adicionar informações de permissão ao request
      req.permissions = {
        resource: resourceCodigo,
        permission: permissionCodigo,
        hasAccess: true
      };

      next();
    } catch (error: any) {
      console.error('Erro ao verificar permissão:', error);
      return res.status(500).json({ error: 'Erro ao verificar permissão' });
    }
  };
};

/**
 * Middleware para verificar múltiplas permissões (OR - pelo menos uma)
 */
export const requireAnyPermission = (
  permissions: Array<{ resource: string; permission: string }>
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId || !req.tenantId) {
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

      if (!user || !user.active) {
        return res.status(401).json({ error: 'Usuário inválido ou inativo' });
      }

      // Verificar se o usuário tem pelo menos uma das permissões
      for (const { resource: resourceCodigo, permission: permissionCodigo } of permissions) {
        let hasPermission = false;

        for (const userRole of user.roles) {
          const role = userRole.role;

          // Verificar permissão específica
          const resourcePermission = role.permissions.find(
            rp => 
              rp.resource?.codigo === resourceCodigo &&
              rp.permission.codigo === permissionCodigo &&
              rp.permission.ativo &&
              rp.resource?.ativo
          );

          if (resourcePermission) {
            hasPermission = true;
            break;
          }

          // Verificar permissão MANAGE
          const managePermission = role.permissions.find(
            rp => 
              rp.resource?.codigo === resourceCodigo &&
              rp.permission.codigo === 'MANAGE' &&
              rp.permission.ativo &&
              rp.resource?.ativo
          );

          if (managePermission) {
            hasPermission = true;
            break;
          }
        }

        if (hasPermission) {
          return next();
        }
      }

      return res.status(403).json({ 
        error: 'Acesso negado',
        message: 'Você não tem nenhuma das permissões necessárias'
      });
    } catch (error: any) {
      console.error('Erro ao verificar permissões:', error);
      return res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
  };
};

/**
 * Função auxiliar para verificar permissão programaticamente
 */
export async function checkPermission(
  userId: string,
  resourceCodigo: string,
  permissionCodigo: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user || !user.active) {
      return false;
    }

    for (const userRole of user.roles) {
      const role = userRole.role;

      // Verificar permissão específica
      const resourcePermission = role.permissions.find(
        rp => 
          rp.resource?.codigo === resourceCodigo &&
          rp.permission.codigo === permissionCodigo &&
          rp.permission.ativo &&
          rp.resource?.ativo
      );

      if (resourcePermission) {
        return true;
      }

      // Verificar permissão MANAGE
      const managePermission = role.permissions.find(
        rp => 
          rp.resource?.codigo === resourceCodigo &&
          rp.permission.codigo === 'MANAGE' &&
          rp.permission.ativo &&
          rp.resource?.ativo
      );

      if (managePermission) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
}

