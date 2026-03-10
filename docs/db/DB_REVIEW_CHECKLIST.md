# Fizzi Challenger - Database Review Checklist

## Use this checklist before approving any DB change or implementation!

- [ ] Entity relationships are mapped (User, Account, Transaction, Statement, Consent, AuditLog, Limits)
- [ ] All fields have correct types (UUIDs, DECIMALS, timestamps)
- [ ] Primary and foreign keys present for all entities
- [ ] Business rules are enforced via unique/check constraints
- [ ] Sensitive fields are masked/encrypted (PII, tokens, passwords)
- [ ] Indexes defined for frequent query columns (accountId, userId, timestamp, etc.)
- [ ] Backup/recovery and compliance fields documented
- [ ] Audit trails and traceability logs implemented
- [ ] Schema is normalized (at least 3NF)
- [ ] No redundant, orphan, or denormalized fields unless justified (document justification)
- [ ] ER diagram produced/updated
- [ ] Migration/rollback scripts available
- [ ] Data lifecycle (retention/deletion, GDPR compliance) addressed
- [ ] Peer-reviewed and signed off

## Attach DB_DESIGN_PRINCIPLES.md and DB_SCHEMA_TEMPLATE.md to all reviews for reference.