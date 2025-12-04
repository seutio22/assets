import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /cronograma-itens
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { implantacaoId, limit = '100' } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (implantacaoId) {
      where.implantacaoId = implantacaoId as string;
    }

    const itens = await prisma.cronogramaItem.findMany({
      where,
      include: {
        implantacao: {
          include: {
            apolice: {
              include: {
                empresa: true
              }
            }
          }
        }
      },
      orderBy: {
        ordem: 'asc'
      },
      take: parseInt(limit as string)
    });

    res.json({
      data: itens,
      total: itens.length
    });
  } catch (error) {
    console.error('Erro ao listar itens do cronograma:', error);
    res.status(500).json({ error: 'Erro ao listar itens do cronograma' });
  }
});

// GET /cronograma-itens/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const item = await prisma.cronogramaItem.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      },
      include: {
        implantacao: {
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

    if (!item) {
      return res.status(404).json({ error: 'Item do cronograma não encontrado' });
    }

    res.json(item);
  } catch (error) {
    console.error('Erro ao buscar item do cronograma:', error);
    res.status(500).json({ error: 'Erro ao buscar item do cronograma' });
  }
});

// POST /cronograma-itens
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      implantacaoId,
      titulo,
      descricao,
      ordem,
      status,
      dataPrevistaInicio,
      dataPrevistaFim,
      responsavelId,
      observacoes,
      visivelSolicitante
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!implantacaoId || !titulo) {
      return res.status(400).json({ error: 'implantacaoId e titulo são obrigatórios' });
    }

    // Verificar se a implantação pertence ao tenant
    const implantacao = await prisma.implantacao.findFirst({
      where: {
        id: implantacaoId,
        tenantId: req.tenantId
      }
    });

    if (!implantacao) {
      return res.status(404).json({ error: 'Implantação não encontrada' });
    }

    const item = await prisma.cronogramaItem.create({
      data: {
        tenantId: req.tenantId!,
        implantacaoId: implantacaoId,
        titulo: titulo,
        descricao: descricao || null,
        ordem: ordem !== undefined ? ordem : 0,
        status: status || 'PENDENTE',
        dataPrevistaInicio: dataPrevistaInicio ? new Date(dataPrevistaInicio) : null,
        dataPrevistaFim: dataPrevistaFim ? new Date(dataPrevistaFim) : null,
        responsavelId: responsavelId || null,
        observacoes: observacoes || null,
        visivelSolicitante: visivelSolicitante !== undefined ? visivelSolicitante : true
      },
      include: {
        implantacao: {
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

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Erro ao criar item do cronograma:', error);
    res.status(500).json({ 
      error: 'Erro ao criar item do cronograma',
      details: error.message 
    });
  }
});

// PUT /cronograma-itens/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descricao,
      ordem,
      status,
      dataPrevistaInicio,
      dataPrevistaFim,
      dataInicio,
      dataFim,
      responsavelId,
      observacoes,
      visivelSolicitante
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const item = await prisma.cronogramaItem.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item do cronograma não encontrado' });
    }

    const updated = await prisma.cronogramaItem.update({
      where: { id: id },
      data: {
        titulo: titulo !== undefined ? titulo : item.titulo,
        descricao: descricao !== undefined ? descricao : item.descricao,
        ordem: ordem !== undefined ? ordem : item.ordem,
        status: status !== undefined ? status : item.status,
        dataPrevistaInicio: dataPrevistaInicio !== undefined ? (dataPrevistaInicio ? new Date(dataPrevistaInicio) : null) : item.dataPrevistaInicio,
        dataPrevistaFim: dataPrevistaFim !== undefined ? (dataPrevistaFim ? new Date(dataPrevistaFim) : null) : item.dataPrevistaFim,
        dataInicio: dataInicio !== undefined ? (dataInicio ? new Date(dataInicio) : null) : item.dataInicio,
        dataFim: dataFim !== undefined ? (dataFim ? new Date(dataFim) : null) : item.dataFim,
        responsavelId: responsavelId !== undefined ? responsavelId : item.responsavelId,
        observacoes: observacoes !== undefined ? observacoes : item.observacoes,
        visivelSolicitante: visivelSolicitante !== undefined ? visivelSolicitante : item.visivelSolicitante
      },
      include: {
        implantacao: {
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

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar item do cronograma:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar item do cronograma',
      details: error.message 
    });
  }
});

// DELETE /cronograma-itens/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const item = await prisma.cronogramaItem.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item do cronograma não encontrado' });
    }

    await prisma.cronogramaItem.delete({
      where: { id: id }
    });

    res.json({ message: 'Item do cronograma excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir item do cronograma:', error);
    res.status(500).json({ error: 'Erro ao excluir item do cronograma' });
  }
});

export { router as cronogramaItemRoutes };

