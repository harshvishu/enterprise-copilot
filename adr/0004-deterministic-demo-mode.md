# ADR 0004 – Deterministic Demo Mode

## Status

Accepted

## Context

Live LLM calls are non-deterministic and depend on external
services and API keys. A conference demo
cannot risk the central "AI catches the vulnerability" moment
failing due to model randomness or
network issues.

## Decision

OpenAI LIVE is the default workshop experience. Ollama LIVE is the explicit local alternative.
`DemoAgentAiClient` and `DemoResponses` are always available. The presenter selects LIVE or DEMO
for the next run from the frontend; `RoutingAgentAiClient` dispatches using that run's saved mode.
OpenAI/Ollama profiles configure the real provider, not exclusive execution paths. The `demo`
profile remains the credential-free option, with LIVE unavailable unless a real provider is configured.
The same first three agent/orchestrator paths run in LIVE; Atlas is always deterministic Java.
The UI identifies the provider. Live failure never silently substitutes DEMO output. Azure is deferred.

## Consequences

- The DEMO preview runs without model credentials/services and has reproducible outcomes.
- Scenarios are testable in CI without API keys.
- LIVE is primary; scenario guarantees apply only to runs captured in DEMO mode.
- Switching execution mode requires no restart and never changes an existing run or its recovery steps.
`