# Failure Scenarios

Select DEMO for the next run beside the theme controls, then run a backlog issue from the **Issues** view
(`POST /api/demo/run?issueKey=UB-4822`); each issue maps to one scenario below
(UB-4821 NORMAL, UB-4822 SECURITY_FAILURE, UB-4823 AMBIGUOUS_REQUIREMENT, UB-4824 TEST_FAILURE,
UB-4825 HALLUCINATED_API, UB-4826 PROMPT_INJECTION). Alternatively
`POST /api/demo/scenario?scenario=<NAME>`, then
`POST /api/demo/run`. Each is deterministic. OpenAI LIVE is the default workshop experience;
LIVE runs the selected issue's real ticket text and rejects scenario-selection requests. Model outcomes are not guaranteed.

| Scenario | What happens | Terminal state |
|-----------|--------------|----------------|
| `NORMAL` | Clean run; only human approval remains | `WAITING_FOR_APPROVAL` → `DEPLOYED` |
| `SECURITY_FAILURE` | Nova logs an account number; Sentinel requests a correction; human feedback triggers a corrected proposal and fresh review | `WAITING_FOR_REVIEW_FEEDBACK` -> `WAITING_FOR_APPROVAL` -> `DEPLOYED` |
| `AMBIGUOUS_REQUIREMENT` | RESET asks one notification-channel question; APPLY uses the approved Confluence SMS decision | RESET: clarification; APPLY: `WAITING_FOR_APPROVAL` |
| `TEST_FAILURE` | Scripted review misses the equality defect; the failing simulated test signal makes Atlas block | `BLOCKED` |
| `MISSING_APPROVAL` | Everything green; blocked pending a human | `WAITING_FOR_APPROVAL` |
| `HALLUCINATED_API` | Rhea records missing evidence; the deliberately defective DEMO proposal assumes `FraudClient.verifyTransaction(...)`; Sentinel catches it | `REVIEW_FAILED` then `BLOCKED` |
| `PROMPT_INJECTION` | Business-account scope is preserved; the embedded bypass instruction is ignored | `WAITING_FOR_APPROVAL` |

Fixture tests cover catalog consistency; integration tests cover all six issue-driven flows,
review/test-signal blocking, clarification/resume, approval/deployment and rejection. They are under `src/test/java` and
Spring context tests select DEMO explicitly. `MISSING_APPROVAL` intentionally shares NORMAL fixtures.
Failing test signals here mean a scripted boolean, not generated-test execution or real CI. Missing/empty/blank
test proposals also fail Atlas's gate, even with `testsPass=true` or human approval. Never imply model detection was
measured by a deterministic run. A LIVE failure is visible with no automatic DEMO substitution.
Switching LIVE/DEMO takes effect only on the next run. Changing the configured real provider requires a restart.

## Scripted clarification rehearsal

The active reference pipeline resolves UB-4823 with the approved local Confluence document, so it does not need these
human rehearsal answers. The following UB-4823 answers apply to the baseline/missing-context path, not the active reference.
The Confluence Agent makes no model call; Rhea remains responsible for reasoning in LIVE. Empty, unrelated or partial
additional context retains DEMO clarification. The retail policy never supplies a fraud integration contract for UB-4825.

For UB-4823, click an input hint: `SMS`, `Use SMS`, or `Send by SMS`. It fills the textarea without submitting.
Submit to normalize the answer to SMS and resume. Unsupported channels remain at clarification with a clear error.
For UB-4822, click `Use masked references` or `Remove account numbers from logs`, then submit review feedback.
Nova produces a corrected proposal; Sentinel reviews again; Atlas still requires every gate and human approval.
UB-4825 needs no human input in DEMO: its unsupported integration is blocked. LIVE may request clarification first.

DEMO fixtures are scenario-based, with explicit normalization for supported presenter answers and stored
review-revision state. LIVE remains model-driven. Human feedback never marks a finding approved by itself.
Presenter scenario selection now supplies the matching catalog ticket; MISSING_APPROVAL shares UB-4821.
The notifier fixture demonstrates bounded retries and in-process deduplication. Its nested adapter contracts
are local proposals, not published enterprise Java signatures or promises of remote idempotency/durable delivery.
The notification adapter is responsible for deadline/idempotency handling; those parameters are not new API fields.

## Review Recovery (SECURITY_FAILURE)

```text
Sentinel: account numbers must not appear in logs.
Human feedback: Use masked references.
Nova: corrected proposal.
Sentinel: review passed.
Atlas: human approval still required.
```