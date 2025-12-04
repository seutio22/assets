import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// ============================================
// PLACEMENT - GESTÃO (Kanban)
// ============================================

// GET /placements/gestao - Listar placements por status (Kanban)
router.get('/gestao', async (req: AuthRequest, res) => {
  try {
    const { status, gestorId, solicitanteId, limit = '100' } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (status) {
      where.status = status as string;
    } else {
      // Se não especificar status, retornar todos os status do Kanban
      where.status = {
        in: ['TRIAGEM', 'EM_ANDAMENTO', 'ENTREGUE']
      };
    }

    if (gestorId) {
      where.gestorId = gestorId as string;
    }

    if (solicitanteId) {
      where.solicitanteId = solicitanteId as string;
    }

    const placements = await prisma.placement.findMany({
      where,
      include: {
        solicitacao: {
          include: {
            solicitante: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            apolice: {
              include: {
                empresa: true
              }
            }
          }
        },
        gestor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        analista: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        solicitante: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        itens: true,
        _count: {
          select: {
            anexos: true,
            historico: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string)
    });

    res.json({
      data: placements,
      total: placements.length
    });
  } catch (error) {
    console.error('Erro ao listar placements (Gestão):', error);
    res.status(500).json({ error: 'Erro ao listar placements' });
  }
});

// GET /placements/gestao/:id - Buscar placement específico
router.get('/gestao/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const placement = await prisma.placement.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      },
      include: {
        solicitacao: {
          include: {
            solicitante: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            apolice: {
              include: {
                empresa: true,
                fornecedor: true
              }
            }
          }
        },
        gestor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        analista: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        solicitante: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        itens: {
          orderBy: {
            createdAt: 'asc'
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

    if (!placement) {
      return res.status(404).json({ error: 'Placement não encontrado' });
    }

    res.json(placement);
  } catch (error) {
    console.error('Erro ao buscar placement:', error);
    res.status(500).json({ error: 'Erro ao buscar placement' });
  }
});

// PUT /placements/gestao/:id/triagem - Ações de triagem (aprovar/rejeitar/solicitar info)
router.put('/gestao/:id/triagem', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { acao, observacoes } = req.body; // acao: "APROVAR", "REJEITAR", "SOLICITAR_INFO"

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!acao || !['APROVAR', 'REJEITAR', 'SOLICITAR_INFO'].includes(acao)) {
      return res.status(400).json({ error: 'Ação inválida. Use: APROVAR, REJEITAR ou SOLICITAR_INFO' });
    }

    const placement = await prisma.placement.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId,
        status: 'TRIAGEM'
      }
    });

    if (!placement) {
      return res.status(404).json({ error: 'Placement não encontrado ou não está em triagem' });
    }

    let novoStatus = placement.status;
    let dadosAtualizacao: any = {
      dataTriagem: new Date()
    };

    if (acao === 'APROVAR') {
      novoStatus = 'EM_ANDAMENTO';
      dadosAtualizacao.status = novoStatus;
      dadosAtualizacao.gestorId = req.userId;
    } else if (acao === 'REJEITAR') {
      novoStatus = 'REJEITADO';
      dadosAtualizacao.status = novoStatus;
      dadosAtualizacao.gestorId = req.userId;
    }
    // SOLICITAR_INFO mantém status TRIAGEM

    const updated = await prisma.placement.update({
      where: { id: id },
      data: dadosAtualizacao,
      include: {
        solicitacao: true,
        gestor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Criar histórico
    await prisma.historicoPlacement.create({
      data: {
        tenantId: req.tenantId!,
        placementId: id,
        acao: acao === 'APROVAR' ? 'APROVADO_TRIAGEM' : acao === 'REJEITAR' ? 'REJEITADO_TRIAGEM' : 'SOLICITAR_INFO_TRIAGEM',
        usuarioId: req.userId || null,
        observacoes: observacoes || null
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao processar triagem:', error);
    res.status(500).json({
      error: 'Erro ao processar triagem',
      details: error.message
    });
  }
});

// PUT /placements/gestao/:id/entregue - Ações de entrega (aprovar/repique)
router.put('/gestao/:id/entregue', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { acao, observacoes } = req.body; // acao: "APROVAR", "REPIQUE"

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!acao || !['APROVAR', 'REPIQUE'].includes(acao)) {
      return res.status(400).json({ error: 'Ação inválida. Use: APROVAR ou REPIQUE' });
    }

    const placement = await prisma.placement.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId,
        status: 'ENTREGUE'
      }
    });

    if (!placement) {
      return res.status(404).json({ error: 'Placement não encontrado ou não está entregue' });
    }

    let novoStatus = placement.status;
    let dadosAtualizacao: any = {};

    if (acao === 'APROVAR') {
      // Fechar placement e criar demanda
      novoStatus = 'FECHADO';
      dadosAtualizacao.status = novoStatus;
      dadosAtualizacao.dataFechamento = new Date();
      dadosAtualizacao.responsavelFechamento = req.userId || 'Sistema';
      dadosAtualizacao.observacoesFechamento = observacoes || null;

      // Buscar itens do placement
      const itens = await prisma.itemPlacement.findMany({
        where: {
          placementId: id,
          tenantId: req.tenantId
        }
      });

      // Buscar histórico do placement
      const historico = await prisma.historicoPlacement.findMany({
        where: {
          placementId: id,
          tenantId: req.tenantId
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Criar demanda
      const demanda = await prisma.demanda.create({
        data: {
          tenantId: req.tenantId!,
          placementId: id,
          status: 'FECHADO',
          dataFechamento: new Date(),
          responsavelFechamento: req.userId || 'Sistema',
          observacoesEncerramento: observacoes || null,
          itensFinais: JSON.stringify(itens),
          logsEtapas: JSON.stringify(historico)
        }
      });

      // Criar implantação automaticamente
      const solicitacao = await prisma.solicitacao.findFirst({
        where: {
          placementId: id,
          tenantId: req.tenantId
        },
        include: {
          apolice: true
        }
      });

      if (solicitacao && solicitacao.apoliceId) {
        const implantacao = await prisma.implantacao.create({
          data: {
            tenantId: req.tenantId!,
            apoliceId: solicitacao.apoliceId,
            demandaId: demanda.id,
            status: 'PENDENTE',
            statusTriagem: 'PENDENTE'
          }
        });

        // Criar histórico da implantação
        await prisma.historicoImplantacao.create({
          data: {
            tenantId: req.tenantId!,
            implantacaoId: implantacao.id,
            acao: 'CRIADA_DEMANDA',
            usuarioId: req.userId || null,
            observacoes: 'Implantação criada automaticamente da demanda fechada'
          }
        });
      }
    } else if (acao === 'REPIQUE') {
      // Retornar para Fila de Processos - Entrada
      novoStatus = 'EM_ANDAMENTO';
      dadosAtualizacao.status = novoStatus;
      dadosAtualizacao.analistaId = null; // Remove analista para voltar à fila
    }

    const updated = await prisma.placement.update({
      where: { id: id },
      data: dadosAtualizacao,
      include: {
        solicitacao: true
      }
    });

    // Criar histórico
    await prisma.historicoPlacement.create({
      data: {
        tenantId: req.tenantId!,
        placementId: id,
        acao: acao === 'APROVAR' ? 'APROVADO_SOLICITANTE' : 'REPIQUE',
        usuarioId: req.userId || null,
        observacoes: observacoes || null
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao processar entrega:', error);
    res.status(500).json({
      error: 'Erro ao processar entrega',
      details: error.message
    });
  }
});

// GET /placements/gestao/:id/historico - Histórico do placement
router.get('/gestao/:id/historico', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const historico = await prisma.historicoPlacement.findMany({
      where: {
        placementId: id,
        tenantId: req.tenantId
      },
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
    });

    res.json({
      data: historico,
      total: historico.length
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// ============================================
// PLACEMENT - FILA DE PROCESSOS
// ============================================

// GET /placements/fila - Listar fila (Entrada/Em Andamento)
router.get('/fila', async (req: AuthRequest, res) => {
  try {
    const { status, analistaId, limit = '100' } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (status) {
      where.status = status as string;
    } else {
      // Status da fila: EM_ANDAMENTO (com ou sem analista)
      where.status = 'EM_ANDAMENTO';
    }

    if (analistaId) {
      where.analistaId = analistaId as string;
    }

    const placements = await prisma.placement.findMany({
      where,
      include: {
        solicitacao: {
          include: {
            solicitante: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            apolice: {
              include: {
                empresa: true
              }
            }
          }
        },
        analista: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        itens: true,
        _count: {
          select: {
            anexos: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Mais antigos primeiro
      },
      take: parseInt(limit as string)
    });

    res.json({
      data: placements,
      total: placements.length
    });
  } catch (error) {
    console.error('Erro ao listar fila:', error);
    res.status(500).json({ error: 'Erro ao listar fila' });
  }
});

// POST /placements/fila/:id/assumir - Analista assume processo
router.post('/fila/:id/assumir', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'Usuário não identificado' });
    }

    const placement = await prisma.placement.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId,
        status: 'EM_ANDAMENTO'
      }
    });

    if (!placement) {
      return res.status(404).json({ error: 'Placement não encontrado ou não está disponível' });
    }

    // Verificar se já está atribuído a outro analista
    if (placement.analistaId && placement.analistaId !== req.userId) {
      return res.status(400).json({ error: 'Placement já está atribuído a outro analista' });
    }

    const updated = await prisma.placement.update({
      where: { id: id },
      data: {
        analistaId: req.userId,
        dataInicio: placement.dataInicio || new Date()
      },
      include: {
        analista: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        solicitacao: true
      }
    });

    // Criar histórico
    await prisma.historicoPlacement.create({
      data: {
        tenantId: req.tenantId!,
        placementId: id,
        acao: 'ASSUMIDO_ANALISTA',
        usuarioId: req.userId,
        observacoes: 'Analista assumiu o processo'
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao assumir processo:', error);
    res.status(500).json({
      error: 'Erro ao assumir processo',
      details: error.message
    });
  }
});

// PUT /placements/fila/:id/finalizar - Finalizar cotação
router.put('/fila/:id/finalizar', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { itensFinais, observacoes } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const placement = await prisma.placement.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId,
        status: 'EM_ANDAMENTO',
        analistaId: req.userId // Só o analista responsável pode finalizar
      }
    });

    if (!placement) {
      return res.status(404).json({ error: 'Placement não encontrado ou você não é o analista responsável' });
    }

    const updated = await prisma.placement.update({
      where: { id: id },
      data: {
        status: 'ENTREGUE',
        dataEntrega: new Date(),
        itensFinais: itensFinais ? JSON.stringify(itensFinais) : placement.itensFinais,
        observacoesFechamento: observacoes || placement.observacoesFechamento
      },
      include: {
        analista: {
          select: {
            id: true,
            name: true
          }
        },
        solicitacao: true
      }
    });

    // Criar histórico
    await prisma.historicoPlacement.create({
      data: {
        tenantId: req.tenantId!,
        placementId: id,
        acao: 'ENTREGUE',
        usuarioId: req.userId || null,
        observacoes: observacoes || null
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao finalizar cotação:', error);
    res.status(500).json({
      error: 'Erro ao finalizar cotação',
      details: error.message
    });
  }
});

// ============================================
// PLACEMENT - DEMANDAS
// ============================================

// GET /placements/demandas - Listar demandas
router.get('/demandas', async (req: AuthRequest, res) => {
  try {
    const { status, limit = '100' } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (status) {
      where.status = status as string;
    }

    const demandas = await prisma.demanda.findMany({
      where,
      include: {
        placement: {
          include: {
            solicitacao: {
              include: {
                solicitante: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                },
                apolice: {
                  include: {
                    empresa: true
                  }
                }
              }
            }
          }
        },
        implantacao: {
          select: {
            id: true,
            status: true,
            percentualConclusao: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string)
    });

    res.json({
      data: demandas,
      total: demandas.length
    });
  } catch (error) {
    console.error('Erro ao listar demandas:', error);
    res.status(500).json({ error: 'Erro ao listar demandas' });
  }
});

// GET /placements/demandas/:id - Buscar demanda específica
router.get('/demandas/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const demanda = await prisma.demanda.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      },
      include: {
        placement: {
          include: {
            solicitacao: {
              include: {
                solicitante: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                },
                apolice: {
                  include: {
                    empresa: true,
                    fornecedor: true
                  }
                }
              }
            },
            itens: true,
            anexos: true,
            historico: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        },
        implantacao: {
          include: {
            cronogramaItens: true
          }
        }
      }
    });

    if (!demanda) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }

    res.json(demanda);
  } catch (error) {
    console.error('Erro ao buscar demanda:', error);
    res.status(500).json({ error: 'Erro ao buscar demanda' });
  }
});

// POST /placements/demandas/:id/fechar - Fechar demanda (já implementado no endpoint de entrega)
// Este endpoint é redundante, mas mantido para compatibilidade
router.post('/demandas/:id/fechar', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { responsavelFechamento, observacoesEncerramento, itensFinais, anexosFinais } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const demanda = await prisma.demanda.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!demanda) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }

    if (demanda.status !== 'FECHADO') {
      return res.status(400).json({ error: 'Demanda já está fechada ou não pode ser fechada' });
    }

    const updated = await prisma.demanda.update({
      where: { id: id },
      data: {
        responsavelFechamento: responsavelFechamento || demanda.responsavelFechamento,
        observacoesEncerramento: observacoesEncerramento || demanda.observacoesEncerramento,
        itensFinais: itensFinais ? JSON.stringify(itensFinais) : demanda.itensFinais,
        anexosFinais: anexosFinais ? JSON.stringify(anexosFinais) : demanda.anexosFinais
      },
      include: {
        placement: true,
        implantacao: true
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao fechar demanda:', error);
    res.status(500).json({
      error: 'Erro ao fechar demanda',
      details: error.message
    });
  }
});

export { router as placementRoutes };

