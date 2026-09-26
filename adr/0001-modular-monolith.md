# ADR 0001 – Modular Monolith

## Status

Accepted

## Context

The platform has four agents, orchestration, persistence,
GitHub simulation and a dashboard. It must
be understandable and runnable in a 45-minute workshop, and
the presenter must grasp every important
component.

## Decision

Build a **modular monolith** (single Spring Boot process)
with clear package boundaries
(`api`, `orchestration`, `agents`, `domain`, `tools`,
`github`, `persistence`, `infrastructure`).

## Consequences

- One process to run, debug and reason about — ideal for
  teaching.
- No network boundaries between agents; typed in-process
  calls.
- If real scale were needed, agents/orchestrator could be
  extracted later. Documented as an extension,
  not built now (avoids four premature microservices).