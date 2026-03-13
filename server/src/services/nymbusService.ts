/**
 * Nymbus Core BaaS Integration Service
 *
 * Wraps the Nymbus sandbox REST API for:
 *  - OAuth token management (client-credentials)
 *  - Customer CRUD
 *  - Account CRUD
 *  - Internal transfers (book-to-book)
 *  - External transfers (ACH)
 *  - Transaction listing
 */

import logger from '../utils/logger.js';

// ─── Configuration ────────────────────────────────────────────────────────────
const NYMBUS_BASE_URL =
  process.env['NYMBUS_BASE_URL'] ??
  'https://nymbus-sandbox-app.livelyforest-3ab8d97c.westus2.azurecontainerapps.io';

const NYMBUS_CLIENT_ID =
  process.env['NYMBUS_CLIENT_ID'] ?? 'sandbox_tenantshahin_e3b11199';

const NYMBUS_CLIENT_SECRET =
  process.env['NYMBUS_CLIENT_SECRET'] ??
  'bc1432c6e21b725de125c3dcda1e3ee7927d7fda70cde3c3';

// ─── Token cache ──────────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0; // epoch-ms

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const res = await fetch(`${NYMBUS_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: NYMBUS_CLIENT_ID,
      client_secret: NYMBUS_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Nymbus OAuth failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  logger.info('Nymbus access token refreshed', {
    expiresIn: data.expires_in,
  });
  return cachedToken;
}

// ─── Generic request helper ───────────────────────────────────────────────────
async function nymbusRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };

  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const url = `${NYMBUS_BASE_URL}${path}`;
  logger.info(`Nymbus ${method} ${path}`);

  const res = await fetch(url, opts);
  const text = await res.text();

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  if (!res.ok) {
    logger.error(`Nymbus error ${res.status}`, { path, body: json });
    throw new Error(
      `Nymbus ${method} ${path} → ${res.status}: ${typeof json === 'string' ? json : JSON.stringify(json)}`,
    );
  }

  return json as T;
}

// ─── Customers ────────────────────────────────────────────────────────────────
export interface NymbusCustomer {
  id: string;
  externalId?: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
  kycStatus?: string;
}

export async function listCustomers(pageLimit = 100) {
  return nymbusRequest<{ data: NymbusCustomer[]; total: number }>(
    'GET',
    `/v1.2/customers?pageLimit=${pageLimit}`,
  );
}

export async function createCustomer(input: {
  firstName: string;
  lastName: string;
  email: string;
  ssn?: string;
  dateOfBirth?: string; // yyyy-MM-dd
}) {
  return nymbusRequest('POST', '/v1.2/customers', {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    ...(input.ssn && { ssn: input.ssn }),
    ...(input.dateOfBirth && { date_of_birth: input.dateOfBirth }),
  });
}

export async function searchCustomer(criteria: {
  email?: string;
  taxid?: string;
  name?: string;
}) {
  return nymbusRequest<NymbusCustomer[]>(
    'POST',
    '/v1.2/customers/search',
    criteria,
  );
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
export interface NymbusAccount {
  id: string;
  accountNumber?: string;
  routingNumber?: string;
  type?: string;
  productType?: string;
  status?: string;
  availableBalance?: number;
  currentBalance?: number;
  [key: string]: unknown;
}

export async function listAccounts(opts: {
  customerIds?: string;
  accountIds?: string;
  pageLimit?: number;
}) {
  const params = new URLSearchParams();
  if (opts.customerIds) params.set('customerIds', opts.customerIds);
  if (opts.accountIds) params.set('accountIds', opts.accountIds);
  params.set('pageLimit', String(opts.pageLimit ?? 100));

  return nymbusRequest<{ data: NymbusAccount[] } | NymbusAccount[]>(
    'GET',
    `/v1.2/accounts?${params.toString()}`,
  );
}

export async function createAccount(
  customerId: string,
  input: {
    type: 'checking' | 'savings' | 'money_market';
    initialDeposit?: number;
  },
) {
  return nymbusRequest(
    'POST',
    `/v1.2/customers/${customerId}/accounts`,
    {
      type: input.type,
      ...(input.initialDeposit != null && { initial_deposit: input.initialDeposit }),
    },
  );
}

export async function getCustomerAccounts(customerId: string) {
  return nymbusRequest<NymbusAccount[]>(
    'GET',
    `/v1.2/customers/${customerId}/accounts?pageLimit=100`,
  );
}

// ─── Internal transfers (book-to-book within Nymbus) ──────────────────────────
export interface NymbusTransferResponse {
  response?: { status: string; statusCode: number; message: string };
  transfer?: {
    id: string;
    type: string;
    sourceAccountNumber: string;
    targetAccountNumber: string;
    amount: number;
    nextTransferDate?: string;
    frequency?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function createInternalTransfer(input: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  idempotencyKey?: string;
}) {
  const headers: Record<string, string> = {};
  if (input.idempotencyKey) {
    headers['x-idempotency-key'] = input.idempotencyKey;
  }

  return nymbusRequest<NymbusTransferResponse>(
    'POST',
    '/v1.2/transactions/transfer',
    {
      from_account_id: input.fromAccountId,
      to_account_id: input.toAccountId,
      amount: input.amount,
      ...(input.description && { description: input.description }),
    },
    headers,
  );
}

// ─── External transfers (ACH) ────────────────────────────────────────────────
export interface NymbusExternalTransferResponse {
  response?: { status: string; statusCode: number; message: string };
  externalTransfer?: {
    id: string;
    type: string;
    accountNumber: string;
    amount: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function createExternalTransfer(input: {
  fromAccountId: string;
  accountNumber: string;
  routingNumber: string;
  accountType?: 'checking' | 'savings';
  amount: number;
  description?: string;
  recipientName?: string;
  idempotencyKey?: string;
}) {
  const headers: Record<string, string> = {};
  if (input.idempotencyKey) {
    headers['x-idempotency-key'] = input.idempotencyKey;
  }

  return nymbusRequest<NymbusExternalTransferResponse>(
    'POST',
    '/v1.2/transactions/externalTransfer',
    {
      from_account_id: input.fromAccountId,
      account_number: input.accountNumber,
      routing_number: input.routingNumber,
      account_type: input.accountType ?? 'checking',
      amount: input.amount,
      ...(input.description && { description: input.description }),
      ...(input.recipientName && { recipient_name: input.recipientName }),
    },
    headers,
  );
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export async function listTransactions(accountIds: string, pageLimit = 50) {
  return nymbusRequest(
    'GET',
    `/v1.2/transactions?accountIds=${accountIds}&pageLimit=${pageLimit}`,
  );
}
