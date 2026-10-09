# Payment Alerts: Approved Notification Channel

Source ID: retail-high-value-alerts
Owner: Retail Banking Product Council
Status: APPROVED
Decision date: 2026-09-15
Scope: Retail payment-alert notification channel. This does not define fraud-screening integrations.

This approved decision resolves the notification channel for the retail alert launch.

## UB-4823: Choose the Alert Channel

- SMS is the launch notification channel; email and push are outside this launch scope.
- Check SMS consent before sending. Without consent, skip the notification and audit the outcome.

## UB-4821: SMS Payment Alerts

- Send an alert only for a posted personal-customer debit strictly above R50,000. The boundary amount of exactly R50,000 must not trigger an alert.
- In the Ubuntu Bank workshop fixture, compare the stored cent amount as `amount_cents > 5_000_000`.
- Obtain SMS consent from the approved notification API before attempting delivery. Do not infer consent from customer type, payment data, or a missing consent record.
- Use `ConsentService.hasConsent(customerId, "SMS")` for that check. It must call the approved `getConsent` operation; a default, inferred, hard-coded, or placeholder consent result is not acceptable.
- Messages and audit records must not contain account numbers or other private account details. Use a masked reference where a support-facing reference is required.
- Publish one complete audit event through the internal `EventPublisher` for every attempted or skipped delivery. Include only event type, outcome, channel `SMS`, timestamp, and a masked reference or safe correlation identifier; never include `customerId`, payment ID, raw references, or message content.
- Send through the typed `NotificationClient` with a stable internal delivery key. Retryable failures must safely retry without a duplicate customer-facing notification, recording `RETRYING`; exhausted or non-retryable failures record `FAILED`.
- Do not leave a `TODO`, placeholder, no-op helper, or “assume true” implementation in the proposal for consent, masking, audit publication, or delivery retry/idempotency.
- Proposed tests must cover the exact R50,000 boundary, an above-threshold consented payment, and a missing-consent payment. In proposal-only workflows, describe these as proposed tests; do not claim they executed.
- Proposed tests must also verify the safe audit event, the absence of PII in logs/audit data, and no duplicate customer-facing notification for a repeated delivery attempt.
- The workshop notification delivery is simulated. Do not claim a real SMS was sent or use simulated delivery as evidence of production execution.

## UB-4822: Safe Notification Logs

For the Safe notification logs work item, all of the following are required before a proposal is ready for approval:

- Use `ConsentService.hasConsent(customerId, "SMS")` immediately before an SMS delivery attempt. Its implementation must obtain the customer's SMS consent from the approved notification API `getConsent`; it must not return a default, inferred, or hard-coded consent value.
- When consent is absent or denied, do not send an SMS. Record only a non-sensitive outcome such as `SKIPPED_NO_SMS_CONSENT` and a masked reference.
- Delivery, retry, failure, and audit logs must never contain an account number, raw payment reference, or full notification message. Use a stable masked reference such as `****1234` or a generated safe correlation identifier.
- The same masking rule applies to log arguments, exception messages, and audit metadata. Do not rely on a message template alone to prevent PII exposure.
- Record one audit event for every delivery attempt or skipped delivery. The audit event must contain only: event type, outcome, channel `SMS`, timestamp, and a masked reference or safe correlation identifier.
- Approved outcomes are `SKIPPED_NO_SMS_CONSENT`, `DELIVERED`, `RETRYING`, and `FAILED`. Do not write `customerId`, account number, payment ID, raw payment reference, or message body to application logs or audit records.
- Publish each audit event through the approved internal `EventPublisher`; do not use a placeholder, `TODO`, no-op method, or an unimplemented helper for audit recording. The proposed source and diff must include the complete event creation and publication path.
- Send through the typed `NotificationClient` with a stable internal delivery key so a repeated attempt is idempotent. Retryable delivery failures must record `RETRYING`; exhausted or non-retryable failures must record `FAILED`. Never log the delivery key if it contains an internal customer or payment identifier.
- Proposed tests must prove: consented above-threshold delivery; denied or missing SMS consent skips delivery and records `SKIPPED_NO_SMS_CONSENT`; each delivery result creates one safe audit event; and log/audit content does not expose an account number, customer ID, payment ID, or raw payment reference.
- Proposed tests must also prove that a repeated delivery attempt uses the same internal delivery key and produces no duplicate customer-facing notification.
- `ConsentService.hasConsent(customerId, "SMS")` and the approved notification API are notification-only concerns. They do not authorize fraud screening, `FraudClient`, or any additional enterprise integration.

This page does not establish a customer's actual consent or define enterprise service contracts.
Apply it only within its stated scope. A requested scope exception or conflicting decision still needs human resolution.