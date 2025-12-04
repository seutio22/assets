import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /chamados-implantacao
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, status, limit = '100' } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const where: any = {
      tenantId: req.tenantId
    };

    if (apoliceId) {
      where.apoliceId = apoliceId as string;
    }

    if (status) {
      where.status = status as string;
    }

    const chamados = await prisma.chamadoImplantacao.findMany({
      where,
      include: {
        apolice: {
          include: {
            empresa: true
          }
        },
        implantacao: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string)
    });

    res.json({
      data: chamados,
      total: chamados.length
    });
  } catch (error) {
    console.error('Erro ao listar chamados:', error);
    res.status(500).json({ error: 'Erro ao listar chamados' });
  }
});

// GET /chamados-implantacao/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const chamado = await prisma.chamadoImplantacao.findFirst({
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
        implantacao: {
          include: {
            cronogramaItens: {
              orderBy: {
                ordem: 'asc'
              }
            }
          }
        }
      }
    });

    if (!chamado) {
      return res.status(404).json({ error: 'Chamado não encontrado' });
    }

    res.json(chamado);
  } catch (error) {
    console.error('Erro ao buscar chamado:', error);
    res.status(500).json({ error: 'Erro ao buscar chamado' });
  }
});

// POST /chamados-implantacao
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      apoliceId,
      titulo,
      descricao,
      solicitanteId,
      responsavelId,
      status,
      prioridade,
      dataPrazo,
      observacoes
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!apoliceId || !titulo) {
      return res.status(400).json({ error: 'apoliceId e titulo são obrigatórios' });
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

    // Gerar número do chamado
    const count = await prisma.chamadoImplantacao.count({
      where: {
        tenantId: req.tenantId
      }
    });
    const numero = `CH-${String(count + 1).padStart(6, '0')}`;

    const chamado = await prisma.chamadoImplantacao.create({
      data: {
        tenantId: req.tenantId!,
        apoliceId: apoliceId,
        numero: numero,
        titulo: titulo,
        descricao: descricao || null,
        solicitanteId: solicitanteId || null,
        responsavelId: responsavelId || null,
        status: status || 'ABERTO',
        prioridade: prioridade || 'MEDIA',
        dataPrazo: dataPrazo ? new Date(dataPrazo) : null,
        observacoes: observacoes || null
      },
      include: {
        apolice: {
          include: {
            empresa: true
          }
        }
      }
    });

    res.status(201).json(chamado);
  } catch (error: any) {
    console.error('Erro ao criar chamado:', error);
    res.status(500).json({ 
      error: 'Erro ao criar chamado',
      details: error.message 
    });
  }
});

// PUT /chamados-implantacao/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descricao,
      solicitanteId,
      responsavelId,
      status,
      prioridade,
      dataPrazo,
      dataConclusao,
      observacoes
    } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const chamado = await prisma.chamadoImplantacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!chamado) {
      return res.status(404).json({ error: 'Chamado não encontrado' });
    }

    const updated = await prisma.chamadoImplantacao.update({
      where: { id: id },
      data: {
        titulo: titulo !== undefined ? titulo : chamado.titulo,
        descricao: descricao !== undefined ? descricao : chamado.descricao,
        solicitanteId: solicitanteId !== undefined ? solicitanteId : chamado.solicitanteId,
        responsavelId: responsavelId !== undefined ? responsavelId : chamado.responsavelId,
        status: status !== undefined ? status : chamado.status,
        prioridade: prioridade !== undefined ? prioridade : chamado.prioridade,
        dataPrazo: dataPrazo !== undefined ? (dataPrazo ? new Date(dataPrazo) : null) : chamado.dataPrazo,
        dataConclusao: dataConclusao !== undefined ? (dataConclusao ? new Date(dataConclusao) : null) : chamado.dataConclusao,
        observacoes: observacoes !== undefined ? observacoes : chamado.observacoes
      },
      include: {
        apolice: {
          include: {
            empresa: true
          }
        },
        implantacao: {
          include: {
            cronogramaItens: {
              orderBy: {
                ordem: 'asc'
              }
            }
          }
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar chamado:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar chamado',
      details: error.message 
    });
  }
});

// DELETE /chamados-implantacao/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const chamado = await prisma.chamadoImplantacao.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!chamado) {
      return res.status(404).json({ error: 'Chamado não encontrado' });
    }

    await prisma.chamadoImplantacao.delete({
      where: { id: id }
    });

    res.json({ message: 'Chamado excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir chamado:', error);
    res.status(500).json({ error: 'Erro ao excluir chamado' });
  }
});

export { router as chamadoImplantacaoRoutes };

