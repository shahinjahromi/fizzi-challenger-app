import { prisma } from '../config/prisma'
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors'
import { TransactionDirection, TransactionType, TransactionStatus } from '@prisma/client'
import { enforceLimits } from './limitService'
import { isCutoffPassed } from '../utils/dateUtils'
import {
  isStripeConfigured,
  isStripeConnectedAccountId,
  createPayout,
  createTransferToConnectedAccount,
} from './stripeService'

interface InternalTransferBody {
  fromAccountId: string
  toAccountId: string
  amountCents: number
  description?: string
  requestedExecutionDate?: string
}

interface AchTransferBody {
  accountId: string
  externalAccountId: string
  direction: 'CREDIT' | 'DEBIT'
  amountCents: number
  sameDayAch?: boolean
  description?: string
  isConsumerDebit?: boolean
  consentId?: string
}

function nextBusinessDay(from: Date) {
  const d = new Date(from)
  // weekend-only. Holiday calendars can be added later.
  do {
    d.setDate(d.getDate() + 1)
  } while (d.getDay() === 0 || d.getDay() === 6)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function initiateInternalTransfer(userId: string, body: InternalTransferBody) {
  const { fromAccountId, toAccountId, amountCents, description } = body

  if (amountCents <= 0) throw new ValidationError('Amount must be positive')
  if (fromAccountId === toAccountId) throw new ValidationError('Source and destination must differ')

  const fromAccount = await prisma.account.findUnique({ where: { id: fromAccountId } })
  if (!fromAccount || fromAccount.isClosed) throw new NotFoundError('Source account')

  const toAccount = await prisma.account.findUnique({ where: { id: toAccountId } })
  if (!toAccount || toAccount.isClosed) throw new NotFoundError('Destination account')

  const fromMembership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: fromAccount.workspaceId } },
  })
  if (!fromMembership) throw new ForbiddenError('Not authorized on source account')

  const toMembership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: toAccount.workspaceId } },
  })
  if (!toMembership) throw new ForbiddenError('Not authorized on destination account')

  if (fromAccount.availableCents < amountCents) {
    throw new ValidationError('Insufficient available balance')
  }

  const tier = await enforceLimits(fromAccountId, userId, amountCents, TransactionDirection.DEBIT)

  const cutoffPassed = isCutoffPassed(new Date())
  const effectiveDate = cutoffPassed ? nextBusinessDay(new Date()) : new Date()
  const status = cutoffPassed ? TransactionStatus.PENDING : TransactionStatus.POSTED

  const [debitTxn, creditTxn] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        accountId: fromAccountId,
        direction: TransactionDirection.DEBIT,
        type: TransactionType.INTERNAL_TRANSFER,
        status,
        amountCents,
        description: description ?? 'Internal transfer',
        limitTierId: tier.id,
        limitSnapshot: tier,
        postedAt: status === TransactionStatus.POSTED ? new Date() : null,
      },
    }),
    prisma.transaction.create({
      data: {
        accountId: toAccountId,
        direction: TransactionDirection.CREDIT,
        type: TransactionType.INTERNAL_TRANSFER,
        status,
        amountCents,
        description: description ?? 'Internal transfer',
        limitTierId: tier.id,
        limitSnapshot: tier,
        postedAt: status === TransactionStatus.POSTED ? new Date() : null,
      },
    }),
    prisma.account.update({
      where: { id: fromAccountId },
      data: {
        availableCents: { decrement: amountCents },
        currentCents: status === TransactionStatus.POSTED ? { decrement: amountCents } : undefined,
      },
    }),
    prisma.account.update({
      where: { id: toAccountId },
      data: {
        availableCents: { increment: amountCents },
        currentCents: status === TransactionStatus.POSTED ? { increment: amountCents } : undefined,
      },
    }),
  ])

  return {
    debitTxn,
    creditTxn,
    referenceId: debitTxn.id,
    effectiveDate: effectiveDate.toISOString(),
    status,
  }
}

export async function initiateAchTransfer(userId: string, body: AchTransferBody) {
  const { accountId, externalAccountId, direction, amountCents, sameDayAch, description, isConsumerDebit, consentId } = body

  if (amountCents <= 0) throw new ValidationError('Amount must be positive')

  if (isConsumerDebit === true && (!consentId || String(consentId).trim().length === 0)) {
    throw new ValidationError('Consent is required for consumer debit ACH')
  }

  const account = await prisma.account.findUnique({ where: { id: accountId } })
  if (!account || account.isClosed) throw new NotFoundError('Account')

  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: account.workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not authorized on this account')

  const externalAccount = await prisma.externalAccount.findUnique({ where: { id: externalAccountId } })
  if (!externalAccount) throw new NotFoundError('External account')
  if (!externalAccount.isVerified) throw new ValidationError('External account is not verified')
  if (externalAccount.workspaceId !== account.workspaceId) throw new ForbiddenError('External account mismatch')

  const txnDirection = direction === 'CREDIT' ? TransactionDirection.CREDIT : TransactionDirection.DEBIT
  const tier = await enforceLimits(accountId, userId, amountCents, txnDirection)

  if (sameDayAch && amountCents > tier.sameDayAchMaxCents) {
    throw new ValidationError(
      `Amount exceeds same-day ACH limit of $${(tier.sameDayAchMaxCents / 100).toFixed(2)}`,
    )
  }

  if (sameDayAch && isCutoffPassed(new Date())) {
    throw new ValidationError('Same-day ACH cutoff (1 PM ET) has passed for today')
  }

  const txn = await prisma.transaction.create({
    data: {
      accountId,
      direction: txnDirection,
      type: txnDirection === TransactionDirection.CREDIT ? TransactionType.ACH_CREDIT : TransactionType.ACH_DEBIT,
      status: TransactionStatus.PENDING,
      amountCents,
      description: description ?? 'ACH transfer',
      limitTierId: tier.id,
      limitSnapshot: tier,
    },
  })

  if (txnDirection === TransactionDirection.DEBIT) {
    await prisma.account.update({
      where: { id: accountId },
      data: { availableCents: { decrement: amountCents } },
    })
  }

  if (
    txnDirection === TransactionDirection.DEBIT &&
    isStripeConfigured() &&
    externalAccount.stripeDestinationId
  ) {
    try {
      if (isStripeConnectedAccountId(externalAccount.stripeDestinationId)) {
        const transfer = await createTransferToConnectedAccount({
          destinationConnectedAccountId: externalAccount.stripeDestinationId,
          amountCents,
          description: description ?? `Sixert → external (${externalAccount.nickname ?? 'external account'})`,
          metadata: {
            sixert_account_id: accountId,
            sixert_external_account_id: externalAccountId,
          },
        })
        return {
          txn,
          referenceId: txn.id,
          stripePayoutId: transfer.id,
          stripePayoutStatus: transfer.reversed === true ? 'reversed' : 'paid',
          note: `Transfer submitted via Stripe Connect (transfer ${transfer.id}). View in Stripe Dashboard → Connect → Transfers.`,
        }
      }
      const payout = await createPayout({
        amountCents,
        destinationBankAccountId: externalAccount.stripeDestinationId,
        description: description ?? `ACH transfer to external account`,
        statementDescriptor: 'SIXERT BANK',
      })
      return {
        txn,
        referenceId: txn.id,
        stripePayoutId: payout.id,
        stripePayoutStatus: payout.status,
        note: `Transfer submitted via Stripe (payout ${payout.id}, ${payout.status})`,
      }
    } catch (stripeErr) {
      await prisma.account.update({
        where: { id: accountId },
        data: { availableCents: { increment: amountCents } },
      })
      const message = stripeErr instanceof Error ? stripeErr.message : 'Stripe transfer failed'
      throw new ValidationError(`External transfer failed: ${message}`)
    }
  }

  if (txnDirection === TransactionDirection.CREDIT) {
    return { txn, referenceId: txn.id, note: 'ACH credit (inbound) submission pending; Stripe inbound not yet wired' }
  }
  return {
    txn,
    referenceId: txn.id,
    note: externalAccount.stripeDestinationId
      ? 'Stripe not configured (set STRIPE_SECRET_KEY in .env)'
      : 'Link this external account with Stripe to enable payouts',
  }
}
