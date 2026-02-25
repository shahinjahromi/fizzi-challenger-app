import { prisma } from '../config/prisma'
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors'
import { TransactionDirection, TransactionType, TransactionStatus } from '@prisma/client'
import { enforceLimits } from './limitService'
import { isCutoffPassed } from '../utils/dateUtils'
import { isStripeConfigured, createPayout } from './stripeService'

interface InternalTransferBody {
  fromAccountId: string
  toAccountId: string
  amountCents: number
  description?: string
}

interface AchTransferBody {
  accountId: string
  externalAccountId: string
  direction: 'CREDIT' | 'DEBIT'
  amountCents: number
  sameDayAch?: boolean
  description?: string
}

export async function initiateInternalTransfer(userId: string, body: InternalTransferBody) {
  const { fromAccountId, toAccountId, amountCents, description } = body

  if (amountCents <= 0) throw new ValidationError('Amount must be positive')
  if (fromAccountId === toAccountId) throw new ValidationError('Source and destination must differ')

  const fromAccount = await prisma.account.findUnique({ where: { id: fromAccountId } })
  if (!fromAccount || fromAccount.isClosed) throw new NotFoundError('Source account')

  const toAccount = await prisma.account.findUnique({ where: { id: toAccountId } })
  if (!toAccount || toAccount.isClosed) throw new NotFoundError('Destination account')

  // Verify user is member of both workspaces
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

  const [debitTxn, creditTxn] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        accountId: fromAccountId,
        direction: TransactionDirection.DEBIT,
        type: TransactionType.INTERNAL_TRANSFER,
        status: TransactionStatus.POSTED,
        amountCents,
        description: description ?? 'Internal transfer',
        limitTierId: tier.id,
        limitSnapshot: tier,
        postedAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: {
        accountId: toAccountId,
        direction: TransactionDirection.CREDIT,
        type: TransactionType.INTERNAL_TRANSFER,
        status: TransactionStatus.POSTED,
        amountCents,
        description: description ?? 'Internal transfer',
        limitTierId: tier.id,
        limitSnapshot: tier,
        postedAt: new Date(),
      },
    }),
    prisma.account.update({
      where: { id: fromAccountId },
      data: {
        availableCents: { decrement: amountCents },
        currentCents: { decrement: amountCents },
      },
    }),
    prisma.account.update({
      where: { id: toAccountId },
      data: {
        availableCents: { increment: amountCents },
        currentCents: { increment: amountCents },
      },
    }),
  ])

  return { debitTxn, creditTxn }
}

export async function initiateAchTransfer(userId: string, body: AchTransferBody) {
  const { accountId, externalAccountId, direction, amountCents, sameDayAch, description } = body

  if (amountCents <= 0) throw new ValidationError('Amount must be positive')

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

  // Decrement available balance immediately for debits
  if (txnDirection === TransactionDirection.DEBIT) {
    await prisma.account.update({
      where: { id: accountId },
      data: { availableCents: { decrement: amountCents } },
    })
  }

  // Fire Stripe payout for outbound ACH (Sixert → external bank) when configured
  if (
    txnDirection === TransactionDirection.DEBIT &&
    isStripeConfigured() &&
    externalAccount.stripeDestinationId
  ) {
    try {
      const payout = await createPayout({
        amountCents,
        destinationBankAccountId: externalAccount.stripeDestinationId,
        description: description ?? `ACH transfer to external account`,
        statementDescriptor: 'SIXERT BANK',
      })
      return {
        txn,
        stripePayoutId: payout.id,
        stripePayoutStatus: payout.status,
        note: `Transfer submitted via Stripe (payout ${payout.id}, ${payout.status})`,
      }
    } catch (stripeErr) {
      // Refund available balance on Stripe failure
      await prisma.account.update({
        where: { id: accountId },
        data: { availableCents: { increment: amountCents } },
      })
      const message = stripeErr instanceof Error ? stripeErr.message : 'Stripe payout failed'
      throw new ValidationError(`External transfer failed: ${message}`)
    }
  }

  // Inbound ACH (CREDIT) or no Stripe / no destination: pending
  if (txnDirection === TransactionDirection.CREDIT) {
    return { txn, note: 'ACH credit (inbound) submission pending; Stripe inbound not yet wired' }
  }
  return {
    txn,
    note: externalAccount.stripeDestinationId
      ? 'Stripe not configured (set STRIPE_SECRET_KEY in .env)'
      : 'Link this external account with Stripe to enable payouts',
  }
}
