import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/authenticate'
import { getAccountTransactions } from '../services/transactionService'
import { TransactionStatus } from '@prisma/client'

const router = Router()
router.use(authenticate)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, status, limit, cursor } = req.query

    if (!accountId || typeof accountId !== 'string') {
      return res.status(400).json({ error: 'accountId query param required', code: 'BAD_REQUEST' })
    }

    const result = await getAccountTransactions(accountId, req.user!.userId, {
      status: status as TransactionStatus | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      cursor: cursor as string | undefined,
    })

    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
