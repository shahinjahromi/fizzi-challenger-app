/**
 * Nymbus Core API client.
 * Base URL: e.g. https://stoplight.io/mocks/nymbus-docs/nymbus-core-api/67754617
 * Each user is provisioned with an account and a ledger on Nymbus.
 */

import { env } from '../config/env'

function getBaseUrl(): string | undefined {
  return env.NYMBUS_BASE_URL
}

function hasBaseUrl(): boolean {
  const u = getBaseUrl()
  return typeof u === 'string' && u.length > 0
}

async function nymbusFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const baseUrl = getBaseUrl()
  if (!baseUrl) throw new Error('NYMBUS_BASE_URL is not set')
  const url = `${baseUrl.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Nymbus API ${res.status}: ${text || res.statusText}`)
  }
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return undefined as T
  }
}

export interface NymbusAccount {
  id: string
  [key: string]: unknown
}

export interface NymbusLedger {
  id: string
  [key: string]: unknown
}

/** Create or get account on Nymbus for a user (customer). */
export async function createNymbusAccount(customerId: string, displayName?: string): Promise<NymbusAccount> {
  const body = { customerId, name: displayName || customerId }
  return nymbusFetch<NymbusAccount>('/accounts', { method: 'POST', body })
}

/** Get account by id. */
export async function getNymbusAccount(accountId: string): Promise<NymbusAccount | null> {
  try {
    return await nymbusFetch<NymbusAccount>(`/accounts/${accountId}`)
  } catch {
    return null
  }
}

/** Create ledger on Nymbus for an account. */
export async function createNymbusLedger(accountId: string, name?: string): Promise<NymbusLedger> {
  const body = { accountId, name: name || `Ledger for ${accountId}` }
  return nymbusFetch<NymbusLedger>('/ledgers', { method: 'POST', body })
}

/** Get ledger by id. */
export async function getNymbusLedger(ledgerId: string): Promise<NymbusLedger | null> {
  try {
    return await nymbusFetch<NymbusLedger>(`/ledgers/${ledgerId}`)
  } catch {
    return null
  }
}

export function isNymbusConfigured(): boolean {
  return hasBaseUrl()
}
