import { PrismaClient, UserRole, AccountType, AccountStatus, TransactionDirection, TransactionStatus, TransferStatus, AuditEventType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const WORKSPACE_IDS = {
  acme: '11111111-1111-4111-8111-111111111111',
  beta: '22222222-2222-4222-8222-222222222222',
} as const;

async function main() {
  console.log('Seeding database...');

  await prisma.$transaction([
    prisma.refreshToken.deleteMany(),
    prisma.auditEvent.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.messageThread.deleteMany(),
    prisma.statement.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.achConsent.deleteMany(),
    prisma.achTransfer.deleteMany(),
    prisma.internalTransfer.deleteMany(),
    prisma.externalAccount.deleteMany(),
    prisma.limitDecision.deleteMany(),
    prisma.limitAssignment.deleteMany(),
    prisma.account.deleteMany(),
    prisma.workspaceMembership.deleteMany(),
    prisma.workspace.deleteMany(),
    prisma.user.deleteMany(),
    prisma.limitTier.deleteMany(),
  ]);

  console.log('Existing seedable data cleared.');

  // ------- Limit Tiers -------
  const tierDefs = [
    {
      name: 'New-Tenure',
      friendlyName: 'New Account (< 90 days)',
      perTxnMax: 1000,
      dailyCreditMax: 2000,
      dailyDebitMax: 2000,
      monthlyCreditMax: 10000,
      monthlyDebitMax: 10000,
      velocityMax: 3000,
      velocityWindowMinutes: 60,
      sameDayAchMax: 500,
    },
    {
      name: 'Standard-90+',
      friendlyName: 'Standard (90+ days)',
      perTxnMax: 10000,
      dailyCreditMax: 25000,
      dailyDebitMax: 25000,
      monthlyCreditMax: 100000,
      monthlyDebitMax: 100000,
      velocityMax: 50000,
      velocityWindowMinutes: 60,
      sameDayAchMax: 5000,
    },
    {
      name: 'Elevated',
      friendlyName: 'Elevated (approved)',
      perTxnMax: 50000,
      dailyCreditMax: 100000,
      dailyDebitMax: 100000,
      monthlyCreditMax: 500000,
      monthlyDebitMax: 500000,
      velocityMax: 200000,
      velocityWindowMinutes: 60,
      sameDayAchMax: 25000,
    },
    {
      name: 'Restricted',
      friendlyName: 'Restricted',
      perTxnMax: 100,
      dailyCreditMax: 500,
      dailyDebitMax: 500,
      monthlyCreditMax: 2000,
      monthlyDebitMax: 2000,
      velocityMax: 500,
      velocityWindowMinutes: 60,
      sameDayAchMax: 0,
    },
  ];

  const tiers: Record<string, string> = {};
  for (const t of tierDefs) {
    const tier = await prisma.limitTier.upsert({
      where: { name: t.name },
      update: {},
      create: {
        name: t.name,
        friendlyName: t.friendlyName,
        perTxnMax: t.perTxnMax,
        dailyCreditMax: t.dailyCreditMax,
        dailyDebitMax: t.dailyDebitMax,
        monthlyCreditMax: t.monthlyCreditMax,
        monthlyDebitMax: t.monthlyDebitMax,
        velocityMax: t.velocityMax,
        velocityWindowMinutes: t.velocityWindowMinutes,
        sameDayAchMax: t.sameDayAchMax,
        isActive: true,
      },
    });
    tiers[t.name] = tier.id;
  }
  console.log('Limit tiers seeded.');

  // ------- Users -------
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const tenureOld = new Date('2023-01-01');

  const userDefs = [
    { username: 'alice', email: 'alice@example.com', role: UserRole.PrimaryAdmin, tenureStartDate: tenureOld },
    { username: 'bob', email: 'bob@example.com', role: UserRole.AuthorizedUser, tenureStartDate: tenureOld },
    { username: 'carol', email: 'carol@example.com', role: UserRole.PrimaryAdmin, tenureStartDate: tenureOld },
    { username: 'dave', email: 'dave@example.com', role: UserRole.AuthorizedUser, tenureStartDate: tenureOld },
  ];

  const users: Record<string, string> = {};
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        passwordHash,
        role: u.role,
        tenureStartDate: u.tenureStartDate,
      },
    });
    users[u.username] = user.id;
  }
  console.log('Users seeded.');

  // ------- Workspaces -------
  const workspaceDefs = [
    { id: WORKSPACE_IDS.acme, name: 'Acme Corp' },
    { id: WORKSPACE_IDS.beta, name: 'Beta LLC' },
  ];

  const workspaces: Record<string, string> = {};
  for (const w of workspaceDefs) {
    const ws = await prisma.workspace.create({
      data: { id: w.id, name: w.name },
    });
    workspaces[w.name] = ws.id;
  }
  console.log('Workspaces seeded.');

  // ------- Memberships -------
  const membershipDefs = [
    { userId: users['alice'], workspaceId: workspaces['Acme Corp'], role: UserRole.PrimaryAdmin },
    { userId: users['alice'], workspaceId: workspaces['Beta LLC'], role: UserRole.PrimaryAdmin },
    { userId: users['bob'], workspaceId: workspaces['Acme Corp'], role: UserRole.AuthorizedUser },
    { userId: users['carol'], workspaceId: workspaces['Beta LLC'], role: UserRole.PrimaryAdmin },
    { userId: users['dave'], workspaceId: workspaces['Beta LLC'], role: UserRole.AuthorizedUser },
  ];

  for (const m of membershipDefs) {
    await prisma.workspaceMembership.upsert({
      where: { userId_workspaceId: { userId: m.userId, workspaceId: m.workspaceId } },
      update: {},
      create: m,
    });
  }
  console.log('Memberships seeded.');

  // ------- Accounts -------
  const accountDefs = [
    {
      workspaceId: workspaces['Acme Corp'],
      name: 'Acme Checking',
      accountNumber: '1000000001',
      routingNumber: '021000021',
      type: AccountType.Checking,
      availableBalance: 52340.55,
      currentBalance: 52340.55,
      interestRate: 0,
      interestEarned: 0,
    },
    {
      workspaceId: workspaces['Acme Corp'],
      name: 'Acme Savings',
      accountNumber: '1000000002',
      routingNumber: '021000021',
      type: AccountType.Savings,
      availableBalance: 110000.0,
      currentBalance: 110000.0,
      interestRate: 0.045,
      interestEarned: 412.5,
    },
    {
      workspaceId: workspaces['Beta LLC'],
      name: 'Beta Checking',
      accountNumber: '2000000001',
      routingNumber: '021000021',
      type: AccountType.Checking,
      availableBalance: 8750.25,
      currentBalance: 8750.25,
      interestRate: 0,
      interestEarned: 0,
    },
    {
      workspaceId: workspaces['Beta LLC'],
      name: 'Beta Savings',
      accountNumber: '2000000002',
      routingNumber: '021000021',
      type: AccountType.Savings,
      availableBalance: 34000.0,
      currentBalance: 34000.0,
      interestRate: 0.045,
      interestEarned: 127.5,
    },
  ];

  const accounts: string[] = [];
  for (const a of accountDefs) {
    const acc = await prisma.account.upsert({
      where: { accountNumber: a.accountNumber },
      update: {},
      create: {
        ...a,
        status: AccountStatus.Active,
        isMoveMoneyEligible: true,
        isClosed: false,
      },
    });
    accounts.push(acc.id);
  }
  console.log('Accounts seeded.');

  // ------- Transactions -------
  const txDescriptions = [
    { description: 'ACH Credit - Payroll', direction: TransactionDirection.Credit, amount: 5000 },
    { description: 'Wire Transfer In', direction: TransactionDirection.Credit, amount: 15000 },
    { description: 'Vendor Payment - Office Supplies', direction: TransactionDirection.Debit, amount: 342.5 },
    { description: 'Utility Bill - Electric', direction: TransactionDirection.Debit, amount: 218.75 },
    { description: 'ACH Debit - Insurance Premium', direction: TransactionDirection.Debit, amount: 1200 },
    { description: 'Internal Transfer Credit', direction: TransactionDirection.Credit, amount: 2500 },
    { description: 'Internal Transfer Debit', direction: TransactionDirection.Debit, amount: 2500 },
    { description: 'Interest Payment', direction: TransactionDirection.Credit, amount: 41.25 },
    { description: 'Service Fee', direction: TransactionDirection.Debit, amount: 25 },
    { description: 'Client Payment Received', direction: TransactionDirection.Credit, amount: 8000 },
  ];

  for (const accountId of accounts) {
    for (let i = 0; i < txDescriptions.length; i++) {
      const tx = txDescriptions[i];
      const daysAgo = (txDescriptions.length - i) * 3;
      const postedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      await prisma.transaction.create({
        data: {
          accountId,
          amount: tx.amount,
          currency: 'USD',
          direction: tx.direction,
          status: TransactionStatus.Posted,
          description: tx.description,
          postedAt,
          referenceId: uuidv4(),
        },
      });
    }
  }
  console.log('Transactions seeded.');

  // ------- Statements -------
  const statementMonths = ['2024-01', '2024-02', '2024-03', '2024-04'];
  for (const accountId of accounts) {
    for (const month of statementMonths) {
      await prisma.statement.upsert({
        where: { accountId_month: { accountId, month } },
        update: {},
        create: {
          accountId,
          month,
          downloadUrl: `/statements/${accountId}/${month}.pdf`,
        },
      });
    }
  }
  console.log('Statements seeded.');

  // ------- Message Threads -------
  const threadDefs = [
    {
      workspaceId: workspaces['Acme Corp'],
      subject: 'Wire Transfer Inquiry',
      messages: [
        { fromDisplay: 'Support Team', body: 'Hello, how can we assist you with your wire transfer today?' },
        { fromDisplay: 'alice', body: 'I need to initiate a wire for $50,000 to a vendor. What are the cutoff times?' },
        { fromDisplay: 'Support Team', body: 'Wires submitted before 5:00 PM ET are same-day. After that, next business day.' },
      ],
    },
    {
      workspaceId: workspaces['Acme Corp'],
      subject: 'Account Statement Request',
      messages: [
        { fromDisplay: 'alice', body: 'Can I get a paper statement for March 2024?' },
        { fromDisplay: 'Support Team', body: 'Paper statements are available upon request. We have initiated the mailing.' },
      ],
    },
    {
      workspaceId: workspaces['Beta LLC'],
      subject: 'ACH Setup Question',
      messages: [
        { fromDisplay: 'carol', body: 'We need to set up recurring ACH debits for our suppliers. How do we proceed?' },
        { fromDisplay: 'Support Team', body: 'Please visit the Move Money section to link external accounts and set up ACH transfers.' },
      ],
    },
    {
      workspaceId: workspaces['Beta LLC'],
      subject: 'Interest Rate Inquiry',
      messages: [
        { fromDisplay: 'dave', body: 'What is the current interest rate on savings accounts?' },
        { fromDisplay: 'Support Team', body: 'Current APY on business savings is 4.50%. Interest is credited monthly.' },
      ],
    },
  ];

  for (const t of threadDefs) {
    const thread = await prisma.messageThread.create({
      data: { workspaceId: t.workspaceId, subject: t.subject },
    });
    for (let i = 0; i < t.messages.length; i++) {
      const sentAt = new Date(Date.now() - (t.messages.length - i) * 60 * 60 * 1000);
      await prisma.message.create({
        data: {
          threadId: thread.id,
          fromDisplay: t.messages[i].fromDisplay,
          body: t.messages[i].body,
          isRead: true,
          sentAt,
        },
      });
    }
  }
  console.log('Message threads seeded.');

  // ------- Internal Transfer (sample) -------
  const idemKey = uuidv4();
  await prisma.internalTransfer.create({
    data: {
      workspaceId: workspaces['Acme Corp'],
      fromAccountId: accounts[0],
      toAccountId: accounts[1],
      amount: 2500,
      memo: 'Monthly reserve transfer',
      status: TransferStatus.Settled,
      referenceId: uuidv4(),
      effectiveDate: new Date(),
      idempotencyKey: idemKey,
    },
  });
  console.log('Sample internal transfer seeded.');

  // ------- Audit Event -------
  await prisma.auditEvent.create({
    data: {
      userId: users['alice'],
      eventType: AuditEventType.LOGIN,
      metadata: { note: 'seed' },
      ipAddress: '127.0.0.1',
    },
  });
  console.log('Seed audit event created.');

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
