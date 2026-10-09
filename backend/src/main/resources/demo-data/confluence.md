# Payment Alerts: Approved Notification Channel

Source ID: retail-high-value-alerts
Owner: Retail Banking Product Council
Status: APPROVED
Decision date: 2026-09-15
Scope: Retail payment-alert notification channel. This does not define fraud-screening integrations.

This approved decision resolves the notification channel for the retail alert launch.

## Business Decisions

- SMS is the launch notification channel; email and push are outside this launch scope.
- Check SMS consent before sending. Without consent, skip the notification and audit the outcome.

## Approved Implementation Controls

- Send an alert only for a posted personal-customer debit strictly above R50,000. The boundary amount of exactly R50,000 must not trigger an alert.
- In the Ubuntu Bank workshop fixture, compare the stored cent amount as `amount_cents > 5_000_000`.
- Obtain SMS consent from the approved notification API before attempting delivery. Do not infer consent from customer type, payment data, or a missing consent record.
- Messages and audit records must not contain account numbers or other private account details. Use a masked reference where a support-facing reference is required.
- Proposed tests must cover the exact R50,000 boundary, an above-threshold consented payment, and a missing-consent payment. In proposal-only workflows, describe these as proposed tests; do not claim they executed.
- The workshop notification delivery is simulated. Do not claim a real SMS was sent or use simulated delivery as evidence of production execution.

This page does not establish a customer's actual consent or define enterprise service contracts.
Apply it only within its stated scope. A requested scope exception or conflicting decision still needs human resolution.