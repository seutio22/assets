import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /implantacoes
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, chamadoId, status, search, page = '1', limit = '25' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (apoliceId) {
      where.apoliceId = apoliceId as string;
    }

    if (chamadoId) {
      where.chamadoId = chamadoId as string;
    }

    if (status) {
      where.status = status as string;
    }

    // Busca por texto - busca em apólices e empresas relacionadas
    if (search && (search as string).trim() !== '') {
      const searchTerm = (search as string).trim();
      
      // Buscar apólices que correspondem à busca
      const apolicesEncontradas = await prisma.apolice.findMany({
        where: {
          tenantId: req.tenantId,
          OR: [
            { numero: { contains: searchTerm } },
            { empresa: { 
              razaoSocial: { contains: searchTerm } 
            } }
          ]
        },
        select: { id: true },
        take: 100
      });

      const apoliceIds = apolicesEncontradas.map(a => a.id);

      // Buscar chamados que correspondem à busca
      const chamadosEncontrados = await prisma.chamadoImplantacao.findMany({
        where: {
          tenantId: req.tenantId,
          numero: { contains: searchTerm }
        },
        select: { id: true },
        take: 100
      });

      const chamadoIds = chamadosEncontrados.map(c => c.id);

      // Adicionar condições de busca
      where.OR = [];

      if (apoliceIds.length > 0) {
        where.OR.push({ apoliceId: { in: apoliceIds } });
      }

      if (chamadoIds.length > 0) {
        where.OR.push({ chamadoId: { in: chamadoIds } });
      }
    }

    // Buscar total para paginação
    const total = await prisma.implantacao.count({ where });

    // Otimizar: usar select em vez de include para reduzir dados
    const implantacoes = await prisma.implantacao.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        status: true,
        percentualConclusao: true,
        dataInicio: true,
        dataPrevistaFim: true,
        dataFim: true,
        createdAt: true,
        apoliceId: true,
        chamadoId: true,
        apolice: {
          select: {
            id: true,
            numero: true,
            empresa: {
              select: {
                id: true,
                razaoSocial: true,
                cnpj: true
              }
            }
          }
        },
        chamado: {
          select: {
            id: true,
            numero: true,
            titulo: true
          }
        },
        cronogramaItens: {
          select: {
            id: true,
            titulo: true,
            status: true,
            ordem: true
          },
          orderBy: {
            ordem: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      data: implantacoes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar implantações:', error);
    res.status(500).json({ error: 'Erro ao listar implantações' });
  }
});

// GET /implantacoes/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const implantacao = await prisma.implantacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      },
      include: {
        apolice: {
          include: {
            empresa: true
          }
        },
        chamado: true,
        solicitacao: {
          include: {
            solicitante: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        demanda: {
          include: {
            placement: {
              include: {
                solicitacao: true
              }
            }
          }
        },
        cronogramaItens: {
          orderBy: {
            ordem: 'asc'
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

    if (!implantacao) {
      return res.status(404).json({ error: 'Implantação não encontrada' });
    }

    res.json(implantacao);
  } catch (error) {
    console.error('Erro ao buscar implantação:', error);
    res.status(500).json({ error: 'Erro ao buscar implantação' });
  }
});

// POST /implantacoes
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      apoliceId,
      chamadoId,
      responsavelId,
      status,
      dataInicio,
      dataPrevistaFim,
      observacoes,
      dadosApolice
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!apoliceId) {
      return res.status(400).json({ error: 'apoliceId é obrigatório' });
    }

    // Verificar se a apólice pertence ao tenant
    const apolice = await prisma.apolice.findFirst({
      where: {
        id: apoliceId,
        tenantId: req.tenantId
      }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    // Verificar se já existe implantação para esta apólice
    const existing = await prisma.implantacao.findFirst({
      where: {
        apoliceId: apoliceId,
        tenantId: req.tenantId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Já existe uma implantação para esta apólice' });
    }

    const implantacao = await prisma.implantacao.create({
      data: {
        tenantId: req.tenantId!,
        apoliceId: apoliceId,
        chamadoId: chamadoId || null,
        responsavelId: responsavelId || null,
        status: status || 'PENDENTE',
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataPrevistaFim: dataPrevistaFim ? new Date(dataPrevistaFim) : null,
        observacoes: observacoes || null,
        dadosApolice: dadosApolice || null
      },
      include: {
        apolice: {
          include: {
            empresa: true
          }
        },
        chamado: true,
        cronogramaItens: true
      }
    });

    res.status(201).json(implantacao);
  } catch (error: any) {
    console.error('Erro ao criar implantação:', error);
    res.status(500).json({ 
      error: 'Erro ao criar implantação',
      details: error.message 
    });
  }
});

// PUT /implantacoes/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      responsavelId,
      status,
      statusTriagem,
      dataInicio,
      dataFim,
      dataPrevistaFim,
      percentualConclusao,
      observacoes,
      dadosApolice,
      responsavelImplantacao,
      evidencias,
      itensImplantados,
      validacaoDemandante
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const implantacao = await prisma.implantacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!implantacao) {
      return res.status(404).json({ error: 'Implantação não encontrada' });
    }

    const updated = await prisma.implantacao.update({
      where: { id: id },
      data: {
        responsavelId: responsavelId !== undefined ? responsavelId : implantacao.responsavelId,
        status: status !== undefined ? status : implantacao.status,
        statusTriagem: statusTriagem !== undefined ? statusTriagem : implantacao.statusTriagem,
        dataInicio: dataInicio !== undefined ? (dataInicio ? new Date(dataInicio) : null) : implantacao.dataInicio,
        dataFim: dataFim !== undefined ? (dataFim ? new Date(dataFim) : null) : implantacao.dataFim,
        dataPrevistaFim: dataPrevistaFim !== undefined ? (dataPrevistaFim ? new Date(dataPrevistaFim) : null) : implantacao.dataPrevistaFim,
        percentualConclusao: percentualConclusao !== undefined ? percentualConclusao : implantacao.percentualConclusao,
        observacoes: observacoes !== undefined ? observacoes : implantacao.observacoes,
        dadosApolice: dadosApolice !== undefined ? dadosApolice : implantacao.dadosApolice,
        responsavelImplantacao: responsavelImplantacao !== undefined ? responsavelImplantacao : implantacao.responsavelImplantacao,
        evidencias: evidencias !== undefined ? (evidencias ? JSON.stringify(evidencias) : null) : implantacao.evidencias,
        itensImplantados: itensImplantados !== undefined ? (itensImplantados ? JSON.stringify(itensImplantados) : null) : implantacao.itensImplantados,
        validacaoDemandante: validacaoDemandante !== undefined ? validacaoDemandante : implantacao.validacaoDemandante
      },
      include: {
        apolice: {
          include: {
            empresa: true
          }
        },
        chamado: true,
        cronogramaItens: {
          orderBy: {
            ordem: 'asc'
          }
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar implantação:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar implantação',
      details: error.message 
    });
  }
});

// DELETE /implantacoes/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const implantacao = await prisma.implantacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!implantacao) {
      return res.status(404).json({ error: 'Implantação não encontrada' });
    }

    await prisma.implantacao.delete({
      where: { id: id }
    });

    res.json({ message: 'Implantação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir implantação:', error);
    res.status(500).json({ error: 'Erro ao excluir implantação' });
  }
});

// GET /implantacoes/triagem - Listar implantações em triagem
router.get('/triagem', async (req: AuthRequest, res) => {
  try {
    const { statusTriagem, limit = '100' } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId,
      statusTriagem: statusTriagem ? (statusTriagem as string) : 'PENDENTE'
    };

    const implantacoes = await prisma.implantacao.findMany({
      where,
      include: {
        apolice: {
          include: {
            empresa: true
          }
        },
        solicitacao: {
          include: {
            solicitante: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        demanda: {
          include: {
            placement: {
              include: {
                solicitacao: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string)
    });

    res.json({
      data: implantacoes,
      total: implantacoes.length
    });
  } catch (error) {
    console.error('Erro ao listar implantações em triagem:', error);
    res.status(500).json({ error: 'Erro ao listar implantações em triagem' });
  }
});

// PUT /implantacoes/:id/triagem - Ações de triagem (aprovar/rejeitar/solicitar info)
router.put('/:id/triagem', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { acao, observacoes } = req.body; // acao: "APROVAR", "REJEITAR", "SOLICITAR_INFO"

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!acao || !['APROVAR', 'REJEITAR', 'SOLICITAR_INFO'].includes(acao)) {
      return res.status(400).json({ error: 'Ação inválida. Use: APROVAR, REJEITAR ou SOLICITAR_INFO' });
    }

    const implantacao = await prisma.implantacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId,
        statusTriagem: 'PENDENTE'
      }
    });

    if (!implantacao) {
      return res.status(404).json({ error: 'Implantação não encontrada ou não está em triagem' });
    }

    let novoStatusTriagem = implantacao.statusTriagem;
    let novoStatus = implantacao.status;
    let dadosAtualizacao: any = {
      dataTriagem: new Date(),
      gestorTriagemId: req.userId
    };

    if (acao === 'APROVAR') {
      novoStatusTriagem = 'APROVADO';
      novoStatus = 'EM_ANDAMENTO';
      dadosAtualizacao.statusTriagem = novoStatusTriagem;
      dadosAtualizacao.status = novoStatus;
      dadosAtualizacao.dataInicio = new Date();
    } else if (acao === 'REJEITAR') {
      novoStatusTriagem = 'REJEITADO';
      novoStatus = 'CANCELADA';
      dadosAtualizacao.statusTriagem = novoStatusTriagem;
      dadosAtualizacao.status = novoStatus;
    } else if (acao === 'SOLICITAR_INFO') {
      novoStatusTriagem = 'SOLICITAR_INFO';
      dadosAtualizacao.statusTriagem = novoStatusTriagem;
    }

    dadosAtualizacao.observacoesTriagem = observacoes || null;

    const updated = await prisma.implantacao.update({
      where: { id: id },
      data: dadosAtualizacao,
      include: {
        apolice: {
          include: {
            empresa: true
          }
        },
        solicitacao: true,
        demanda: true
      }
    });

    // Criar histórico
    await prisma.historicoImplantacao.create({
      data: {
        tenantId: req.tenantId!,
        implantacaoId: id,
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

// PUT /implantacoes/:id/finalizar - Finalizar implantação
router.put('/:id/finalizar', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      responsavelImplantacao,
      evidencias,
      itensImplantados,
      validacaoDemandante,
      observacoes
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const implantacao = await prisma.implantacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId,
        status: 'EM_ANDAMENTO'
      }
    });

    if (!implantacao) {
      return res.status(404).json({ error: 'Implantação não encontrada ou não está em andamento' });
    }

    if (!responsavelImplantacao) {
      return res.status(400).json({ error: 'responsavelImplantacao é obrigatório' });
    }

    const updated = await prisma.implantacao.update({
      where: { id: id },
      data: {
        status: 'CONCLUIDA',
        dataConclusao: new Date(),
        dataFim: new Date(),
        percentualConclusao: 100,
        responsavelImplantacao: responsavelImplantacao,
        evidencias: evidencias ? JSON.stringify(evidencias) : null,
        itensImplantados: itensImplantados ? JSON.stringify(itensImplantados) : null,
        validacaoDemandante: validacaoDemandante || 'PENDENTE',
        observacoes: observacoes || implantacao.observacoes
      },
      include: {
        apolice: {
          include: {
            empresa: true
          }
        },
        solicitacao: true,
        demanda: true,
        cronogramaItens: true
      }
    });

    // Criar histórico
    await prisma.historicoImplantacao.create({
      data: {
        tenantId: req.tenantId!,
        implantacaoId: id,
        acao: 'CONCLUIDO',
        usuarioId: req.userId || null,
        observacoes: observacoes || null
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao finalizar implantação:', error);
    res.status(500).json({
      error: 'Erro ao finalizar implantação',
      details: error.message
    });
  }
});

// GET /implantacoes/:id/historico - Histórico da implantação
router.get('/:id/historico', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const historico = await prisma.historicoImplantacao.findMany({
      where: {
        implantacaoId: id,
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

export { router as implantacaoRoutes };

