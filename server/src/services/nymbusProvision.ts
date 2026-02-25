import { prisma } from '../config/prisma'
import { createNymbusAccount, createNymbusLedger, isNymbusConfigured } from './nymbusClient'

/**
 * Ensures the user has an account and a ledger on Nymbus.
 * Creates them via Nymbus Core API if missing; updates user record with ids.
 */
export async function ensureNymbusAccountAndLedger(userId: string): Promise<void> {
  if (!isNymbusConfigured()) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nymbusAccountId: true, nymbusLedgerId: true, email: true, username: true },
  })
  if (!user) return

  let accountId = user.nymbusAccountId
  let ledgerId = user.nymbusLedgerId

  if (!accountId) {
    try {
      const account = await createNymbusAccount(userId, `${user.username} (${user.email})`)
      accountId = account.id
      await prisma.user.update({
        where: { id: userId },
        data: { nymbusAccountId: accountId },
      })
    } catch (err) {
      console.warn('Nymbus account creation failed for user', userId, err)
      return
    }
  }

  if (!ledgerId && accountId) {
    try {
      const ledger = await createNymbusLedger(accountId, `Ledger-${user.username}`)
      ledgerId = ledger.id
      await prisma.user.update({
        where: { id: userId },
        data: { nymbusLedgerId: ledgerId },
      })
    } catch (err) {
      console.warn('Nymbus ledger creation failed for user', userId, err)
    }
  }
}
