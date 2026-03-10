const PII_KEYS = new Set([
  'password', 'passwordhash', 'token', 'accesstoken', 'refreshtoken',
  'email', 'ssn', 'taxid', 'accountnumber', 'routingnumber',
  'cardnumber', 'cvv', 'pin', 'secret', 'authorization',
]);

export function maskAccountNumber(accountNumber: string): string {
  return accountNumber.slice(-4);
}

export function maskRoutingNumber(routingNumber: string): string {
  return routingNumber.slice(-4);
}

export function redactPII(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactPII);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = PII_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : redactPII(value);
  }
  return result;
}
