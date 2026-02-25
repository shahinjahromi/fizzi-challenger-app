/**
 * Link Stripe Connect external accounts for all existing workspaces.
 * Run after setting STRIPE_SECRET_KEY in server/.env so demo users (bob, alice, etc.) see a linked external account for transfers.
 *
 * Usage: cd server && npx tsx scripts/seed-stripe-connect.ts
 */
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const connectionString = process.env.DATABASE_URL
const stripeKey = process.env.STRIPE_SECRET_KEY

if (!connectionString) {
  console.error('DATABASE_URL is not set. Run from server/ with .env present.')
  process.exit(1)
}
if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY is not set in server/.env. Add your Stripe test key (sk_test_...) to enable external transfers.')
  process.exit(1)
}

async function main() {
  const { PrismaClient, ExternalAccountType } = await import('@prisma/client')
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const pg = await import('pg')
  const { createConnectExpressAccount, addBankAccountToConnectedAccount } = await import('../src/services/stripeService')

  const pool = new pg.default.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const workspaces = await prisma.workspace.findMany()
  for (const workspace of workspaces) {
    const existing = await prisma.externalAccount.findFirst({
      where: { workspaceId: workspace.id, stripeDestinationId: { not: null } },
    })
    if (existing) {
      console.log(`Already linked: ${workspace.name}`)
      continue
    }
    console.log(`Linking Stripe Connect for ${workspace.name}...`)
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
    console.log(`  Created ${account.id} and external account for ${workspace.name}`)
  }
  await prisma.$disconnect()
  pool.end()
  console.log('Done. Bob (Acme Corp) and Carol (Global Ventures) can now use "Transfer to external bank".')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
