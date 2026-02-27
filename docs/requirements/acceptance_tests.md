# Acceptance tests

## Authentication & session
- User can log in with username/password and sees a loading state while authentication is in progress.
- Invalid credentials show precise errors without exposing sensitive info.
- After completing password reset, the login screen shows no banners and no prefilled username.
- On session timeout, re-authentication clears and re-initializes workspace and account caches.
- Forgot-username requests are rate-limited, CAPTCHA-protected, audited, and deliver username only via verified channel.

## Workspaces
- Workspace selector lists all entitled entities.
- Switching workspaces refreshes balances, transactions, and feature flags.
- After switching, dashboard and accounts remain scoped to selected workspace across navigation.
- Workspace switching is keyboard accessible.

## Accounts overview
- Accounts list shows name, last-4, type, current and available balances.
- Accounts not eligible for money movement are clearly indicated.
- Closed accounts are hidden by default and shown only when explicitly enabled.
- Dashboard summary cards reflect pending/posted deltas accurately.

## Account details & activity
- Transaction table shows posted and pending items, newest-first.
- Pending debits reduce available balance immediately.
- Current balance updates on posting.
- Internal transfers create paired debit/credit entries.
- Null fields render placeholders without breaking layout.

## Internal transfers
- Same-account transfers are blocked with an actionable error and no transaction is created.
- Insufficient funds blocks submission with an actionable error and no transaction is created.
- Submissions after 1:00 PM ET show pending until next business day.
- Review screen shows masked details and key notices.
- Confirmation screen shows success, reference id, and timestamp.

## ACH
- Inbound transfer can be initiated from a linked external account.
- Outbound transfer can be initiated to a linked or ad hoc external account.
- Invalid routing/account inputs show specific errors and prevent requests to core.
- Lifecycle notifications are not duplicated.
- Consumer debit requires disclosures and consent; without consent, submission is blocked.

## Statements
- Only available months are listed.
- Download returns a valid non-empty PDF.
- Backend errors are handled with a user-friendly error state.

## Messaging & notifications
- Inbox and thread views function end-to-end.
- Compose enforces character limits and shows character count.
- Drafts persist across devices.
- Notifications include deep links, timestamps, and unread badges.
- Notifications do not include message body or PII.
- New message notifications include thread identifier for deep link.

## Profile & security center
- Profile is view-only and entitlement-aware.
- Security Center requires step-up once per session unless policy requires otherwise.
- Password row renders exactly 16 bullets.
- 2-step verification icons reflect enabled factors.
- Trusted devices count displays only when >0.

## Limits & approvals
- Tenure defaulting applies: under 90 days uses New-Tenure; 90+ days in good standing uses Standard-90+.
- Most restrictive enforcement applies when both user and account assignments exist.
- Banker override takes effect immediately for the next submission and is audited.
- Fraud downgrade forces Restricted tier regardless of tenure.
- Predictive scheduling blocks future-dated transfers that would breach daily/monthly max on scheduled date.
- Same-day ACH sub-limit is enforced where configured and provides a friendly breach message.
