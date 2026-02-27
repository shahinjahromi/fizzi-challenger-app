# UI contracts

## Global UI rules
- No PII or message body content in notifications.
- Mask account identifiers (last-4) consistently across pages.
- Provide precise, actionable error messages.
- Maintain visible loading states.
- Follow ZiFi design system patterns where specified.

## Login
- Identifier field supports username or email.
- Input validation and accessible error messaging.
- MFA input step when required.
- Forgot password returns to clean login state with no residual banners and no prefilled username.
- Forgot username flow does not reveal username in-app and communicates delivery via verified channel.

## Workspace selector
- Lists entitled entities.
- Keyboard accessible.
- Switching workspaces refreshes all scoped data and invalidates caches.

## Dashboard / accounts overview
- Summary cards show total available balance and per-account rows with click-through.
- Quick actions: Move Money, Statements, Linked Accounts, Support.
- Header shows last login.
- Left nav highlights active route.
- Footer includes compliance links.

## Account details
- Details panel includes masked account/routing.
- Shows interest rate and interest earned when available.
- Indicates scheduled payments when applicable.
- Transactions table supports search, sort, and pagination.
- Null/partial data renders placeholders without layout breakage.

## Money movement
### Move Money landing hub
- Cards for Internal, External, and Send Money.
- Link to manage linked external accounts.

### Internal transfer
- Three-screen flow: Form -> Review -> Confirmation.
- Form validations: prevent same-account, insufficient funds.
- Review shows masked details and key notices (including FDIC notice if required).
- Confirmation includes status, reference, and timestamp.
- Cutoff rule messaging reflects 1:00 PM ET next-business-day posting.

### ACH
- External account linking via Finicity modal.
- ACH form validates routing/account with specific errors.
- Consumer debit requires disclosures (Reg E, NACHA, E-Sign) and explicit consent.

## Messaging
- Inbox and thread view.
- Compose with character limit handling and character count.
- Read/unread state.
- Draft persistence across devices.

## Notifications
- Deep links and timestamps.
- Unread badges.
- No sensitive content.

## Profile and security center
- Profile is view-only and entitlement-aware.
- Security center is a hub with rows:
  - Username
  - Password (renders exactly 16 bullets)
  - 2-step verification (icons for enabled methods)
  - Trusted devices (count when >0)
- Step-up authentication once per session unless policy requires another challenge.
- Dynamic row visibility based on entitlement/policy.

## Limits & approvals messaging
- If blocked, show a specific user-friendly reason.
- Do not display internal tier names.
- Review screen may include informational notes (e.g., same-day ACH limit) using friendly copy.
