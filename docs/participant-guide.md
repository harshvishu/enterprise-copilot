# Participant Guide

## Prerequisites

- JDK 21, Node 22.12+ (supported newer versions also work), backend OpenAI API credentials.
	The Maven wrapper supplies Maven; Docker and Ollama are optional.

## Normal workshop: OpenAI LIVE

Supply `OPENAI_API_KEY` in your backend terminal environment; never commit its value.
Missing credentials produce a configuration error unless `COPILOT_AI_FALLBACK=demo` is set, which switches the run to visible DEMO output.

```bash
# Terminal 1 – backend
cd backend && sh ./mvnw spring-boot:run

# Terminal 2 – frontend
cd frontend && npm ci && npm run dev
```

Open http://localhost:5173, confirm **LIVE · OPENAI**, and click **Run Pipeline**.
Answer every clarification question if Rhea pauses. Live review results are not deterministic.
Atlas remains Java; code/tests/deployment are proposals or simulations, not execution against a repository.
Select LIVE or DEMO under **Next run** near the theme controls. The selection affects only new runs,
not a pipeline that is running or waiting for human input. DEMO needs no model calls once the app is running.
For UB-4823 in RESET, click `SMS`, `Use SMS`, or `Send by SMS` below the input, then submit the answer.
For UB-4822, click `Use masked references` below the review input, then request a revision.
Nova and Sentinel run again before Atlas can request human approval.

Credential-free completed-app preview: run the backend with
`SPRING_PROFILES_ACTIVE=demo sh ./mvnw spring-boot:run` from `backend/`, then reload the dashboard.
For Ollama LIVE, select `ollama`, run Ollama and pull the model. See [README](../README.md).
The credential-free `demo` profile has no LIVE provider, so its LIVE control is disabled.

## What to explore

- Open **Issues** and run each Ubuntu Bank backlog issue; in DEMO each has a deterministic outcome.
- Watch **Live Agent Activity** (SSE) on the right.
- Open Swagger at http://localhost:8080/swagger-ui.html and try `/api/agents/review`.
- Inspect the audit trail: `GET /api/audit/pipelines/{id}`.

## Exercises

1. Add a MEDIUM quality finding for the `NORMAL` scenario in `DemoResponses`.
2. Add a new scenario to the `DemoScenario` enum and wire its outputs.
3. Compare explicitly selected OpenAI/Ollama LIVE outputs with DEMO fixtures; do not confuse reproducibility with model accuracy.