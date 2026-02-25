import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { validateBody } from '../middleware/validateBody'
import { listMessages, createMessage, markRead } from '../services/messageService'

const router = Router()
router.use(authenticate)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspaceId } = req.query
    if (!workspaceId || typeof workspaceId !== 'string') {
      return res.status(400).json({ error: 'workspaceId query param required', code: 'BAD_REQUEST' })
    }
    const messages = await listMessages(workspaceId, req.user!.userId)
    res.json(messages)
  } catch (err) {
    next(err)
  }
})

const createMessageSchema = z.object({
  workspaceId: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  threadId: z.string().optional(),
  isDraft: z.boolean().optional(),
})

router.post(
  '/',
  validateBody(createMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await createMessage(req.user!.userId, req.body)
      res.status(201).json(message)
    } catch (err) {
      next(err)
    }
  },
)

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const message = await markRead(req.params.id, req.user!.userId)
    res.json(message)
  } catch (err) {
    next(err)
  }
})

export default router
