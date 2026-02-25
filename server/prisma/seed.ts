import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load server/.env so STRIPE_SECRET_KEY and DATABASE_URL are set regardless of cwd
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverEnv = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: serverEnv })
if (!process.env.DATABASE_URL) dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') })
if (!process.env.DATABASE_URL) dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { PrismaClient, UserRole, WorkspaceRole, AccountType, TransactionDirection, TransactionType, TransactionStatus, LimitSubjectType, ExternalAccountType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function subDays(date: Date, days: number): Date {
  return addDays(date, -days)
}

async function main() {
  console.log('🌱 Seeding Sixert Bank...')

  const now = new Date()
  const passwordHash = await bcrypt.hash('demo1234', 12)

  // ─── Limit Tiers ──────────────────────────────────────────────────────────

  const tierNewTenure = await prisma.limitTier.upsert({
    where: { name: 'new-tenure' },
    update: {},
    create: {
      name: 'new-tenure',
      displayName: 'New Account',
      perTxnMaxCents: 250_000,       // $2,500
      dailyCreditMaxCents: 500_000,  // $5,000
      dailyDebitMaxCents: 500_000,
      monthlyCreditMaxCents: 5_000_000,
      monthlyDebitMaxCents: 5_000_000,
      velocityCount: 5,
      velocityWindowMinutes: 60,
      sameDayAchMaxCents: 100_000,   // $1,000
    },
  })

  const tierStandard = await prisma.limitTier.upsert({
    where: { name: 'standard-90plus' },
    update: {},
    create: {
      name: 'standard-90plus',
      displayName: 'Standard (90+ days)',
      perTxnMaxCents: 1_000_000,
      dailyCreditMaxCents: 2_500_000,
      dailyDebitMaxCents: 2_500_000,
      monthlyCreditMaxCents: 25_000_000,
      monthlyDebitMaxCents: 25_000_000,
      velocityCount: 20,
      velocityWindowMinutes: 60,
      sameDayAchMaxCents: 500_000,
    },
  })

  const tierElevated = await prisma.limitTier.upsert({
    where: { name: 'elevated' },
    update: {},
    create: {
      name: 'elevated',
      displayName: 'Elevated',
      perTxnMaxCents: 5_000_000,
      dailyCreditMaxCents: 10_000_000,
      dailyDebitMaxCents: 10_000_000,
      monthlyCreditMaxCents: 100_000_000,
      monthlyDebitMaxCents: 100_000_000,
      velocityCount: 50,
      velocityWindowMinutes: 60,
      sameDayAchMaxCents: 2_500_000,
    },
  })

  const tierRestricted = await prisma.limitTier.upsert({
    where: { name: 'restricted' },
    update: {},
    create: {
      name: 'restricted',
      displayName: 'Restricted',
      perTxnMaxCents: 50_000,
      dailyCreditMaxCents: 100_000,
      dailyDebitMaxCents: 100_000,
      monthlyCreditMaxCents: 500_000,
      monthlyDebitMaxCents: 500_000,
      velocityCount: 3,
      velocityWindowMinutes: 60,
      sameDayAchMaxCents: 25_000,
    },
  })

  // ─── Users ────────────────────────────────────────────────────────────────

  const alice = await prisma.user.upsert({
    where: { email: 'alice@acmecorp.com' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@acmecorp.com',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Johnson',
      role: UserRole.USER,
      tenureStartDate: subDays(now, 180),
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@techstart.io' },
    update: { passwordHash }, // ensure password is demo1234 if user already existed
    create: {
      username: 'bob',
      email: 'bob@techstart.io',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Smith',
      role: UserRole.USER,
      tenureStartDate: subDays(now, 30),
    },
  })

  const carol = await prisma.user.upsert({
    where: { email: 'carol@globalventures.com' },
    update: {},
    create: {
      username: 'carol',
      email: 'carol@globalventures.com',
      passwordHash,
      firstName: 'Carol',
      lastName: 'Martinez',
      role: UserRole.USER,
      tenureStartDate: subDays(now, 365),
    },
  })

  const dave = await prisma.user.upsert({
    where: { email: 'dave@vertexlabs.io' },
    update: {},
    create: {
      username: 'dave',
      email: 'dave@vertexlabs.io',
      passwordHash,
      firstName: 'Dave',
      lastName: 'Chen',
      role: UserRole.USER,
      tenureStartDate: subDays(now, 14),
    },
  })

  // ─── Workspaces ───────────────────────────────────────────────────────────

  const acmeCorp = await prisma.workspace.upsert({
    where: { id: 'ws-acme-corp' },
    update: {},
    create: {
      id: 'ws-acme-corp',
      name: 'Acme Corp',
    },
  })

  const globalVentures = await prisma.workspace.upsert({
    where: { id: 'ws-global-ventures' },
    update: {},
    create: {
      id: 'ws-global-ventures',
      name: 'Global Ventures',
    },
  })

  // ─── Workspace Memberships ────────────────────────────────────────────────

  await prisma.workspaceMembership.upsert({
    where: { userId_workspaceId: { userId: alice.id, workspaceId: acmeCorp.id } },
    update: {},
    create: { userId: alice.id, workspaceId: acmeCorp.id, role: WorkspaceRole.OWNER },
  })

  await prisma.workspaceMembership.upsert({
    where: { userId_workspaceId: { userId: bob.id, workspaceId: acmeCorp.id } },
    update: {},
    create: { userId: bob.id, workspaceId: acmeCorp.id, role: WorkspaceRole.ADMIN },
  })

  await prisma.workspaceMembership.upsert({
    where: { userId_workspaceId: { userId: carol.id, workspaceId: globalVentures.id } },
    update: {},
    create: { userId: carol.id, workspaceId: globalVentures.id, role: WorkspaceRole.OWNER },
  })

  await prisma.workspaceMembership.upsert({
    where: { userId_workspaceId: { userId: dave.id, workspaceId: globalVentures.id } },
    update: {},
    create: { userId: dave.id, workspaceId: globalVentures.id, role: WorkspaceRole.MEMBER },
  })

  // ─── Accounts ─────────────────────────────────────────────────────────────

  const acmeChecking = await prisma.account.upsert({
    where: { id: 'acc-acme-checking' },
    update: { accountNumber: '830194761', routingNumber: '021000021' },
    create: {
      id: 'acc-acme-checking',
      workspaceId: acmeCorp.id,
      name: 'Acme Corp Operating',
      type: AccountType.CHECKING,
      accountNumber: '830194761',
      routingNumber: '021000021',
      availableCents: 1_250_000,
      currentCents: 1_250_000,
    },
  })

  const acmeSavings = await prisma.account.upsert({
    where: { id: 'acc-acme-savings' },
    update: { accountNumber: '830194762', routingNumber: '021000021' },
    create: {
      id: 'acc-acme-savings',
      workspaceId: acmeCorp.id,
      name: 'Acme Corp Reserve',
      type: AccountType.SAVINGS,
      accountNumber: '830194762',
      routingNumber: '021000021',
      availableCents: 5_000_000,
      currentCents: 5_000_000,
      interestRate: 0.045,
    },
  })

  const gvChecking = await prisma.account.upsert({
    where: { id: 'acc-gv-checking' },
    update: { accountNumber: '830194763', routingNumber: '021000021' },
    create: {
      id: 'acc-gv-checking',
      workspaceId: globalVentures.id,
      name: 'Global Ventures Operating',
      type: AccountType.CHECKING,
      accountNumber: '830194763',
      routingNumber: '021000021',
      availableCents: 850_000,
      currentCents: 850_000,
    },
  })

  const gvMM = await prisma.account.upsert({
    where: { id: 'acc-gv-mm' },
    update: { accountNumber: '830194764', routingNumber: '021000021' },
    create: {
      id: 'acc-gv-mm',
      workspaceId: globalVentures.id,
      name: 'Global Ventures Money Market',
      type: AccountType.MONEY_MARKET,
      accountNumber: '830194764',
      routingNumber: '021000021',
      availableCents: 10_000_000,
      currentCents: 10_000_000,
      interestRate: 0.05,
    },
  })

  // ─── Stripe Connect: one external account per workspace (requires STRIPE_SECRET_KEY in server/.env) ───
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('  Stripe Connect skipped (set STRIPE_SECRET_KEY in server/.env to link external accounts)')
  } else {
    try {
      const { isStripeConfigured, createConnectExpressAccount, addBankAccountToConnectedAccount } = await import('../src/services/stripeService')
      if (isStripeConfigured()) {
        for (const workspace of [acmeCorp, globalVentures]) {
          const existing = await prisma.externalAccount.findFirst({ where: { workspaceId: workspace.id, stripeDestinationId: { not: null } } })
          if (existing) {
            console.log(`  Stripe Connect already linked for workspace ${workspace.name}, skipping`)
            continue
          }
          const account = await createConnectExpressAccount({
            workspaceName: workspace.name,
            email: `demo-${workspace.id}@sixert-demo.test`,
          })
          await addBankAccountToConnectedAccount(account.id, { accountHolderName: `${workspace.name} (demo)` })
          await prisma.workspace.update({
            where: { id: workspace.id },
            data: { stripeConnectedAccountId: account.id },
          })
          await prisma.externalAccount.create({
            data: {
              workspaceId: workspace.id,
              nickname: `${workspace.name} → Stripe (demo)`,
              type: ExternalAccountType.CHECKING,
              maskedNumber: '••••6789',
              routingNumber: '110000000',
              stripeDestinationId: account.id,
              isVerified: true,
            },
          })
          console.log(`  Linked Stripe Connect for ${workspace.name} (${account.id})`)
        }
      }
    } catch (e) {
      console.warn('  Stripe Connect seed skipped:', e instanceof Error ? e.message : e)
    }
  }

  // ─── Limit Assignments ────────────────────────────────────────────────────

  // Carol gets elevated tier
  await prisma.limitAssignment.upsert({
    where: { id: 'la-carol-elevated' },
    update: {},
    create: {
      id: 'la-carol-elevated',
      subjectType: LimitSubjectType.USER,
      userId: carol.id,
      tierId: tierElevated.id,
      effectiveFrom: subDays(now, 90),
      overrideReason: 'High-volume enterprise customer',
      assignedBy: alice.id,
    },
  })

  // Dave gets restricted tier
  await prisma.limitAssignment.upsert({
    where: { id: 'la-dave-restricted' },
    update: {},
    create: {
      id: 'la-dave-restricted',
      subjectType: LimitSubjectType.USER,
      userId: dave.id,
      tierId: tierRestricted.id,
      effectiveFrom: subDays(now, 7),
      overrideReason: 'New member pending KYC review',
      assignedBy: carol.id,
    },
  })

  // ─── Transactions (90 days) ───────────────────────────────────────────────

  const txnTypes = [
    TransactionType.INTERNAL_TRANSFER,
    TransactionType.ACH_CREDIT,
    TransactionType.ACH_DEBIT,
    TransactionType.INTEREST,
    TransactionType.FEE,
  ]

  for (let i = 0; i < 90; i++) {
    const date = subDays(now, i)
    const accountPairs = [
      { account: acmeChecking, direction: i % 2 === 0 ? TransactionDirection.CREDIT : TransactionDirection.DEBIT },
      { account: gvChecking, direction: i % 3 === 0 ? TransactionDirection.CREDIT : TransactionDirection.DEBIT },
    ]

    for (const { account, direction } of accountPairs) {
      await prisma.transaction.create({
        data: {
          accountId: account.id,
          direction,
          type: txnTypes[i % txnTypes.length],
          status: TransactionStatus.POSTED,
          amountCents: Math.floor(Math.random() * 50_000) + 5_000,
          description: `Seed transaction day -${i}`,
          limitTierId: tierStandard.id,
          postedAt: date,
          createdAt: date,
        },
      })
    }
  }

  // ─── Statements (12 months) ───────────────────────────────────────────────

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1)
    const month = d.getMonth() + 1
    const year = d.getFullYear()

    await prisma.statement.upsert({
      where: { accountId_month_year: { accountId: acmeChecking.id, month, year } },
      update: {},
      create: { accountId: acmeChecking.id, month, year },
    })

    await prisma.statement.upsert({
      where: { accountId_month_year: { accountId: gvChecking.id, month, year } },
      update: {},
      create: { accountId: gvChecking.id, month, year },
    })
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  await prisma.message.upsert({
    where: { id: 'msg-welcome-acme' },
    update: {},
    create: {
      id: 'msg-welcome-acme',
      threadId: 'thread-welcome-acme',
      workspaceId: acmeCorp.id,
      authorId: alice.id,
      subject: 'Welcome to Sixert Bank',
      body: 'Your Acme Corp banking account is now active. Explore transfers, statements, and more.',
      isRead: false,
      sentAt: subDays(now, 5),
    },
  })

  await prisma.message.upsert({
    where: { id: 'msg-welcome-gv' },
    update: {},
    create: {
      id: 'msg-welcome-gv',
      threadId: 'thread-welcome-gv',
      workspaceId: globalVentures.id,
      authorId: carol.id,
      subject: 'Welcome to Sixert Bank',
      body: 'Your Global Ventures banking account is now active. Contact support for elevated limit inquiries.',
      isRead: true,
      sentAt: subDays(now, 10),
    },
  })

  console.log('✅ Seed complete.')
  console.log('  Users: alice, bob, carol, dave (password: demo1234)')
  console.log('  Workspaces: Acme Corp, Global Ventures')
  console.log('  Limit tiers: new-tenure, standard-90plus, elevated, restricted')
  if (process.env.STRIPE_SECRET_KEY) {
    console.log('  External transfers: Stripe Connect linked; view transfers in Stripe Dashboard → Connect → Transfers')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
