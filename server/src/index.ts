import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { apiLimiter } from './middleware/rateLimiter'

import authRoutes from './routes/auth'
import accountsRoutes from './routes/accounts'
import transactionsRoutes from './routes/transactions'
import transfersRoutes from './routes/transfers'
import statementsRoutes from './routes/statements'
import messagesRoutes from './routes/messages'
import limitsRoutes from './routes/limits'
import workspacesRoutes from './routes/workspaces'
import profileRoutes from './routes/profile'
import externalAccountsRoutes from './routes/externalAccounts'

const app = express()

app.use(helmet())

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
)

app.use(cookieParser())
app.use(express.json())
app.use('/api', apiLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/accounts', accountsRoutes)
app.use('/api/transactions', transactionsRoutes)
app.use('/api/transfers', transfersRoutes)
app.use('/api/statements', statementsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/limits', limitsRoutes)
app.use('/api/workspaces', workspacesRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/external-accounts', externalAccountsRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.get('/', (_req, res) => res.redirect(302, env.CLIENT_URL))

// 404 for any unmatched route (so API returns JSON, not HTML)
app.use((_req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }))

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`)
  console.log(`Environment: ${env.NODE_ENV}`)
})

export default app
