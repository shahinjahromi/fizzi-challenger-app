import { prisma } from '../config/prisma'

export async function getWorkspacesForUser(userId: string) {
  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: 'asc' },
  })

  return memberships.map((m: typeof memberships[number]) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    role: m.role,
    createdAt: m.workspace.createdAt,
  }))
}
