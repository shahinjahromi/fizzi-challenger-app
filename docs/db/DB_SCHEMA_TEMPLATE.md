# Fizzi Challenger - Database Schema Documentation Template

## Schema Version: [YYYY-MM-DD or semantic version]

## Entities

### User
| Field      | Type       | Constraints                 | Description      |
|------------|------------|----------------------------|------------------|
| userId     | UUID       | PK, unique                 | User identifier  |
| email      | VARCHAR    | unique, not null           | Login email      |
| password   | VARCHAR    | hashed, not null           | Login password   |
| ...        | ...        | ...                        | ...              |

### Account
| Field        | Type     | Constraints        | Description      |
|--------------|----------|-------------------|------------------|
| accountId    | UUID     | PK, unique        | Account ID       |
| userId       | UUID     | FK(User.userId)   | Owner User       |
| balance      | DECIMAL  | not null          | Current balance  |
| ...          | ...      | ...               | ...              |

### Transaction
| Field        | Type     | Constraints            | Description           |
|--------------|----------|-----------------------|-----------------------|
| txnId        | UUID     | PK, unique            | Transaction ID        |
| accountId    | UUID     | FK(Account.accountId) | Related account      |
| amount       | DECIMAL  | not null              | Transaction amount    |
| type         | VARCHAR  | CHECK(type IN ...)    | Debit/Credit/ACH/...  |
| status       | VARCHAR  | ...                   | Posted/Pending/...    |
| timestamp    | TIMESTAMP| not null              | Posting time          |
| ...          | ...      | ...                   | ...                   |

### Statement
| Field        | Type     | Constraints            | Description      |
|--------------|----------|-----------------------|------------------|
| statementId  | UUID     | PK, unique            | Statement ID     |
| accountId    | UUID     | FK(Account.accountId) | Account          |
| month        | DATE     | not null              | Statement month  |
| url          | VARCHAR  | not null              | PDF location     |

### Consent, AuditLog, LimitTier, LimitAssignment
- [Expand each entity per principle: PKs, FKs, encrypted fields, timestamp, relations]

## Constraints, Indexes, Relationships
- List ALL PKs, FKs, unique/check constraints, composite indexes!
- Provide migration scripts if possible
- Note encryption/masking (for PII, IDs, tokens)
- Document backup/recovery and compliance fields

## ER Diagram
- Insert or link to latest ER diagram (draw.io, Mermaid, etc.)

## Revision Log
| Date       | Author    | Description            |
|------------|-----------|------------------------|
| YYYY-MM-DD | name      | Initial schema created |
