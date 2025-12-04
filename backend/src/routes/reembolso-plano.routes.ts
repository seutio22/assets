import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { reembolsoPlanoSchema } from '../utils/validation'
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

// Todas as rotas requerem autenticação
router.use(authenticateToken)

// GET /reembolsos-plano?planoId=xxx
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { planoId, search, limit = '100', offset = '0' } = req.query

    const where: any = {
      tenantId: req.tenantId
    }

    if (planoId) where.planoId = planoId

    if (search) {
      where.OR = [
        { procedimento: { contains: search as string } }
      ]
    }

    const [data, total] = await Promise.all([
      prisma.reembolsoPlano.findMany({
        where,
        skip: parseInt(offset as string),
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          plano: {
            select: { id: true, nomePlano: true }
          }
        }
      }),
      prisma.reembolsoPlano.count({ where })
    ])

    res.json({ data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) })
  } catch (error: any) {
    console.error('Erro ao listar reembolsos:', error)
    res.status(500).json({ 
      error: 'Erro ao listar reembolsos', 
      details: error.message
    })
  }
})

// GET /reembolsos-plano/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const reembolso = await prisma.reembolsoPlano.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      },
      include: {
        plano: {
          select: { id: true, nomePlano: true }
        }
      }
    })

    if (!reembolso) {
      return res.status(404).json({ error: 'Reembolso não encontrado' })
    }

    res.json(reembolso)
  } catch (error: any) {
    console.error('Erro ao buscar reembolso:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar reembolso', 
      details: error.message
    })
  }
})

// POST /reembolsos-plano
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' })
    }

    const validationResult = reembolsoPlanoSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      })
    }

    const data = validationResult.data

    // Verificar se o plano existe e pertence ao tenant
    const plano = await prisma.plano.findFirst({
      where: {
        id: data.planoId,
        tenantId: req.tenantId
      }
    })

    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado' })
    }

    const reembolso = await prisma.reembolsoPlano.create({
      data: {
        planoId: data.planoId,
        valor: data.valor || null,
        procedimento: data.procedimento || null,
        tenantId: req.tenantId!
      },
      include: {
        plano: {
          select: { id: true, nomePlano: true }
        }
      }
    })

    res.status(201).json(reembolso)
  } catch (error: any) {
    console.error('Erro ao criar reembolso:', error)
    res.status(500).json({ 
      error: 'Erro ao criar reembolso', 
      details: error.message
    })
  }
})

// PUT /reembolsos-plano/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const validationResult = reembolsoPlanoSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      })
    }

    const data = validationResult.data

    // Verificar se o reembolso existe e pertence ao tenant
    const existingReembolso = await prisma.reembolsoPlano.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    })

    if (!existingReembolso) {
      return res.status(404).json({ error: 'Reembolso não encontrado' })
    }

    // Se o planoId mudou, verificar se o novo plano existe
    if (data.planoId && data.planoId !== existingReembolso.planoId) {
      const plano = await prisma.plano.findFirst({
        where: {
          id: data.planoId,
          tenantId: req.tenantId
        }
      })

      if (!plano) {
        return res.status(404).json({ error: 'Plano não encontrado' })
      }
    }

    const reembolso = await prisma.reembolsoPlano.update({
      where: { id },
      data: {
        planoId: data.planoId,
        valor: data.valor || null,
        procedimento: data.procedimento || null
      },
      include: {
        plano: {
          select: { id: true, nomePlano: true }
        }
      }
    })

    res.json(reembolso)
  } catch (error: any) {
    console.error('Erro ao atualizar reembolso:', error)
    res.status(500).json({ 
      error: 'Erro ao atualizar reembolso', 
      details: error.message
    })
  }
})

// DELETE /reembolsos-plano/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const reembolso = await prisma.reembolsoPlano.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    })

    if (!reembolso) {
      return res.status(404).json({ error: 'Reembolso não encontrado' })
    }

    await prisma.reembolsoPlano.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error: any) {
    console.error('Erro ao deletar reembolso:', error)
    res.status(500).json({ 
      error: 'Erro ao deletar reembolso', 
      details: error.message
    })
  }
})

export const reembolsoPlanoRoutes = router

