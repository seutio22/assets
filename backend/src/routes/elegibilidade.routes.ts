import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { elegibilidadeSchema } from '../utils/validation'
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

// Todas as rotas requerem autenticação
router.use(authenticateToken)

// GET /elegibilidades?apoliceId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { apoliceId, search, limit = '100', offset = '0' } = req.query

    const where: any = {
      tenantId: req.tenantId
    }

    if (apoliceId) where.apoliceId = apoliceId

    if (search) {
      where.OR = [
        { nome: { contains: search as string } },
        { centroCusto: { contains: search as string } },
        { cnpj: { contains: search as string } },
        { descricao: { contains: search as string } }
      ]
    }

    const [data, total] = await Promise.all([
      prisma.elegibilidade.findMany({
        where,
        skip: parseInt(offset as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          apolice: {
            select: { id: true, numero: true }
          }
        }
      }),
      prisma.elegibilidade.count({ where })
    ])

    res.json({ data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) })
  } catch (error: any) {
    console.error('Erro ao listar elegibilidades:', error)
    res.status(500).json({ 
      error: 'Erro ao listar elegibilidades', 
      details: error.message
    })
  }
})

// GET /elegibilidades/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const elegibilidade = await prisma.elegibilidade.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        }
      }
    })

    if (!elegibilidade) {
      return res.status(404).json({ error: 'Elegibilidade não encontrada' })
    }

    res.json(elegibilidade)
  } catch (error: any) {
    console.error('Erro ao buscar elegibilidade:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar elegibilidade', 
      details: error.message
    })
  }
})

// POST /elegibilidades
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' })
    }

    const validationResult = elegibilidadeSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      })
    }

    const data = validationResult.data

    // Verificar se a apólice existe e pertence ao tenant (se fornecida)
    if (data.apoliceId) {
      const apolice = await prisma.apolice.findFirst({
        where: {
          id: data.apoliceId,
          tenantId: req.tenantId
        }
      })

      if (!apolice) {
        return res.status(404).json({ error: 'Apólice não encontrada' })
      }
    }

    const elegibilidade = await prisma.elegibilidade.create({
      data: {
        apoliceId: data.apoliceId || null,
        nome: data.nome,
        centroCusto: data.centroCusto || null,
        cnpj: data.cnpj || null,
        descricao: data.descricao || null,
        tenantId: req.tenantId!
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        }
      }
    })

    res.status(201).json(elegibilidade)
  } catch (error: any) {
    console.error('Erro ao criar elegibilidade:', error)
    res.status(500).json({ 
      error: 'Erro ao criar elegibilidade', 
      details: error.message
    })
  }
})

// PUT /elegibilidades/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const validationResult = elegibilidadeSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      })
    }

    const data = validationResult.data

    // Verificar se a elegibilidade existe e pertence ao tenant
    const existingElegibilidade = await prisma.elegibilidade.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    })

    if (!existingElegibilidade) {
      return res.status(404).json({ error: 'Elegibilidade não encontrada' })
    }

    // Se a apólice mudou, verificar se a nova apólice existe
    if (data.apoliceId && data.apoliceId !== existingElegibilidade.apoliceId) {
      const apolice = await prisma.apolice.findFirst({
        where: {
          id: data.apoliceId,
          tenantId: req.tenantId
        }
      })

      if (!apolice) {
        return res.status(404).json({ error: 'Apólice não encontrada' })
      }
    }

    const elegibilidade = await prisma.elegibilidade.update({
      where: { id },
      data: {
        apoliceId: data.apoliceId || null,
        nome: data.nome,
        centroCusto: data.centroCusto || null,
        cnpj: data.cnpj || null,
        descricao: data.descricao || null
      },
      include: {
        apolice: {
          select: { id: true, numero: true }
        }
      }
    })

    res.json(elegibilidade)
  } catch (error: any) {
    console.error('Erro ao atualizar elegibilidade:', error)
    res.status(500).json({ 
      error: 'Erro ao atualizar elegibilidade', 
      details: error.message
    })
  }
})

// DELETE /elegibilidades/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const elegibilidade = await prisma.elegibilidade.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    })

    if (!elegibilidade) {
      return res.status(404).json({ error: 'Elegibilidade não encontrada' })
    }

    await prisma.elegibilidade.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error: any) {
    console.error('Erro ao deletar elegibilidade:', error)
    res.status(500).json({ 
      error: 'Erro ao deletar elegibilidade', 
      details: error.message
    })
  }
})

export const elegibilidadeRoutes = router

