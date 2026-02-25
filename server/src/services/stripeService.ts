import Stripe from 'stripe'
import { env } from '../config/env'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  }
  return stripeClient
}

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY)
}

/** True if id is a Stripe connected account (acct_xxx). */
export function isStripeConnectedAccountId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('acct_')
}

export interface CreatePayoutParams {
  amountCents: number
  destinationBankAccountId: string
  description?: string
  statementDescriptor?: string
}

/**
 * Create a payout to an external bank account via Stripe.
 * Destination must be a Stripe bank account ID (e.g. ba_xxx) already linked to your Stripe account.
 * In test mode, no real money moves.
 */
export async function createPayout(params: CreatePayoutParams): Promise<Stripe.Payout> {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY)')

  const payout = await stripe.payouts.create({
    amount: params.amountCents,
    currency: 'usd',
    destination: params.destinationBankAccountId,
    description: params.description ?? undefined,
    statement_descriptor: params.statementDescriptor?.slice(0, 22),
    method: 'standard',
  })

  return payout
}

// ─── Stripe Connect (external transfers visible in Stripe Dashboard) ─────────

/** Create an Express connected account for a workspace. Returns acct_xxx. */
export async function createConnectExpressAccount(params: {
  workspaceName: string
  email: string
}): Promise<Stripe.Account> {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY)')

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US',
    email: params.email,
    capabilities: {
      transfers: { requested: true },
    },
  })
  return account
}

/**
 * Add a test bank account to a Connect connected account.
 * Use Stripe test routing/account numbers so the transfer appears in Dashboard.
 */
export async function addBankAccountToConnectedAccount(
  connectedAccountId: string,
  params?: { accountHolderName?: string }
): Promise<Stripe.BankAccount> {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY)')

  const externalAccount = await stripe.accounts.createExternalAccount(connectedAccountId, {
    external_account: {
      object: 'bank_account',
      country: 'US',
      currency: 'usd',
      account_number: '000123456789',
      routing_number: '110000000',
      account_holder_name: params?.accountHolderName ?? 'Sixert Demo',
    },
  })
  return externalAccount as Stripe.BankAccount
}

/**
 * Transfer funds from the platform balance to a Connect connected account.
 * Visible in Stripe Dashboard: Connect → Transfers.
 * In test mode, ensure the platform has balance (Dashboard → Balance → Add test funds).
 */
export async function createTransferToConnectedAccount(params: {
  destinationConnectedAccountId: string
  amountCents: number
  description?: string
  metadata?: Record<string, string>
}): Promise<Stripe.Transfer> {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY)')

  const transfer = await stripe.transfers.create({
    amount: params.amountCents,
    currency: 'usd',
    destination: params.destinationConnectedAccountId,
    description: params.description ?? undefined,
    metadata: params.metadata,
  })
  return transfer
}
