import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/authenticate'
import { listExternalAccounts } from '../services/externalAccountService'

const router = Router()
router.use(authenticate)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspaceId } = req.query
    if (!workspaceId || typeof workspaceId !== 'string') {
      return res.status(400).json({ error: 'workspaceId query param required', code: 'BAD_REQUEST' })
    }
    const accounts = await listExternalAccounts(workspaceId, req.user!.userId)
    res.json(accounts)
  } catch (err) {
    next(err)
  }
})

export default router
