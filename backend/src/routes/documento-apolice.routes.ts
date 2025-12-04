import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Configurar diretório de uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// GET /documentos-apolice?apoliceId=xxx
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

    const documentos = await prisma.documentoApolice.findMany({
      where: {
        apoliceId: apoliceId as string,
        tenantId: req.tenantId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      data: documentos,
      total: documentos.length
    });
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ error: 'Erro ao listar documentos' });
  }
});

// POST /documentos-apolice (upload)
router.post('/', upload.single('arquivo'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não enviado' });
    }

    const { apoliceId, nomeExibicao, visivel } = req.body;

    if (!apoliceId) {
      // Deletar arquivo se apoliceId não foi fornecido
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'apoliceId é obrigatório' });
    }

    if (!req.tenantId) {
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    // Verificar se a apólice pertence ao tenant
    const apolice = await prisma.apolice.findFirst({
      where: {
        id: apoliceId,
        tenantId: req.tenantId
      }
    });

    if (!apolice) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Apólice não encontrada' });
    }

    const documento = await prisma.documentoApolice.create({
      data: {
        tenantId: req.tenantId,
        apoliceId: apoliceId,
        nomeArquivo: req.file.originalname,
        nomeExibicao: nomeExibicao || req.file.originalname,
        caminhoArquivo: req.file.path,
        tipoArquivo: req.file.mimetype,
        tamanho: req.file.size,
        visivel: visivel === 'true' || visivel === true
      }
    });

    res.status(201).json(documento);
  } catch (error) {
    console.error('Erro ao fazer upload do documento:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Erro ao fazer upload do documento' });
  }
});

// PUT /documentos-apolice/:id (renomear e atualizar visibilidade)
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { nomeExibicao, visivel } = req.body;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const documento = await prisma.documentoApolice.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!documento) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    const updateData: any = {};
    if (nomeExibicao !== undefined) updateData.nomeExibicao = nomeExibicao;
    if (visivel !== undefined) updateData.visivel = visivel === 'true' || visivel === true;

    const documentoAtualizado = await prisma.documentoApolice.update({
      where: { id: id },
      data: updateData
    });

    res.json(documentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ error: 'Erro ao atualizar documento' });
  }
});

// GET /documentos-apolice/:id/download
router.get('/:id/download', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const documento = await prisma.documentoApolice.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!documento) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    if (!fs.existsSync(documento.caminhoArquivo)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
    }

    res.download(documento.caminhoArquivo, documento.nomeExibicao);
  } catch (error) {
    console.error('Erro ao fazer download do documento:', error);
    res.status(500).json({ error: 'Erro ao fazer download do documento' });
  }
});

// DELETE /documentos-apolice/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' });
    }

    const documento = await prisma.documentoApolice.findFirst({
      where: {
        id: id,
        tenantId: req.tenantId
      }
    });

    if (!documento) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    // Deletar arquivo físico
    if (fs.existsSync(documento.caminhoArquivo)) {
      fs.unlinkSync(documento.caminhoArquivo);
    }

    // Deletar registro do banco
    await prisma.documentoApolice.delete({
      where: { id: id }
    });

    res.json({ message: 'Documento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    res.status(500).json({ error: 'Erro ao excluir documento' });
  }
});

export { router as documentoApoliceRoutes };

