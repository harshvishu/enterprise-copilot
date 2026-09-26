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

The default `demo` profile uses a **deterministic AI
provider** (`DemoAgentAiClient` +
`DemoResponses`) that returns canonical UB-4821 outputs per
scenario. The same agent code paths run in
LIVE mode against a real model (Ollama or Azure). The UI
always shows a DEMO/LIVE banner.

## Consequences

- The workshop runs with zero external dependencies and is
  100% reproducible.
- Scenarios are testable in CI without API keys.
- LIVE mode remains a one-profile switch for authenticity.
`