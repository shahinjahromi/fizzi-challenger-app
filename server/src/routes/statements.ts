import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/authenticate'
import { listStatements, getStatementById, generateStatementPdf } from '../services/statementService'

const router = Router()
router.use(authenticate)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.query
    if (!accountId || typeof accountId !== 'string') {
      return res.status(400).json({ error: 'accountId query param required', code: 'BAD_REQUEST' })
    }
    const statements = await listStatements(accountId, req.user!.userId)
    res.json(statements)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statement = await getStatementById(req.params.id, req.user!.userId)
    const pdf = await generateStatementPdf(statement)
    const monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][statement.month - 1]
    const filename = `statement-${statement.account.name.replace(/\s+/g, '-')}-${monthName}-${statement.year}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(pdf)
  } catch (err) {
    next(err)
  }
})

export default router
