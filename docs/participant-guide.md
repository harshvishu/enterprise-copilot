# Participant Guide

## Prerequisites

- JDK 21, Maven 3.9+, Node 20+ (22 recommended). Docker optional.

## Get running (5 minutes, no keys)

```bash
# Terminal 1 – backend
cd backend && mvn spring-boot:run

# Terminal 2 – frontend
cd frontend && npm install && npm run dev
```

Open http://localhost:5173 → click **Run Pipeline**.

## What to explore

- Switch scenarios in the top-right dropdown and re-run.
- Watch **Live Agent Activity** (SSE) on the right.
- Open Swagger at http://localhost:8080/swagger-ui.html and try `/api/agents/review`.
- Inspect the audit trail: `GET /api/audit/pipelines/{id}`.

## Exercises

1. Add a MEDIUM quality finding for the `NORMAL` scenario in `DemoResponses`.
2. Add a new scenario to the `DemoScenario` enum and wire its outputs.
3. Enable LIVE mode with Ollama and compare outputs to DEMO.