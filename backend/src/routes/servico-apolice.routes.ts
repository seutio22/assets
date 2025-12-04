import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /servicos-apolice?apoliceId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, categoria } = req.query;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!apoliceId) {
      return res.status(400).json({ error: 'apoliceId é obrigatório' });
    }

    // Verificar se a apólice pertence ao tenant
    const apolice = await prisma.apolice.findFirst({
      where: {
        id: apoliceId as string,
        tenantId: req.tenantId
      }
    });

    if (!apolice) {
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    const where: any = {
      apoliceId: apoliceId as string,
      tenantId: req.tenantId
    };

    if (categoria) {
      where.categoria = categoria;
    }

    const servicos = await prisma.servicoApolice.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      data: servicos,
      total: servicos.length
    });
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    res.status(500).json({ error: 'Erro ao listar serviços' });
  }
});

// GET /servicos-apolice/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const servico = await prisma.servicoApolice.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!servico) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    res.json(servico);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    res.status(500).json({ error: 'Erro ao buscar serviço' });
  }
});

// POST /servicos-apolice
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, categoria, nome, descricao, valor, dataInicio, dataFim, status, observacoes } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!apoliceId || !categoria || !nome) {
      return res.status(400).json({ error: 'apoliceId, categoria e nome são obrigatórios' });
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

    // Validar categoria
    const categoriasValidas = ['OPERACIONAL', 'FERRAMENTAS', 'GESTAO_SAUDE'];
    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({ error: 'Categoria inválida. Use: OPERACIONAL, FERRAMENTAS ou GESTAO_SAUDE' });
    }

    const servico = await prisma.servicoApolice.create({
      data: {
        tenantId: req.tenantId,
        apoliceId: apoliceId,
        categoria: categoria,
        nome: nome,
        descricao: descricao || null,
        valor: valor ? parseFloat(valor) : null,
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        status: status || 'ATIVO',
        observacoes: observacoes || null
      }
    });

    res.status(201).json(servico);
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
});

// PUT /servicos-apolice/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { categoria, nome, descricao, valor, dataInicio, dataFim, status, observacoes } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const servico = await prisma.servicoApolice.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!servico) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Validar categoria se fornecida
    if (categoria) {
      const categoriasValidas = ['OPERACIONAL', 'FERRAMENTAS', 'GESTAO_SAUDE'];
      if (!categoriasValidas.includes(categoria)) {
        return res.status(400).json({ error: 'Categoria inválida. Use: OPERACIONAL, FERRAMENTAS ou GESTAO_SAUDE' });
      }
    }

    const updateData: any = {};
    if (categoria !== undefined) updateData.categoria = categoria;
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (valor !== undefined) updateData.valor = valor ? parseFloat(valor) : null;
    if (dataInicio !== undefined) updateData.dataInicio = dataInicio ? new Date(dataInicio) : null;
    if (dataFim !== undefined) updateData.dataFim = dataFim ? new Date(dataFim) : null;
    if (status !== undefined) updateData.status = status;
    if (observacoes !== undefined) updateData.observacoes = observacoes;

    const servicoAtualizado = await prisma.servicoApolice.update({
      where: { id: id },
      data: updateData
    });

    res.json(servicoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
});

// DELETE /servicos-apolice/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const servico = await prisma.servicoApolice.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!servico) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    await prisma.servicoApolice.delete({
      where: { id: id }
    });

    res.json({ message: 'Serviço excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    res.status(500).json({ error: 'Erro ao excluir serviço' });
  }
});

export { router as servicoApoliceRoutes };

