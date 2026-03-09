# Decisions

## 2026-02-26
- Adopt a unified, repo-friendly requirements export under docs/requirements/ with stable FR and NFR identifiers.
- Treat DRyVE (ZiFi) items as in-scope when explicitly labeled in the source PRD/SRS, and normalize them into the same FR/NFR set.
- Implement limits decisioning as an explicit service/API step, with decision snapshots attached to transfer events for auditability.
- Keep complex entitlements UI and full dual-approval workflows out of scope for Phase 1.

## 2026-03-09
- Adopt Transmit Security Mosaic as the primary customer identity platform for username/password login, MFA, and account recovery flows.
- Adopt Nymbus Core as the banking core system of record for accounts, balances, transactions, and limits.
- Adopt Mastercard Finicity Open Finance as the provider for external account linking and aggregation used in ACH and related flows.
