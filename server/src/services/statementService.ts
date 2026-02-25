import { prisma } from '../config/prisma'
import { ForbiddenError, NotFoundError } from '../utils/errors'
import PDFDocument from 'pdfkit'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export async function listStatements(accountId: string, userId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } })
  if (!account) throw new NotFoundError('Account')

  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: account.workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')

  return prisma.statement.findMany({
    where: { accountId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
}

export async function getStatementById(statementId: string, userId: string) {
  const statement = await prisma.statement.findUnique({
    where: { id: statementId },
    include: { account: true },
  })
  if (!statement) throw new NotFoundError('Statement')

  const membership = await prisma.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: statement.account.workspaceId } },
  })
  if (!membership) throw new ForbiddenError('Not a member of this workspace')

  return statement
}

export function generateStatementPdf(statement: { account: { name: string }; month: number; year: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const monthName = MONTH_NAMES[statement.month - 1] || String(statement.month)
    doc.fontSize(20).text('Sixert Bank', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(14).text(`Account Statement: ${statement.account.name}`, { align: 'center' })
    doc.fontSize(12).text(`${monthName} ${statement.year}`, { align: 'center' })
    doc.moveDown(2)

    doc.fontSize(10).text('This is your account statement for the period listed above.', { align: 'left' })
    doc.moveDown(0.5)
    doc.text('Account activity and balance summary would appear here in a full implementation.', { align: 'left' })
    doc.moveDown(1)
    doc.text(`Statement generated on ${new Date().toLocaleDateString('en-US')}.`, { align: 'left' })
    doc.moveDown(2)
    doc.fontSize(9).text('Sixert Bank — SMB Banking Platform. This is a sample statement.', { align: 'center' })

    doc.end()
  })
}
