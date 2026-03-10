# Functional requirements

## Authentication & session
- **FR-001**: The system must support username and password login with visible loading states and precise error messages.
- **FR-002**: The system must support a forgot-password flow that sends a reset link to the email address on file, guides the user through verifying their username, clearing any existing MFA state, and choosing a new password, and on completion returns the user to a clean login state with no residual banners and no prefilled values while enforcing MFA again on the next login when required by policy.
- **FR-003**: The system must support username recovery without revealing the username in-app.
- **FR-004**: On session expiration, the system must clear workspace and account caches and require re-authentication.
- **FR-005**: After re-authentication, the system must re-initialize workspace and account state.
- **FR-006**: For multi-entity users, the system must load all entitled entities.
- **FR-007**: For single-workspace users, the system must automatically select the workspace and bypass workspace selection.
- **FR-008**: The login experience must support username or email input with input validation.
- **FR-009**: When MFA is required by policy, the login experience must collect and verify MFA via a mobile one-time passcode sent to the verified mobile number on file or another approved factor and then proceed through verification.
- **FR-010**: The forgot-username flow must deliver the username only via a verified channel after multi-factor identity checks, must use rate limiting and CAPTCHA, and must create an audit trail.

## Workspaces (multi-entity)
- **FR-011**: The system must provide a workspace selector that lists all entitled entities.
- **FR-012**: Switching workspaces must force refresh of balances, transactions, and feature flags and must invalidate client caches.
- **FR-013**: After switching workspaces, dashboard and accounts views must remain scoped to the selected workspace, including after back navigation.
- **FR-014**: Workspace switching UI must follow the ZiFi design system and be keyboard accessible.

## Accounts overview
- **FR-015**: The system must list accounts with account name, masked account number (last 4), account type, current balance, and available balance.
- **FR-016**: The system must indicate when an account is not eligible for money movement.
- **FR-017**: Closed accounts must be hidden by default and viewable via an explicit option.
- **FR-018**: The dashboard must provide summary cards including total available balance and per-account rows with click-through.
- **FR-019**: The UI must provide quick actions including Move Money, Statements, Linked Accounts, and Support.
- **FR-020**: The application header must show the last login timestamp.
- **FR-021**: The left navigation must highlight the active route.
- **FR-022**: The application must provide a footer with compliance links.

## Account details & activity
- **FR-023**: The system must show posted and pending transactions with description, amount, status, counterpart, and relevant timestamps.
- **FR-024**: Transaction list ordering must be newest-first with stable sorting across transaction types.
- **FR-025**: Internal transfers must produce paired ledger entries (debit and credit) in the respective accounts.
- **FR-026**: The system must remove warehousing or internal markers from customer-visible transaction descriptions.
- **FR-027**: The account details panel must show masked account and routing numbers.
- **FR-028**: The account details panel must show interest rate and interest earned when available.
- **FR-029**: The account details view must indicate scheduled payments when applicable.
- **FR-030**: The transactions table must support search, sort, and pagination.
- **FR-031**: The UI must render null or partial transaction fields with placeholders without breaking layout.

## Money movement - internal transfers
- **FR-032**: The system must provide an internal transfer form allowing selection of From account, To account, amount, and optional memo.
- **FR-033**: The system must prevent transfers between the same account.
- **FR-034**: The system must prevent internal transfers when available funds are insufficient and must not create a transaction on blocked attempts.
- **FR-035**: The internal transfer flow must include Form, Review, and Confirmation screens.
- **FR-036**: The review screen must show masked details and key notices.
- **FR-037**: The confirmation screen must show success status, a reference identifier, and a timestamp.
- **FR-038**: The system must apply cutoff rules for internal transfers: submissions after 1:00 PM ET must post the next business day.
- **FR-039**: The system must provide a Move Money landing hub with cards for Internal, External, and Send Money, plus links to manage linked accounts.
- **FR-040**: The internal transfer UI must support date selection that enforces business-day rules.

## Money movement - ACH (inbound and outbound)
- **FR-041**: The system must support inbound ACH transfers from linked external accounts.
- **FR-042**: The system must support outbound ACH transfers to linked external accounts and to ad hoc external accounts.
- **FR-043**: The system must validate routing and account numbers and show specific errors for invalid inputs before initiating a core request.
- **FR-044**: The system must respect cutoff times and lifecycle states for ACH transfers.
- **FR-045**: The system must avoid premature success notifications and must not generate duplicate notifications.
- **FR-046**: The system must support external account linking via a Mastercard Finicity Open Finance modal integration with clear success, cancel, and error handling.
- **FR-047**: For consumer debit ACH, the system must present Reg E, NACHA, and E-Sign disclosures before submission.
- **FR-048**: For consumer debit ACH, the system must capture consent artifacts including timestamp, IP address, and externalAccountId and store auditable records.
- **FR-049**: For consumer debit ACH, the system must block submission if consent is not captured.
- **FR-050**: The system must bypass ACH Level-3 consent requirements for business accounts.

## Statements & documents
- **FR-051**: The system must list available statement months per account.
- **FR-052**: The system must not list statement months that do not exist.
- **FR-053**: The system must allow downloading statements as PDFs.
- **FR-054**: The system must handle backend errors gracefully for statement listing and downloads.
- **FR-055**: The system must treat blank or invalid PDFs as errors.

## Messaging & notifications
- **FR-056**: The system must provide an inbox and thread view for secure messages.
- **FR-057**: The system must allow composing messages and tracking read/unread state.
- **FR-058**: The compose experience must display a character count or enforce character limits.
- **FR-059**: The system must support cross-device draft persistence.
- **FR-060**: Message history in a thread must be ordered chronologically.
- **FR-061**: Notifications must include deep links, timestamps, and unread badges.
- **FR-062**: Notifications must not include message body content or PII.
- **FR-063**: Notifications must carry a thread identifier to support deep links.
- **FR-064**: The system must support risk alert email templates for operations.
- **FR-065**: The system must support mobile push notification configuration and delivery for iOS and Android.

## Profile & security center
- **FR-066**: The system must provide a unified, view-only Profile experience aggregating data from onboarding/core and the identity provider.
- **FR-067**: The Profile experience must be entitlement-aware and must adjust visible sections for Authorized Users.
- **FR-068**: The Profile experience must link to the Security Center for editing MFA contacts.
- **FR-069**: The system must provide a Security Center hub that includes rows for Username, Password, 2-Step Verification, and Trusted Devices.
- **FR-070**: The Password row in Security Center must render exactly 16 bullets.
- **FR-071**: The 2-Step Verification row must show icons for enabled methods.
- **FR-072**: The Trusted Devices row must show a count when the count is greater than zero.
- **FR-073**: The Security Center must require a single step-up authentication per session unless identity policy requires another challenge.
- **FR-074**: Only applicable rows must be displayed based on entitlement and policy.

## Limits & approvals
- **FR-075**: The system must enforce configurable transaction limits that vary by tenure and standing.
- **FR-076**: The system must support a LimitTier catalog that is extensible and includes at minimum New-Tenure, Standard-90+, Elevated, and Restricted tiers.
- **FR-077**: The system must support LimitAssignment for subjectType user or account, subjectId, tierId, effective dates, override reason, and assignedBy.
- **FR-078**: Tenure defaulting must apply at submission time: under 90 days uses New-Tenure, and 90+ days with good standing uses Standard-90+.
- **FR-079**: Banker overrides must take effect immediately and must be auditable.
- **FR-080**: Fraud or risk signals must be able to force Restricted tier regardless of tenure until cleared.
- **FR-081**: When both a user and an account have assignments, the system must enforce the most restrictive effective thresholds.
- **FR-082**: The system must support thresholds including per-transaction max, daily credit/debit max, monthly credit/debit max, optional velocity constraints, and optional Same-Day ACH sub-limits.
- **FR-083**: Limits must apply to internal transfers and ACH transfers, including immediate and future-dated transfers.
- **FR-084**: Scheduled transfers must be evaluated predictively against projected daily and monthly consumption for the scheduled date.
- **FR-085**: The decision outcome must be evaluated at submission time and must attach the applied tier and thresholds to the transfer event for audit.
- **FR-086**: When a transaction is blocked, the UI must show a specific user-friendly reason.
- **FR-087**: The UI must not expose internal tier names and must use friendly copy.

## Traceability
- **FR-088**: The project must maintain a traceability matrix mapping requirements to source backlog item identifiers for Fizzi Challenger and DRyVE using Fizzi_Challenger_Traceability_Matrix.csv/.xlsx.
