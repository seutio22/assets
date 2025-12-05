import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Configuração do multer para upload de arquivos
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// GET /solicitacoes
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { tipo, status, solicitanteId, search, page = '1', limit = '25' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (tipo) {
      where.tipo = tipo as string;
    }

    if (status) {
      where.status = status as string;
    }

    if (solicitanteId) {
      where.solicitanteId = solicitanteId as string;
    }

    // Busca por texto - busca em múltiplos campos
    if (search && (search as string).trim() !== '') {
      const searchTerm = (search as string).trim();
      
      // Buscar apólices relacionadas que correspondem à busca
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

      // Adicionar condições de busca
      where.OR = [
        { numero: { contains: searchTerm } },
        { descricao: { contains: searchTerm } }
      ];

      // Se encontrou apólices, adicionar ao filtro
      if (apoliceIds.length > 0) {
        where.OR.push({ apoliceId: { in: apoliceIds } });
      }
    }

    // Buscar total para paginação
    const total = await prisma.solicitacao.count({ where });

    // Otimizar: buscar dados básicos primeiro, depois relacionamentos apenas se necessário
    const solicitacoes = await prisma.solicitacao.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        numero: true,
        tipo: true,
        descricao: true,
        nivelUrgencia: true,
        status: true,
        dataAbertura: true,
        prazoDesejado: true,
        observacoes: true,
        solicitanteId: true,
        apoliceId: true,
        placementId: true,
        implantacaoId: true,
        createdAt: true,
        updatedAt: true,
        solicitante: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
        placement: {
          select: {
            id: true,
            numero: true,
            status: true
          }
        },
        implantacao: {
          select: {
            id: true,
            status: true,
            percentualConclusao: true
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
        createdAt: 'desc'
      }
    });

    res.json({
      data: solicitacoes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({ error: 'Erro ao listar solicitações' });
  }
});

// GET /solicitacoes/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const solicitacao = await prisma.solicitacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      },
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
        },
        placement: {
          include: {
            itens: true,
            anexos: true
          }
        },
        implantacao: {
          include: {
            cronogramaItens: true
          }
        },
        anexos: true,
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

// POST /solicitacoes
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      tipo,
      tipoImplantacao,
      solicitanteId,
      apoliceId,
      descricao,
      itensServicos,
      nivelUrgencia,
      observacoes,
      prazoDesejado
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!tipo || !descricao) {
      return res.status(400).json({ error: 'tipo e descricao são obrigatórios' });
    }

    // Validação: Se tipo = IMPLANTACAO, tipoImplantacao é obrigatório
    if (tipo === 'IMPLANTACAO' && !tipoImplantacao) {
      return res.status(400).json({ error: 'tipoImplantacao é obrigatório quando tipo = IMPLANTACAO' });
    }

    // Validação: Se tipoImplantacao = NOMEACAO, apoliceId é obrigatório
    if (tipo === 'IMPLANTACAO' && tipoImplantacao === 'NOMEACAO' && !apoliceId) {
      return res.status(400).json({ error: 'apoliceId é obrigatório quando tipoImplantacao = NOMEACAO' });
    }

    // Verificar se apólice pertence ao tenant (se informada)
    if (apoliceId) {
      const apolice = await prisma.apolice.findFirst({
        where: {
          id: apoliceId,
          tenantId: req.tenantId
        }
      });

      if (!apolice) {
        return res.status(404).json({ error: 'Apólice não encontrada' });
      }
    }

    // Gerar número da solicitação
    const count = await prisma.solicitacao.count({
      where: {
        tenantId: req.tenantId
      }
    });
    const numero = `SOL-${String(count + 1).padStart(6, '0')}`;

    // Determinar status inicial baseado no tipo
    let statusInicial = 'ABERTA';
    if (tipo === 'PLACEMENT') {
      statusInicial = 'ENVIADA_PLACEMENT';
    } else if (tipo === 'IMPLANTACAO') {
      statusInicial = 'ENVIADA_IMPLANTACAO';
    }

    const solicitacao = await prisma.solicitacao.create({
      data: {
        tenantId: req.tenantId!,
        numero: numero,
        tipo: tipo,
        tipoImplantacao: tipoImplantacao || null,
        solicitanteId: solicitanteId || req.userId || null,
        apoliceId: apoliceId || null,
        descricao: descricao,
        itensServicos: itensServicos || null,
        nivelUrgencia: nivelUrgencia || 'MEDIA',
        observacoes: observacoes || null,
        prazoDesejado: prazoDesejado ? new Date(prazoDesejado) : null,
        status: statusInicial
      },
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
    });

    // Criar registro de histórico
    await prisma.historicoSolicitacao.create({
      data: {
        tenantId: req.tenantId!,
        solicitacaoId: solicitacao.id,
        acao: 'CRIADA',
        usuarioId: req.userId || null,
        observacoes: 'Solicitação criada'
      }
    });

    // Se tipo = PLACEMENT, criar Placement automaticamente
    if (tipo === 'PLACEMENT') {
      const placementCount = await prisma.placement.count({
        where: {
          tenantId: req.tenantId
        }
      });
      const placementNumero = `PL-${String(placementCount + 1).padStart(6, '0')}`;

      const placement = await prisma.placement.create({
        data: {
          tenantId: req.tenantId!,
          solicitacaoId: solicitacao.id,
          numero: placementNumero,
          status: 'TRIAGEM',
          solicitanteId: solicitanteId || req.userId || null
        }
      });

      // Atualizar solicitação com placementId
      await prisma.solicitacao.update({
        where: { id: solicitacao.id },
        data: { placementId: placement.id }
      });

      // Criar histórico do placement
      await prisma.historicoPlacement.create({
        data: {
          tenantId: req.tenantId!,
          placementId: placement.id,
          acao: 'CRIADO_TRIAGEM',
          usuarioId: req.userId || null,
          observacoes: 'Placement criado automaticamente da solicitação'
        }
      });
    }

    // Se tipo = IMPLANTACAO, criar Implantação automaticamente
    if (tipo === 'IMPLANTACAO' && apoliceId) {
      const implantacao = await prisma.implantacao.create({
        data: {
          tenantId: req.tenantId!,
          apoliceId: apoliceId,
          solicitacaoId: solicitacao.id,
          status: 'PENDENTE',
          statusTriagem: 'PENDENTE'
        }
      });

      // Atualizar solicitação com implantacaoId
      await prisma.solicitacao.update({
        where: { id: solicitacao.id },
        data: { implantacaoId: implantacao.id }
      });

      // Criar histórico da implantação
      await prisma.historicoImplantacao.create({
        data: {
          tenantId: req.tenantId!,
          implantacaoId: implantacao.id,
          acao: 'CRIADA_TRIAGEM',
          usuarioId: req.userId || null,
          observacoes: 'Implantação criada automaticamente da solicitação'
        }
      });
    }

    res.status(201).json(solicitacao);
  } catch (error: any) {
    console.error('Erro ao criar solicitação:', error);
    res.status(500).json({
      error: 'Erro ao criar solicitação',
      details: error.message
    });
  }
});

// PUT /solicitacoes/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      descricao,
      itensServicos,
      nivelUrgencia,
      observacoes,
      prazoDesejado,
      status
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const solicitacao = await prisma.solicitacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    const dadosAnteriores = JSON.stringify(solicitacao);

    const updated = await prisma.solicitacao.update({
      where: { id: id },
      data: {
        descricao: descricao !== undefined ? descricao : solicitacao.descricao,
        itensServicos: itensServicos !== undefined ? itensServicos : solicitacao.itensServicos,
        nivelUrgencia: nivelUrgencia !== undefined ? nivelUrgencia : solicitacao.nivelUrgencia,
        observacoes: observacoes !== undefined ? observacoes : solicitacao.observacoes,
        prazoDesejado: prazoDesejado !== undefined ? (prazoDesejado ? new Date(prazoDesejado) : null) : solicitacao.prazoDesejado,
        status: status !== undefined ? status : solicitacao.status
      },
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
    });

    // Criar registro de histórico
    await prisma.historicoSolicitacao.create({
      data: {
        tenantId: req.tenantId!,
        solicitacaoId: id,
        acao: 'ATUALIZADA',
        usuarioId: req.userId || null,
        dadosAnteriores: dadosAnteriores,
        dadosNovos: JSON.stringify(updated)
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar solicitação:', error);
    res.status(500).json({
      error: 'Erro ao atualizar solicitação',
      details: error.message
    });
  }
});

// DELETE /solicitacoes/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const solicitacao = await prisma.solicitacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    await prisma.solicitacao.delete({
      where: { id: id }
    });

    res.json({ message: 'Solicitação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir solicitação:', error);
    res.status(500).json({ error: 'Erro ao excluir solicitação' });
  }
});

// GET /solicitacoes/:id/historico
router.get('/:id/historico', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const historico = await prisma.historicoSolicitacao.findMany({
      where: {
        solicitacaoId: id,
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

// POST /solicitacoes/:id/anexos
router.post('/:id/anexos', upload.single('arquivo'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Arquivo não enviado' });
    }

    const solicitacao = await prisma.solicitacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!solicitacao) {
      // Deletar arquivo se solicitação não existe
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    const anexo = await prisma.anexoSolicitacao.create({
      data: {
        tenantId: req.tenantId!,
        solicitacaoId: id,
        nomeArquivo: file.originalname,
        caminhoArquivo: file.path,
        tipoArquivo: file.mimetype,
        tamanho: file.size
      }
    });

    // Criar registro de histórico
    await prisma.historicoSolicitacao.create({
      data: {
        tenantId: req.tenantId!,
        solicitacaoId: id,
        acao: 'ANEXO_ADICIONADO',
        usuarioId: req.userId || null,
        observacoes: `Arquivo anexado: ${file.originalname}`
      }
    });

    res.status(201).json(anexo);
  } catch (error: any) {
    console.error('Erro ao adicionar anexo:', error);
    res.status(500).json({
      error: 'Erro ao adicionar anexo',
      details: error.message
    });
  }
});

export { router as solicitacaoRoutes };

