import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { validateBody } from '../middleware/validateBody'
import { initiateInternalTransfer, initiateAchTransfer } from '../services/transferService'

const router = Router()
router.use(authenticate)

const internalTransferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amountCents: z.number().int().positive(),
  description: z.string().optional(),
})

const achTransferSchema = z.object({
  accountId: z.string().min(1),
  externalAccountId: z.string().min(1),
  direction: z.enum(['CREDIT', 'DEBIT']),
  amountCents: z.number().int().positive(),
  sameDayAch: z.boolean().optional(),
  description: z.string().optional(),
})

router.post(
  '/internal',
  validateBody(internalTransferSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await initiateInternalTransfer(req.user!.userId, req.body)
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  },
)

router.post(
  '/ach',
  validateBody(achTransferSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await initiateAchTransfer(req.user!.userId, req.body)
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  },
)

export default router
