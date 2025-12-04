import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// GET /agrupamentos-faturamento?apoliceId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId } = req.query;

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

    const agrupamentos = await prisma.agrupamentoFaturamento.findMany({
      where: {
        apoliceId: apoliceId as string,
        tenantId: req.tenantId
      },
      orderBy: {
        ordem: 'asc'
      }
    });

    res.json({
      data: agrupamentos,
      total: agrupamentos.length
    });
  } catch (error) {
    console.error('Erro ao listar agrupamentos:', error);
    res.status(500).json({ error: 'Erro ao listar agrupamentos' });
  }
});

// POST /agrupamentos-faturamento (criar ou atualizar em lote)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, agrupamentos } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    if (!apoliceId) {
      return res.status(400).json({ error: 'apoliceId é obrigatório' });
    }

    if (!agrupamentos || !Array.isArray(agrupamentos)) {
      return res.status(400).json({ error: 'agrupamentos deve ser um array' });
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

    // Deletar agrupamentos existentes
    await prisma.agrupamentoFaturamento.deleteMany({
      where: {
        apoliceId: apoliceId,
        tenantId: req.tenantId
      }
    });

    // Criar novos agrupamentos (mesmo se o array estiver vazio, isso limpa os existentes)
    let novosAgrupamentos = [];
    
    if (agrupamentos.length > 0) {
      novosAgrupamentos = await Promise.all(
        agrupamentos.map((agrupamento: any, index: number) => {
          // Validação dos dados
          if (!agrupamento.nome) {
            throw new Error(`Agrupamento ${index + 1} não possui nome`);
          }
          
          // Processar emails: o campo no schema é String?, então sempre salvar como string
          let emailsProcessados: string | null = null;
          if (agrupamento.emails) {
            if (typeof agrupamento.emails === 'string') {
              // Se já for string, usar diretamente (pode estar separada por vírgula)
              const emailsLimpos = agrupamento.emails.trim();
              if (emailsLimpos.length > 0) {
                emailsProcessados = emailsLimpos;
              }
            } else if (Array.isArray(agrupamento.emails)) {
              // Se for array, converter para string separada por vírgula
              const emailsFiltrados = agrupamento.emails.filter((e: string) => e && typeof e === 'string' && e.trim().length > 0);
              if (emailsFiltrados.length > 0) {
                emailsProcessados = emailsFiltrados.join(', ');
              }
            }
          }
          
          return prisma.agrupamentoFaturamento.create({
            data: {
              tenantId: req.tenantId!,
              apoliceId: apoliceId,
              nome: agrupamento.nome,
              estipulanteId: agrupamento.estipulanteId || null,
              subEstipulanteId: agrupamento.subEstipulanteId || null,
              isLider: agrupamento.isLider || false,
              ordem: index,
              emails: emailsProcessados,
              informacoesAdicionaisMailing: agrupamento.informacoesAdicionaisMailing || null
            }
          });
        })
      );
    }

    res.status(201).json({
      data: novosAgrupamentos,
      total: novosAgrupamentos.length
    });
  } catch (error: any) {
    console.error('Erro ao salvar agrupamentos:', error);
    res.status(500).json({ 
      error: 'Erro ao salvar agrupamentos',
      details: error.message 
    });
  }
});

// DELETE /agrupamentos-faturamento/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const agrupamento = await prisma.agrupamentoFaturamento.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!agrupamento) {
      return res.status(404).json({ error: 'Agrupamento não encontrado' });
    }

    await prisma.agrupamentoFaturamento.delete({
      where: { id: id }
    });

    res.json({ message: 'Agrupamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir agrupamento:', error);
    res.status(500).json({ error: 'Erro ao excluir agrupamento' });
  }
});

export { router as agrupamentoFaturamentoRoutes };

