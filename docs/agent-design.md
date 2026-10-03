# Agent Design

## Typed contracts, not strings

Agents never exchange loosely-structured text. Everything
flows through the typed
`PipelineContext`, and each agent returns an immutable Java
record:

| Agent | Input | Output record |
|--------|--------|---------------|
| 🔍 Rhea | `Ticket` (+ tool data) | `RequirementAnalysis` |
| 💻 Nova | `RequirementAnalysis` | `CodeChangeSet` |
| 🛡️ Sentinel | `CodeChangeSet` + `RequirementAnalysis` | `ReviewDecision` (+ `ReviewFinding`) |
| 🚀 Atlas | full `PipelineContext` | `DeploymentDecision` |

These records are the "API" between teammates. In LIVE mode
Spring AI maps the model response
directly onto the record via structured output (`.entity(RequirementAnalysis.class)`); in DEMO mode
the deterministic provider returns the same record shape.

## Rhea – Requirements

- Consults four deterministic tools (Compliance,
  Architecture, GitHistory, ApiSpec).
- Surfaces ambiguity as `clarificationQuestions`; a non-empty
  list **pauses the pipeline**.
- Human answers must be nonblank and complete; they are saved in the analysis summary,
  outstanding questions are cleared, and the code-stage state is persisted before continuation.
- Treats the ticket body as untrusted (prompt-injection
  defence).

## Nova – Code

- Produces a **proposal** rendered as a unified diff, never
  touching the real filesystem.
- Guardrails: no secrets, no disabled auth/validation, no
  logging of PANs/account numbers/PII.

## Sentinel – Review (the hero)

- Inspects SECURITY / COMPLIANCE / QUALITY / ARCHITECTURE.
- Each `ReviewFinding` has a severity (CRITICAL…LOW); any
  CRITICAL blocks deployment.
- Validates API assumptions against the published contract to
  catch hallucinated APIs.

In LIVE this is model reasoning over the supplied text, not a deterministic source scanner.
In DEMO both proposal and findings are scripted per scenario.

## Atlas – Deploy

- **Rule-based, not an LLM** – deterministic gate logic is
  more trustworthy for release decisions.
- Blocks on missing requirements/code artifacts, unresolved clarification, review not APPROVE,
  CRITICAL findings, failing test signals, or missing human approval.
- Sets `allowed=true` only when every gate passes **and** a
  human has approved.

## Live workshop and deterministic preview

Live LLMs are non-deterministic. For a 45-minute conference
slot, the central "AI catches the
vulnerability" moment must be 100% reproducible.
OpenAI is the default workshop experience; Ollama is the explicit local LIVE alternative.
`DemoResponses` encodes canonical UB-4821 outcomes for credential-free participant self-checks
and a clearly identified presenter fallback. No live failure is silently replaced with a fixture.
Atlas's `deploy.st` only restates the existing Java gate inputs, so it adds no distinct assessment
and is not invoked. `testsPass` is a simulated/model-proposed signal, not independently run tests.