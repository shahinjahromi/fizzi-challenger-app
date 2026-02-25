import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/authenticate'
import { getWorkspacesForUser } from '../services/workspaceService'

const router = Router()
router.use(authenticate)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaces = await getWorkspacesForUser(req.user!.userId)
    res.json(workspaces)
  } catch (err) {
    next(err)
  }
})

export default router
