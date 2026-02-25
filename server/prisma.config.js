// Load .env from server dir so DATABASE_URL is set when Prisma runs (e.g. migrate deploy)
const path = require('path')
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') })
} catch (_) {}

module.exports = {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
}
