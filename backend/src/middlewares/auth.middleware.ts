import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache simples para autenticação (TTL: 5 minutos)
const authCache = new Map<string, { user: any; tenant: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export interface AuthRequest extends Request {
  userId?: string;
  tenantId?: string;
  role?: string;
  permissions?: {
    resource: string;
    permission: string;
    hasAccess: boolean;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      tenantId: string;
      role: string;
    };

    // Verificar cache primeiro
    const cacheKey = `${decoded.userId}:${decoded.tenantId}`;
    const cached = authCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      // Usar dados do cache
      req.userId = cached.user.id;
      req.tenantId = cached.tenant.id;
      req.role = cached.user.role;
    } else {
      // Verificar se o usuário ainda existe e está ativo
      try {
        const [user, tenant] = await Promise.all([
          prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, active: true, tenantId: true, role: true }
          }),
          prisma.tenant.findUnique({
            where: { id: decoded.tenantId },
            select: { id: true }
          })
        ]);

        if (!user || !user.active) {
          return res.status(401).json({ error: 'Usuário inválido ou inativo' });
        }

        if (!tenant) {
          return res.status(401).json({ error: 'Tenant inválido' });
        }

        // Armazenar no cache
        authCache.set(cacheKey, {
          user,
          tenant,
          expires: Date.now() + CACHE_TTL
        });

        req.userId = user.id;
        req.tenantId = tenant.id;
        req.role = user.role;
    } catch (dbError: any) {
      console.error('Erro ao verificar usuário/tenant:', dbError);
      return res.status(500).json({ 
        error: 'Erro ao verificar autenticação',
        details: dbError.message 
      });
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return res.status(500).json({ error: 'Erro na autenticação' });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    next();
  };
};

