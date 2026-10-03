# Participant Guide

## Prerequisites

- JDK 21, Node 22.12+ (supported newer versions also work), backend OpenAI API credentials.
	The Maven wrapper supplies Maven; Docker and Ollama are optional.

## Normal workshop: OpenAI LIVE

Supply `OPENAI_API_KEY` in your backend terminal environment; never commit its value.
Missing credentials produce a configuration error, not an automatic DEMO fallback.

```bash
# Terminal 1 – backend
cd backend && sh ./mvnw spring-boot:run

# Terminal 2 – frontend
cd frontend && npm install && npm run dev
```

Open http://localhost:5173, confirm **LIVE · OPENAI**, and click **Run Pipeline**.
Answer every clarification question if Rhea pauses. Live review results are not deterministic.
Atlas remains Java; code/tests/deployment are proposals or simulations, not execution against a repository.

Credential-free completed-app preview: run the backend with
`SPRING_PROFILES_ACTIVE=demo sh ./mvnw spring-boot:run` from `backend/`, then reload the dashboard.
For Ollama LIVE, select `ollama`, run Ollama and pull the model. See [README](../README.md).

## What to explore

- In DEMO only, switch all seven scenarios in the dropdown and re-run.
- Watch **Live Agent Activity** (SSE) on the right.
- Open Swagger at http://localhost:8080/swagger-ui.html and try `/api/agents/review`.
- Inspect the audit trail: `GET /api/audit/pipelines/{id}`.

## Exercises

1. Add a MEDIUM quality finding for the `NORMAL` scenario in `DemoResponses`.
2. Add a new scenario to the `DemoScenario` enum and wire its outputs.
3. Compare explicitly selected OpenAI/Ollama LIVE outputs with DEMO fixtures; do not confuse reproducibility with model accuracy.