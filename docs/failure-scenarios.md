# Failure Scenarios

In the explicit `demo` profile, run a backlog issue from the dashboard **Issues** view
(`POST /api/demo/run?issueKey=UB-4822`); each issue maps to one scenario below
(UB-4821 NORMAL, UB-4822 SECURITY_FAILURE, UB-4823 AMBIGUOUS_REQUIREMENT, UB-4824 TEST_FAILURE,
UB-4825 HALLUCINATED_API, UB-4826 PROMPT_INJECTION). Alternatively
`POST /api/demo/scenario?scenario=<NAME>`, then
`POST /api/demo/run`. Each is deterministic. OpenAI LIVE is the default workshop experience;
LIVE runs the selected issue's real ticket text and rejects scenario-selection requests. Model outcomes are not guaranteed.

| Scenario | What happens | Terminal state |
|-----------|--------------|----------------|
| `NORMAL` | Clean run; only human approval remains | `WAITING_FOR_APPROVAL` → `DEPLOYED` |
| `SECURITY_FAILURE` | Nova logs the account number; scripted Sentinel finds a CRITICAL POPIA violation | `REVIEW_FAILED` then `BLOCKED` |
| `AMBIGUOUS_REQUIREMENT` | Deterministic Confluence Agent supplies approved retail launch decisions; the baseline Rhea preview still asks about credit eligibility, channel and no-consent behaviour | Active pipeline: `WAITING_FOR_APPROVAL`; baseline preview: clarification |
| `TEST_FAILURE` | Scripted review misses the equality defect; the failing simulated test signal makes Atlas block | `BLOCKED` |
| `MISSING_APPROVAL` | Everything green; blocked pending a human | `WAITING_FOR_APPROVAL` |
| `HALLUCINATED_API` | Rhea first asks for the missing screening capability/contract and failure behaviour; after answers, deliberately defective Nova assumes an unsupported `FraudClient.verifyTransaction(...)` | `REQUIREMENTS_READY`, then `REVIEW_FAILED` and `BLOCKED` |
| `PROMPT_INJECTION` | Business-account scope is preserved; the embedded bypass instruction is ignored | `WAITING_FOR_APPROVAL` |

Fixture tests cover catalog consistency; integration tests cover all six issue-driven flows,
review/test-signal blocking, clarification/resume, approval/deployment and rejection. They are under `src/test/java` and
Spring context tests select DEMO explicitly. `MISSING_APPROVAL` intentionally shares NORMAL fixtures.
Failing test signals here mean a scripted boolean, not generated-test execution or real CI. Missing/empty/blank
test proposals also fail Atlas's gate, even with `testsPass=true` or human approval. Never imply model detection was
measured by a deterministic run. A live failure is visible; selecting another provider requires a restart.

## Scripted clarification rehearsal

The active reference pipeline resolves UB-4823 with the approved local Confluence document, so it does not need these
human rehearsal answers. The following UB-4823 answers apply to the baseline/missing-context path, not the active reference.
The Confluence Agent makes no model call; Rhea remains responsible for reasoning in LIVE. Empty, unrelated or partial
additional context retains DEMO clarification. The retail policy never supplies a fraud integration contract for UB-4825.

For UB-4823, answer in question order: outgoing debits only; SMS only; skip and audit when SMS consent is absent.
For UB-4825: no approved screening contract has been supplied and none may be invented; when screening is
unavailable or late, stop and audit without notifying. Nova's intentionally bad fixture still assumes an
unsupported screening integration, and Sentinel requests changes. HIGH severity is sufficient: Atlas blocks
any non-approved review, not only CRITICAL findings.

DEMO fixtures are scenario-based and do not interpret arbitrary human answers. These rehearsal answers keep
the static proposals coherent; use LIVE to evaluate other decisions. No Rhea rerun or automatic repair occurs.
Presenter scenario selection now supplies the matching catalog ticket; MISSING_APPROVAL shares UB-4821.
The notifier fixture demonstrates bounded retries and in-process deduplication. Its nested adapter contracts
are local proposals, not published enterprise Java signatures or promises of remote idempotency/durable delivery.
The notification adapter is responsible for deadline/idempotency handling; those parameters are not new API fields.

## The hero moment (SECURITY_FAILURE)

```text
🛡️ Sentinel - REJECT

CRITICAL / COMPLIANCE   NotificationService.java:onTransaction / log.info(..., tx.accountNumber())

Full account number is logged in plain text.

↳ Never log account numbers. Log a masked reference or an
  internal id only.

🚀 Atlas - DEPLOYMENT BLOCKED
```