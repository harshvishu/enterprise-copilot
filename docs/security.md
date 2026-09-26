# Security

## Principle

AI accelerates delivery; humans own accountability. AI may
analyse, propose, review and recommend -
it may never independently merge, approve, deploy, or bypass
a gate.

## AI-specific threats & defences

| Threat | Defence in this app |
|----------|---------------------|
| **Prompt injection** | The ticket is treated as untrusted data; system policy has precedence. Prompts state this explicitly. `PROMPT_INJECTION` scenario demonstrates rejection. |
| **Data leakage** | `Redactor` strips PANs, account numbers, secrets and emails before anything is logged or audited. |
| **Hallucination** | Sentinel validates API assumptions against the published contract (`ApiSpecificationTool`); `HALLUCINATED_API` scenario. |
| **Tool abuse** | Tools are deterministic, local, read-only. No tool performs external network calls or writes. |
| **Excessive agency** | Deployment requires an explicit human approval endpoint. AI cannot call it. Atlas gate logic is rule-based. |

## Application security

- Input validation (`jakarta.validation`) on API requests.
- Output/error sanitisation via `GlobalExceptionHandler`
  (never leaks internals).
- Secrets only via environment variables; nothing sensitive
  committed (`.gitignore`).
- CORS restricted to the dev frontend origins.
- Correlation id on every request/log line for traceability.
- Immutable, redacted audit trail.

## Not in scope for the workshop

Full authn/authz (Spring Security), rate limiting, and secret
vaults are extension points. The demo
runs open locally by design.