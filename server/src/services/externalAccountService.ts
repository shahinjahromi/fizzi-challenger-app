import { prisma } from '../config/prisma'
import { ForbiddenError, ValidationError } from '../utils/errors'
import { isStripeConfigured, createConnectExpressAccount, addBankAccountToConnectedAccount } from './stripeService'
import { ExternalAccountType } from '@prisma/client'

export async function listExternalAccounts(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')

  return prisma.externalAccount.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Link a Stripe Connect external account for the workspace (one per workspace).
 * Creates a Stripe Express connected account and a test bank; transfers to it will appear in Stripe Dashboard.
 */
export async function linkStripeConnectForWorkspace(
  workspaceId: string,
  userId: string,
  nickname?: string
) {
  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    include: { workspace: true },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')
  if (!isStripeConfigured()) throw new ValidationError('Stripe is not configured (STRIPE_SECRET_KEY)')

  const workspace = membership.workspace

  if (workspace.stripeConnectedAccountId) {
    const existing = await prisma.externalAccount.findFirst({
      where: { workspaceId, stripeDestinationId: workspace.stripeConnectedAccountId },
    })
    if (existing) return { externalAccount: existing, created: false }
    // Workspace has Connect account but no ExternalAccount record — create the record only
    const externalAccount = await prisma.externalAccount.create({
      data: {
        workspaceId,
        nickname: nickname ?? `${workspace.name} → Stripe`,
        type: ExternalAccountType.CHECKING,
        maskedNumber: '••••6789',
        routingNumber: '110000000',
        stripeDestinationId: workspace.stripeConnectedAccountId,
        isVerified: true,
      },
    })
    return { externalAccount, created: true }
  }

  const account = await createConnectExpressAccount({
    workspaceName: workspace.name,
    email: `workspace-${workspace.id}@sixert-demo.test`,
  })
  await addBankAccountToConnectedAccount(account.id, { accountHolderName: workspace.name })

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { stripeConnectedAccountId: account.id },
  })

  const externalAccount = await prisma.externalAccount.create({
    data: {
      workspaceId,
      nickname: nickname ?? `${workspace.name} → Stripe`,
      type: ExternalAccountType.CHECKING,
      maskedNumber: '••••6789',
      routingNumber: '110000000',
      stripeDestinationId: account.id,
      isVerified: true,
    },
  })

  return { externalAccount, created: true }
}
