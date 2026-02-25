import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/authenticate'
import { getLimitTiers, getEffectiveLimitForAccount } from '../services/limitService'

const router = Router()
router.use(authenticate)

router.get('/tiers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tiers = await getLimitTiers()
    res.json(tiers)
  } catch (err) {
    next(err)
  }
})

router.get('/effective', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.query
    if (!accountId || typeof accountId !== 'string') {
      return res.status(400).json({ error: 'accountId query param required', code: 'BAD_REQUEST' })
    }
    const tier = await getEffectiveLimitForAccount(accountId, req.user!.userId)
    res.json(tier)
  } catch (err) {
    next(err)
  }
})

export default router
