import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/authenticate'
import { listExternalAccounts, linkStripeConnectForWorkspace } from '../services/externalAccountService'

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

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workspaceId, nickname } = req.body as { workspaceId?: string; nickname?: string }
    if (!workspaceId || typeof workspaceId !== 'string') {
      return res.status(400).json({ error: 'workspaceId is required', code: 'BAD_REQUEST' })
    }
    const { externalAccount, created } = await linkStripeConnectForWorkspace(
      workspaceId,
      req.user!.userId,
      typeof nickname === 'string' ? nickname : undefined
    )
    res.status(created ? 201 : 200).json({ externalAccount, created })
  } catch (err) {
    next(err)
  }
})

export default router
