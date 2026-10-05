# Agent Design

## Pipeline Contracts And Context

The reasoning/release agents return typed records. Pipeline results accumulate in `PipelineContext`;
the deterministic Confluence Agent passes document text transiently to Rhea rather than adding persistent state:

| Agent | Input | Output |
|--------|--------|---------------|
| Confluence Agent | `Ticket` + ConfluenceTool | transient business context string |
| 🔍 Rhea | `Ticket` (+ tool data) | `RequirementAnalysis` |
| 💻 Nova | `RequirementAnalysis.summary` + existing `acceptanceCriteria` + architecture/API tools | `CodeChangeSet` |
| 🛡️ Sentinel | original `Ticket` + full `CodeChangeSet` / `RequirementAnalysis` + compliance/architecture/API tools | `ReviewDecision` (+ `ReviewFinding`) |
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

## Confluence Agent Reference

- `ConfluenceTool` reads one supplied local retail launch decision document; it does not perform search.
- `ConfluenceAgent.gatherContext(ticket)` simply calls the tool and returns its text. Not every agent needs an LLM.
- The initial pipeline passes the string to `RequirementsAgent.analyze(ctx, businessContext)` once. Rhea receives
  the full document with its owner/status/scope metadata and applies its unchanged decision policy.
- Baseline `analyze(ctx)` remains available through agent previews. Empty, irrelevant or partial context retains
  clarification in the scripted rehearsal. The fraud-contract negative control remains unresolved.
- DEMO uses its existing requirements fixtures and checks that the supplied policy is in the additional-reference
  section. This is a narrow simulation, not another agent fixture subsystem or a model-quality measurement.
- No new AI kind, result model, prompt, state, persistent field or feature flag is needed.
- Supplied orchestration plumbing wraps the context call in existing activity events. The prepared UI displays an
  optional Confluence stage only when those events exist; no participant frontend or SSE changes are required.
- Participants write roughly 15-20 lines including imports, plus supplied constructor wiring and two handoff statements.
  The reset/apply helper owns only marked wiring and reference agent/test files under workshop/.

## Nova – Code

- Produces a **proposal** rendered as a unified diff, never
  touching the real filesystem.
- Preserves human answers from the summary and also receives existing acceptance criteria after LIVE rehearsal
  demonstrated retry requirements lost from the summary. No new records or Rhea rerun are introduced. Reads the existing API tool;
  identifies unsupported capabilities rather than inventing them. Proposes behavioral tests, not execution results.
- Guardrails: no secrets, no disabled auth/validation, no
  logging of PANs/account numbers/PII.

## Sentinel – Review (the hero)

- Inspects SECURITY / COMPLIANCE / QUALITY / ARCHITECTURE.
- Each `ReviewFinding` has a severity (CRITICAL…LOW); any
  CRITICAL blocks deployment.
- Independently checks material requirement coverage, full files/diff, tests and assumptions against
  the original ticket and supplied references. Findings cite concrete defects and calibrated impact/remediation.
- Identifies enterprise contracts unsupported by supplied evidence without claiming they cannot exist anywhere.
  Reasonable proposed local adapters are distinguished from invented enterprise capabilities.

In LIVE this is model reasoning over the supplied text, not a deterministic source scanner.
In DEMO both proposal and findings are scripted per scenario.
UB-4822 pauses in WAITING_FOR_REVIEW_FEEDBACK. Human feedback is persisted, the proposal is regenerated,
and Sentinel reviews it again before Atlas evaluates gates. It is not a review-approval override.

## Atlas – Deploy

- **Rule-based, not an LLM** – deterministic gate logic is
  more trustworthy for release decisions.
- Blocks on missing requirements/code artifacts, unresolved clarification, review not APPROVE,
  CRITICAL findings, missing/blank proposed tests, failing test signals, or missing human approval.
- Sets `allowed=true` only when every gate passes **and** a
  human has approved.

## Live workshop and deterministic preview

Live LLMs are non-deterministic. For a 45-minute conference
slot, the central "AI catches the
vulnerability" moment must be 100% reproducible.
OpenAI is the default workshop experience; Ollama is the explicit local LIVE alternative.
`DemoResponses` encodes canonical backlog scenario outcomes for credential-free participant self-checks
and a clearly identified presenter fallback. No live failure is silently replaced with a fixture.
Atlas's `deploy.st` only restates the existing Java gate inputs, so it adds no distinct assessment
and is not invoked. `testsPass` is a simulated/model-proposed signal, not independently run tests.
The Confluence reference resolves UB-4823's notification channel to SMS; RESET asks one channel question.
The shared AI router uses each pipeline's saved execution mode, never the presenter's current selection.