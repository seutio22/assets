import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, requireRole } from '../middlewares/auth.middleware';
import { dadoDinamicoSchema } from '../utils/validation';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

// GET /dados-dinamicos?configuracaoCampoId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { configuracaoCampoId } = req.query;

    const where: any = {
      tenantId: req.tenantId,
      ativo: true
    };

    if (configuracaoCampoId) where.configuracaoCampoId = configuracaoCampoId;

    const dados = await prisma.dadoDinamico.findMany({
      where,
      orderBy: { ordem: 'asc' }
    });

    res.json({ data: dados });
  } catch (error: any) {
    console.error('Erro ao listar dados dinâmicos:', error);
    res.status(500).json({ error: 'Erro ao listar dados dinâmicos', details: error.message });
  }
});

// GET /dados-dinamicos/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { id } = req.params;

    const dado = await prisma.dadoDinamico.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        configuracaoCampo: {
          include: {
            modulo: true
          }
        }
      }
    });

    if (!dado) {
      return res.status(404).json({ error: 'Dado não encontrado' });
    }

    res.json(dado);
  } catch (error: any) {
    console.error('Erro ao buscar dado:', error);
    res.status(500).json({ error: 'Erro ao buscar dado', details: error.message });
  }
});

// POST /dados-dinamicos
router.post('/', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const validationResult = dadoDinamicoSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Verificar se a configuração existe e pertence ao tenant
    const configuracao = await prisma.configuracaoCampo.findFirst({
      where: {
        id: data.configuracaoCampoId,
        tenantId: req.tenantId
      }
    });

    if (!configuracao) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    const dado = await prisma.dadoDinamico.create({
      data: {
        ...data,
        tenantId: req.tenantId
      } as any
    });

    res.status(201).json(dado);
  } catch (error: any) {
    console.error('Erro ao criar dado:', error);
    res.status(500).json({ error: 'Erro ao criar dado', details: error.message });
  }
});

// POST /dados-dinamicos/bulk - Criar múltiplos dados
router.post('/bulk', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { configuracaoCampoId, valores } = req.body;

    if (!configuracaoCampoId || !Array.isArray(valores) || valores.length === 0) {
      return res.status(400).json({ error: 'configuracaoCampoId e valores (array) são obrigatórios' });
    }

    // Verificar se a configuração existe
    const configuracao = await prisma.configuracaoCampo.findFirst({
      where: {
        id: configuracaoCampoId,
        tenantId: req.tenantId
      }
    });

    if (!configuracao) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    // Criar múltiplos dados
    const dados = await prisma.dadoDinamico.createMany({
      data: valores.map((valor: string, index: number) => ({
        tenantId: req.tenantId,
        configuracaoCampoId,
        valor: valor.trim(),
        ordem: index,
        ativo: true
      }))
    });

    res.status(201).json({ message: `${dados.count} dados criados com sucesso`, count: dados.count });
  } catch (error: any) {
    console.error('Erro ao criar dados em lote:', error);
    res.status(500).json({ error: 'Erro ao criar dados em lote', details: error.message });
  }
});

// POST /dados-dinamicos/upload - Upload de CSV
router.post('/upload', requireRole('ADMIN'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { configuracaoCampoId } = req.body;

    if (!configuracaoCampoId) {
      return res.status(400).json({ error: 'configuracaoCampoId é obrigatório' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não enviado' });
    }

    // Verificar se a configuração existe
    const configuracao = await prisma.configuracaoCampo.findFirst({
      where: {
        id: configuracaoCampoId,
        tenantId: req.tenantId
      }
    });

    if (!configuracao) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    const valores: string[] = [];
    const stream = Readable.from(req.file.buffer);
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row: any) => {
          // Pega o primeiro valor de cada linha
          const valor = Object.values(row)[0] as string;
          if (valor && valor.trim()) {
            valores.push(valor.trim());
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (valores.length === 0) {
      return res.status(400).json({ error: 'Nenhum valor encontrado no arquivo CSV' });
    }

    // Criar dados
    const dados = await prisma.dadoDinamico.createMany({
      data: valores.map((valor, index) => ({
        tenantId: req.tenantId,
        configuracaoCampoId,
        valor,
        ordem: index,
        ativo: true
      }))
    });

    res.status(201).json({ 
      message: `${dados.count} dados importados com sucesso`, 
      count: dados.count 
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload', details: error.message });
  }
});

// PUT /dados-dinamicos/:id
router.put('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { id } = req.params;
    const validationResult = dadoDinamicoSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    const existing = await prisma.dadoDinamico.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Dado não encontrado' });
    }

    const dado = await prisma.dadoDinamico.update({
      where: { id },
      data
    });

    res.json(dado);
  } catch (error: any) {
    console.error('Erro ao atualizar dado:', error);
    res.status(500).json({ error: 'Erro ao atualizar dado', details: error.message });
  }
});

// DELETE /dados-dinamicos/:id
router.delete('/:id', requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const { id } = req.params;

    const existing = await prisma.dadoDinamico.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Dado não encontrado' });
    }

    await prisma.dadoDinamico.delete({
      where: { id }
    });

    res.json({ message: 'Dado excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir dado:', error);
    res.status(500).json({ error: 'Erro ao excluir dado', details: error.message });
  }
});

export { router as dadoDinamicoRoutes };

