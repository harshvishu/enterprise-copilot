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
The explicitly selected `demo` profile uses `DemoAgentAiClient` and `DemoResponses` for
credential-free participant checks and reliable presenter fallback, preserving all seven scenarios.
The same first three agent/orchestrator paths run in LIVE; Atlas is always deterministic Java.
The UI identifies the provider. Live failure never silently substitutes DEMO output. Azure is deferred.

## Consequences

- The DEMO preview runs without model credentials/services and has reproducible outcomes.
- Scenarios are testable in CI without API keys.
- LIVE is primary; scenario guarantees apply only to the explicitly selected DEMO path.
`