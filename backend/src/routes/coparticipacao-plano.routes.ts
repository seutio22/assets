import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { coparticipacaoPlanoSchema } from '../utils/validation'
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

// Todas as rotas requerem autenticação
router.use(authenticateToken)

// GET /coparticipacoes-plano?planoId=xxx
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
      prisma.coparticipacaoPlano.findMany({
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
      prisma.coparticipacaoPlano.count({ where })
    ])

    res.json({ data, total, limit: parseInt(limit as string), offset: parseInt(offset as string) })
  } catch (error: any) {
    console.error('Erro ao listar coparticipações:', error)
    res.status(500).json({ 
      error: 'Erro ao listar coparticipações', 
      details: error.message
    })
  }
})

// GET /coparticipacoes-plano/:id
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const coparticipacao = await prisma.coparticipacaoPlano.findFirst({
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

    if (!coparticipacao) {
      return res.status(404).json({ error: 'Coparticipação não encontrada' })
    }

    res.json(coparticipacao)
  } catch (error: any) {
    console.error('Erro ao buscar coparticipação:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar coparticipação', 
      details: error.message
    })
  }
})

// POST /coparticipacoes-plano
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(401).json({ error: 'Tenant ID não encontrado' })
    }

    const validationResult = coparticipacaoPlanoSchema.safeParse(req.body)
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

    const coparticipacao = await prisma.coparticipacaoPlano.create({
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

    res.status(201).json(coparticipacao)
  } catch (error: any) {
    console.error('Erro ao criar coparticipação:', error)
    res.status(500).json({ 
      error: 'Erro ao criar coparticipação', 
      details: error.message
    })
  }
})

// PUT /coparticipacoes-plano/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const validationResult = coparticipacaoPlanoSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: validationResult.error.errors 
      })
    }

    const data = validationResult.data

    // Verificar se a coparticipação existe e pertence ao tenant
    const existingCoparticipacao = await prisma.coparticipacaoPlano.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    })

    if (!existingCoparticipacao) {
      return res.status(404).json({ error: 'Coparticipação não encontrada' })
    }

    // Se o planoId mudou, verificar se o novo plano existe
    if (data.planoId && data.planoId !== existingCoparticipacao.planoId) {
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

    const coparticipacao = await prisma.coparticipacaoPlano.update({
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

    res.json(coparticipacao)
  } catch (error: any) {
    console.error('Erro ao atualizar coparticipação:', error)
    res.status(500).json({ 
      error: 'Erro ao atualizar coparticipação', 
      details: error.message
    })
  }
})

// DELETE /coparticipacoes-plano/:id
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const coparticipacao = await prisma.coparticipacaoPlano.findFirst({
      where: {
        id,
        tenantId: req.tenantId
      }
    })

    if (!coparticipacao) {
      return res.status(404).json({ error: 'Coparticipação não encontrada' })
    }

    await prisma.coparticipacaoPlano.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error: any) {
    console.error('Erro ao deletar coparticipação:', error)
    res.status(500).json({ 
      error: 'Erro ao deletar coparticipação', 
      details: error.message
    })
  }
})

export const coparticipacaoPlanoRoutes = router

