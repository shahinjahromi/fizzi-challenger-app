import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:4200'),
  // Optional Finicity open-banking vars
  FINICITY_APP_KEY: z.string().optional(),
  FINICITY_PARTNER_ID: z.string().optional(),
  FINICITY_PARTNER_SECRET: z.string().optional(),
  // Nymbus Core API (e.g. Stoplight mock)
  NYMBUS_BASE_URL: z
    .union([z.string().url(), z.literal('')])
    .optional()
    .transform((s) => (s === '' ? undefined : s)),
  // Stripe (sandbox) for external transfers
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
})

function loadEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Invalid environment variables:')
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    })
    process.exit(1)
  }
  return result.data
}

export const env = loadEnv()
