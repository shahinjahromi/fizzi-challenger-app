# Fizzi Challenger - Database Design Principles

## Purpose
This document ensures all future database design and implementation for Fizzi Challenger conforms to industry best practices for financial applications.

## Principles

1. **Data Modeling & ER Design**
   - Identify entities: User, Account, Transaction, Statement, Consent, AuditLog, LimitTier, LimitAssignment
   - Use clear ER diagrams (include entity relationships, cardinality, etc.)

2. **Normalization**
   - Structure data in at least 3NF
   - Avoid redundancy, enforce integrity

3. **Constraints**
   - Use primary keys for identity
   - Define foreign keys for relationships (e.g., transactions reference accounts)
   - Apply unique and check constraints for business rules

4. **Indexes**
   - Index columns used in frequent queries (e.g., accountNumber, transactionDate, userId)
   - Use composite indexes for common filters/sorts

5. **Security**
   - Mask, anonymize, or encrypt sensitive information (account IDs, PII, passwords)
   - Store hashed passwords, encrypted tokens
   - Restrict access with roles and privileges

6. **Audit & Traceability**
   - Track all changes with AuditLog entity (userId, change, timestamp)
   - Record consents, approvals, and limit changes

7. **Scalability**
   - Design schemas for horizontal scaling (partition/shard where necessary)
   - Avoid cross-shard joins

8. **Backup & Recovery**
   - Document backup/restore workflows
   - Include last backup timestamps

9. **Compliance**
   - GDPR/PCI/industry standard fields
   - Support data lifecycle (retention/deletion)

## Entity List Example

- User (userId, name, email, ... )
- Account (accountId, userId, ... )
- Transaction (txnId, accountId, amount, type, status, ... )
- Statement (statementId, accountId, month, url, ... )
- Consent (consentId, userId, accountId, ...)
- AuditLog (auditId, entity, entityId, userId, changeType, timestamp)
- LimitTier (limitTierId, name, ruleConfig, ...)
- LimitAssignment (assignmentId, userId, accountId, tierId, effectiveFrom, ...)

## Future DB changes must be reviewed using the DB_REVIEW_CHECKLIST.md