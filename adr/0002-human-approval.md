# ADR 0002 — Human Approval for Production

## Status

Accepted

## Context

AI agents can analyse, propose and review, but allowing them
to deploy to production autonomously is
unacceptable for a bank. Accountability must remain with a
human.

## Decision

Deployment requires an explicit human approval via `POST /api/pipelines/{id}/approve`. `Atlas` uses
**rule-based** gate logic (not an LLM) and can never set
`allowed=true` without a human approval.
There is no code path by which an agent can call the approval
endpoint.

## Consequences

- Clear separation: AI recommends, humans decide.
- The pipeline deliberately pauses at `WAITING_FOR_APPROVAL`.
- Prompt-injection attempts to "approve anyway" cannot
  succeed by construction.