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

## Atlas – Deploy

- **Rule-based, not an LLM** – deterministic gate logic is
  more trustworthy for release decisions.
- Blocks on: review not APPROVE, CRITICAL findings, failing
  tests, or missing human approval.
- Sets `allowed=true` only when every gate passes **and** a
  human has approved.

## Why the deterministic provider?

Live LLMs are non-deterministic. For a 45-minute conference
slot, the central "AI catches the
vulnerability" moment must be 100% reproducible.
`DemoResponses` encodes the canonical UB-4821
outcomes so the demo never depends on model randomness
while the exact same code paths run in LIVE
mode against a real model.