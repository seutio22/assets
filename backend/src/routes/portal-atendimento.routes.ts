import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Middleware de autenticação do portal
const authenticatePortal = (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-change-in-production') as any;

    if (decoded.tipo !== 'portal') {
      return res.status(401).json({ error: 'Token inválido para portal' });
    }

    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

router.use(authenticatePortal);

// GET /portal/apolices - Listar apólices do usuário (DEVE VIR ANTES DE /:id)
router.get('/apolices', async (req: any, res) => {
  try {
    const usuario = await prisma.usuarioCliente.findUnique({
      where: { id: req.userId },
      include: {
        apolices: {
          include: {
            apolice: {
              include: {
                empresa: {
                  select: {
                    razaoSocial: true,
                    cnpj: true
                  }
                },
                fornecedor: {
                  select: {
                    razaoSocial: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const apolices = usuario.apolices.map((ua: any) => ua.apolice);

    res.json({
      data: apolices,
      total: apolices.length
    });
  } catch (error) {
    console.error('Erro ao listar apólices:', error);
    res.status(500).json({ error: 'Erro ao listar apólices' });
  }
});

// GET /portal/sub-estipulantes - Listar sub-estipulantes do usuário (DEVE VIR ANTES DE /:id)
router.get('/sub-estipulantes', async (req: any, res) => {
  try {
    const usuario = await prisma.usuarioCliente.findUnique({
      where: { id: req.userId },
      include: {
        subEstipulantes: {
          include: {
            subEstipulante: {
              include: {
                apolice: {
                  include: {
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
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const subEstipulantes = usuario.subEstipulantes.map((us: any) => us.subEstipulante);

    res.json({
      data: subEstipulantes,
      total: subEstipulantes.length
    });
  } catch (error) {
    console.error('Erro ao listar sub-estipulantes:', error);
    res.status(500).json({ error: 'Erro ao listar sub-estipulantes' });
  }
});

// GET /portal/dashboard/stats - Estatísticas agregadas do portal (DEVE VIR ANTES DE /)
router.get('/dashboard/stats', async (req: any, res) => {
  try {
    const usuario = await prisma.usuarioCliente.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        apolices: {
          select: { apoliceId: true }
        },
        subEstipulantes: {
          select: { subEstipulanteId: true }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const apoliceIds = usuario.apolices.map(ua => ua.apoliceId);
    const subEstipulanteIds = usuario.subEstipulantes.map(us => us.subEstipulanteId);

    // Buscar todas as estatísticas em paralelo
    const [totalApolices, totalSubEstipulantes, solicitacoes] = await Promise.all([
      Promise.resolve(apoliceIds.length),
      Promise.resolve(subEstipulanteIds.length),
      prisma.solicitacaoAtendimento.findMany({
        where: {
          usuarioClienteId: req.userId,
          tenantId: req.tenantId
        },
        select: {
          status: true
        }
      })
    ]);

    const solicitacoesAbertas = solicitacoes.filter(s => s.status === 'ABERTA').length;
    const solicitacoesResolvidas = solicitacoes.filter(s => s.status === 'RESOLVIDA' || s.status === 'FECHADA').length;
    const solicitacoesEmAtendimento = solicitacoes.filter(s => s.status === 'EM_ATENDIMENTO').length;

    res.json({
      data: {
        totalApolices,
        totalSubEstipulantes,
        solicitacoesAbertas,
        solicitacoesResolvidas,
        solicitacoesEmAtendimento
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas do portal:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      details: error.message 
    });
  }
});

// GET /portal/atendimento - Listar solicitações do usuário
router.get('/', async (req: any, res) => {
  try {
    const { status, tipo, limit = '50' } = req.query;

    const where: any = {
      usuarioClienteId: req.userId,
      tenantId: req.tenantId
    };

    if (status) {
      where.status = status;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    const solicitacoes = await prisma.solicitacaoAtendimento.findMany({
      where,
      include: {
        apolice: {
          include: {
            empresa: {
              select: {
                razaoSocial: true
              }
            }
          }
        },
        subEstipulante: {
          include: {
            apolice: {
              select: {
                numero: true
              }
            }
          }
        },
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            anexos: true,
            historico: true
          }
        }
      },
      orderBy: {
        dataAbertura: 'desc'
      },
      take: parseInt(limit as string)
    });

    res.json({
      data: solicitacoes,
      total: solicitacoes.length
    });
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({ error: 'Erro ao listar solicitações' });
  }
});

// GET /portal/atendimento/:id - Detalhes da solicitação
router.get('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;

    const solicitacao = await prisma.solicitacaoAtendimento.findFirst({
      where: {
        id: id,
        usuarioClienteId: req.userId,
        tenantId: req.tenantId
      },
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
        },
        subEstipulante: {
          include: {
            apolice: {
              select: {
                numero: true
              }
            }
          }
        },
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        anexos: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        historico: {
          include: {
            usuario: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    res.json(solicitacao);
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error);
    res.status(500).json({ error: 'Erro ao buscar solicitação' });
  }
});

// POST /portal/atendimento - Criar nova solicitação
router.post('/', async (req: any, res) => {
  try {
    const {
      apoliceId,
      subEstipulanteId,
      tipo,
      assunto,
      descricao,
      prioridade
    } = req.body;

    if (!tipo || !assunto || !descricao) {
      return res.status(400).json({ error: 'tipo, assunto e descricao são obrigatórios' });
    }

    // Verificar se usuário tem acesso à apólice/sub-estipulante
    if (apoliceId) {
      const usuario = await prisma.usuarioCliente.findUnique({
        where: { id: req.userId },
        include: {
          apolices: {
            where: {
              apoliceId: apoliceId
            }
          }
        }
      });

      if (!usuario || usuario.apolices.length === 0) {
        return res.status(403).json({ error: 'Você não tem acesso a esta apólice' });
      }
    }

    if (subEstipulanteId) {
      const usuario = await prisma.usuarioCliente.findUnique({
        where: { id: req.userId },
        include: {
          subEstipulantes: {
            where: {
              subEstipulanteId: subEstipulanteId
            }
          }
        }
      });

      if (!usuario || usuario.subEstipulantes.length === 0) {
        return res.status(403).json({ error: 'Você não tem acesso a este sub-estipulante' });
      }
    }

    // Gerar número da solicitação
    const count = await prisma.solicitacaoAtendimento.count({
      where: {
        tenantId: req.tenantId
      }
    });

    const numero = `ATD-${String(count + 1).padStart(6, '0')}`;

    // Criar solicitação
    const solicitacao = await prisma.solicitacaoAtendimento.create({
      data: {
        tenantId: req.tenantId,
        apoliceId: apoliceId || null,
        subEstipulanteId: subEstipulanteId || null,
        usuarioClienteId: req.userId,
        numero: numero,
        tipo: tipo,
        assunto: assunto,
        descricao: descricao,
        prioridade: prioridade || 'MEDIA',
        status: 'ABERTA'
      },
      include: {
        apolice: {
          include: {
            empresa: {
              select: {
                razaoSocial: true
              }
            }
          }
        },
        subEstipulante: {
          include: {
            apolice: {
              select: {
                numero: true
              }
            }
          }
        }
      }
    });

    // Criar histórico
    await prisma.historicoSolicitacaoAtendimento.create({
      data: {
        tenantId: req.tenantId,
        solicitacaoAtendimentoId: solicitacao.id,
        acao: 'ABERTA',
        observacoes: 'Solicitação criada pelo cliente'
      }
    });

    res.status(201).json(solicitacao);
  } catch (error: any) {
    console.error('Erro ao criar solicitação:', error);
    res.status(500).json({
      error: 'Erro ao criar solicitação',
      details: error.message
    });
  }
});

export { router as portalAtendimentoRoutes };

