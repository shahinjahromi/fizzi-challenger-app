import { prisma } from '../config/prisma'
import { NotFoundError, ValidationError } from '../utils/errors'
import { hashPassword, verifyPassword } from '../utils/password'

const safeUserSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  standing: true,
  tenureStartDate: true,
  businessAddressLine1: true,
  businessAddressLine2: true,
  businessCity: true,
  businessState: true,
  businessPostalCode: true,
  businessCountry: true,
  createdAt: true,
  updatedAt: true,
} as const

export type ProfilePayload = {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  standing: string
  tenureStartDate: Date
  businessAddressLine1: string | null
  businessAddressLine2: string | null
  businessCity: string | null
  businessState: string | null
  businessPostalCode: string | null
  businessCountry: string | null
  createdAt: Date
  updatedAt: Date
}

export async function getProfile(userId: string): Promise<ProfilePayload> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  })
  if (!user) throw new NotFoundError('User')
  return user as ProfilePayload
}

export interface UpdateProfileBody {
  username?: string
  firstName?: string
  lastName?: string
  businessAddressLine1?: string | null
  businessAddressLine2?: string | null
  businessCity?: string | null
  businessState?: string | null
  businessPostalCode?: string | null
  businessCountry?: string | null
}

export async function updateProfile(userId: string, body: UpdateProfileBody): Promise<ProfilePayload> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new NotFoundError('User')

  const data: Record<string, unknown> = {}
  if (body.username !== undefined) data.username = body.username.trim()
  if (body.firstName !== undefined) data.firstName = body.firstName.trim()
  if (body.lastName !== undefined) data.lastName = body.lastName.trim()
  if ('businessAddressLine1' in body) data.businessAddressLine1 = body.businessAddressLine1 ?? null
  if ('businessAddressLine2' in body) data.businessAddressLine2 = body.businessAddressLine2 ?? null
  if ('businessCity' in body) data.businessCity = body.businessCity ?? null
  if ('businessState' in body) data.businessState = body.businessState ?? null
  if ('businessPostalCode' in body) data.businessPostalCode = body.businessPostalCode ?? null
  if ('businessCountry' in body) data.businessCountry = body.businessCountry ?? null

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: safeUserSelect,
  })
  return updated as ProfilePayload
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters')
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new NotFoundError('User')

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) throw new ValidationError('Current password is incorrect')

  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })
}
