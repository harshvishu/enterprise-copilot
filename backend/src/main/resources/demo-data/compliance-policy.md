POPIA NOTIFICATION GUIDANCE (Ubuntu Bank – fictional)

1. CONSENT

    - Proactive customer notifications require a lawful basis. Confirm the customer has consented
      to the specific channel (SMS / email / push) before sending.
    - Consent status is available via ConsentService.hasConsent(customerId, channel).

2. DATA MINIMISATION

    - Never place account numbers, card PANs, balances or ID numbers in notification bodies or
      logs.
    - Use masked references (e.g. account ending 1234) and internal identifiers only.

3. AUDITABILITY

    - Every notification event must be recorded in the audit trail with a non-sensitive reference.

4. RETENTION

    - Notification audit records are retained per the bank retention schedule; raw message content
      is not retained beyond delivery confirmation.