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
