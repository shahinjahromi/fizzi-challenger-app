# Non-functional requirements

## Security, privacy, and compliance
- **NFR-001**: The system must mask account identifiers in customer-facing UI and notifications (e.g., last-4 only).
- **NFR-002**: The system must not include PII or message body content in notifications.
- **NFR-003**: The system must not log PII and must apply a data classification policy to logs.
- **NFR-004**: The system must follow OWASP-aligned secure coding practices.
- **NFR-005**: The system must produce an audit trail for authentication events, MFA events, account recovery events, consent events, and limit override events.
- **NFR-006**: The forgot-username flow must use rate limiting and CAPTCHA to mitigate enumeration and abuse.
- **NFR-007**: Account recovery and consent tokens must be short-lived.
- **NFR-008**: JWT handling and secrets management must use production-grade practices.

## Reliability and correctness
- **NFR-009**: Money movement endpoints must be idempotent and safe to retry.
- **NFR-010**: The system must implement retries with exponential backoff for transient upstream failures.
- **NFR-011**: The system must maintain correct transaction lifecycle semantics (Pending -> Hold -> Posted) and must not mark completion prematurely.
- **NFR-012**: The system must prevent duplicate notifications for money movement lifecycle events.
- **NFR-013**: The system must ensure balance consistency between available and current balances, including holds and pending items.

## Performance
- **NFR-014**: Typical latency for workspace switch, accounts load, and dashboard summary should target under 1 second in normal conditions.
- **NFR-015**: Client caching must be implemented with correct invalidation on workspace switch and session re-authentication.

## Observability
- **NFR-016**: The system must propagate correlation IDs end-to-end across client, API, and upstream systems.
- **NFR-017**: The system must emit domain events for login, workspace switch, internal transfer submission, ACH submission, statement download, and limit decisioning.
- **NFR-018**: Audit logs must capture applied tiers and thresholds consulted for limit decisions, including tenure and standing snapshots.

## Accessibility
- **NFR-019**: The web application must meet WCAG 2.1 AA requirements.
- **NFR-020**: Reskinned components and critical flows must be keyboard accessible and include appropriate ARIA roles.

## Maintainability
- **NFR-021**: Requirements and outputs must remain deterministic and diff-friendly for version control, avoiding unnecessary churn.
