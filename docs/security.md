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
| **Data leakage** | Best-effort `Redactor` regexes apply only to audit detail text. Prompts, snapshots, SSE and exception logs are not globally redacted. Use fictional, non-sensitive inputs. |
| **Hallucination** | Sentinel validates API assumptions against the published contract (`ApiSpecificationTool`); `HALLUCINATED_API` scenario. |
| **Tool abuse** | Tools are deterministic, local, read-only. No tool performs external network calls or writes. |
| **Excessive agency** | Deployment requires an explicit human approval endpoint. AI cannot call it. Atlas gate logic is rule-based. |

## Application security

- Input validation (`jakarta.validation`) on API requests.
- Output/error sanitisation via `GlobalExceptionHandler`
  for selected HTTP exceptions. Live model failures expose a provider/stage message, not the raw response.
- Secrets only via environment variables; nothing sensitive
  committed (`.gitignore`).
- CORS restricted to the dev frontend origins.
- Request correlation header and MDC; no explicit async propagation or correlation log pattern.
- Significant-action audit, append-only by application convention; detail is best-effort redacted.
- Select exactly one provider. OpenAI requires an environment/configuration key and never fails over to DEMO.
- Atlas enforces missing artifacts, clarification, review, critical findings, test signals and approval in Java.
- Tests are not actually executed on proposals. LIVE `testsPass` is model-produced, not trusted CI proof.
- Approval/rejection endpoints have state checks, but are unauthenticated local presenter actions.

Prompt-injection and unsafe-code detection depend on model behavior in LIVE; DEMO scripts these results.
The deterministic safety boundary is that models have no approval, write, merge or deployment tool.

## Not in scope for the workshop

Full authn/authz (Spring Security), rate limiting, and secret
vaults are extension points. The demo
runs open locally by design.