# Enterprise Copilot

A 45-minute Spring AI workshop: three model-backed teammates analyze a ticket,
propose code and review it; a deterministic release manager enforces deployment gates.

**AI assesses and recommends. Application code enforces gates. Humans approve.**

## What Runs

```text
Ticket -> Rhea (requirements) -> Nova (code proposal) -> Sentinel (review)
    -> Atlas (Java gates) -> human approval -> simulated deployment
```

Rhea, Nova and Sentinel make real Spring AI model calls in LIVE mode. Atlas remains
deterministic: its existing deployment prompt merely restates the gate inputs and is
not used. Generated code is never written, compiled or executed. GitHub objects,
test outcomes and deployment are simulations, not external integrations.

## Provider Priority

| Experience | Profile | Requirements |
|---|---|---|
| Normal workshop: OpenAI LIVE | `openai` (default) | `OPENAI_API_KEY`; model defaults to `gpt-4o-mini` |
| Local alternative: Ollama LIVE | `ollama` | Running Ollama and a pulled model; default `llama3.1` |
| Deterministic preview/fallback | `demo` | No model service or credentials |

Select exactly one AI profile. Add `postgres` only when using PostgreSQL.
There is no provider failover: a failed live call produces a visible pipeline failure,
never a DEMO response. Switching providers requires restarting the backend and reloading the dashboard.
The UI shows the selected provider. Deterministic scenario controls appear only in DEMO.
Azure is deferred. LangChain4j remains a dependency but has no application usages.

## Local Workshop Setup

Prerequisites: JDK 21 and Node 22.12+ (a supported current Node version also works).
The Maven wrapper provides Maven; frontend dependencies use React 18, Vite 7,
the React plugin 4 and Tailwind 3. Backend versions are pinned in `backend/pom.xml`.

Supply `OPENAI_API_KEY` in the backend terminal environment, not in tracked files.
Then start the default OpenAI backend:

```bash
cd backend
sh ./mvnw spring-boot:run
```

A missing or blank OpenAI key causes an early configuration error. Optional:
`OPENAI_MODEL` selects another compatible model. Do not share or commit credentials.

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

- Dashboard: http://localhost:5173
- Backend: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/actuator/health
- Metrics: http://localhost:8080/actuator/metrics and /actuator/prometheus
- H2 is configured in-memory; the configured console path is /h2-console.

Choose **Run Pipeline**. Live output may pause for clarification or request changes.
Answer every clarification question before resuming. Answers are saved into the analysis
summary consumed by Nova. A clean review and passing simulated test signal reach human
approval. Approval reevaluates gates; rejection is accepted only while waiting for approval.

## Explicit Alternatives

Credential-free preview:

```bash
cd backend
SPRING_PROFILES_ACTIVE=demo sh ./mvnw spring-boot:run
```

Local live model: run Ollama, pull the model, then select the alternative:

```bash
ollama pull llama3.1
# Start Ollama if it is not already running: ollama serve
cd backend
SPRING_PROFILES_ACTIVE=ollama sh ./mvnw spring-boot:run
```

`OLLAMA_BASE_URL` defaults to `http://localhost:11434`; `OLLAMA_MODEL` defaults to
`llama3.1`. Model availability and structured-output quality must be checked before presenting.

## Docker / PostgreSQL

With `OPENAI_API_KEY` in the environment, `docker compose up --build` starts PostgreSQL 16,
the OpenAI backend (`postgres,openai`) and the dashboard on ports 5432, 8080 and 5173.
Local database credentials are copilot/copilot; the PostgreSQL volume retains data.

```bash
# Explicit deterministic preview:
SPRING_PROFILES_ACTIVE=postgres,demo docker compose up --build

# Explicit local live alternative:
SPRING_PROFILES_ACTIVE=postgres,ollama docker compose --profile ollama up --build
# Pull the model separately:
docker compose --profile ollama exec ollama ollama pull llama3.1
```

The Compose Ollama profile starts a service; the Spring profile selects the backend provider.
The container backend uses `http://ollama:11434`. PostgreSQL settings use
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` and `DB_PASSWORD`.

## Deterministic Scenarios

Only DEMO guarantees these outcomes; LIVE uses actual model responses to the ordinary ticket.

| Scenario | Result |
|---|---|
| NORMAL | WAITING_FOR_APPROVAL; approval produces simulated DEPLOYED |
| SECURITY_FAILURE | Scripted critical finding and REJECT; ends BLOCKED, not approvable |
| AMBIGUOUS_REQUIREMENT | REQUIREMENTS_READY pause; valid human answers resume implementation |
| TEST_FAILURE | Simulated failing tests; ends BLOCKED |
| MISSING_APPROVAL | Same clean fixtures as NORMAL; remains WAITING_FOR_APPROVAL without action |
| HALLUCINATED_API | Scripted API-contract finding; ends BLOCKED |
| PROMPT_INJECTION | Scripted refusal of injected instructions; still requires human approval |

## Architecture And API

One Spring Boot process, one React dashboard, typed `PipelineContext` and result records.
Agents consult local reference files directly; there is no model-selected tool loop.
JPA stores the latest snapshot, audit stores significant actions, and SSE streams activity.
React fetches current snapshots after events and polls as a fallback.

| Endpoint | Purpose |
|---|---|
| POST /api/demo/run | Run the workshop ticket in the selected provider |
| GET /api/demo/status | Actual provider, mode and available deterministic scenarios |
| POST /api/demo/scenario?scenario=NAME | Select a scenario (DEMO only) |
| POST /api/pipelines | Start a custom ticket |
| GET /api/pipelines and /api/pipelines/{id} | List and inspect snapshots |
| GET /api/pipelines/{id}/events | SSE activity stream |
| POST /api/pipelines/{id}/clarify | Submit answers and resume |
| POST /api/pipelines/{id}/approve or /reject | Presenter approval/rejection |
| GET /api/audit/pipelines/{id} | Significant-action audit |
| GET /api/github/pipelines/{id} | Simulated GitHub projection |
| POST /api/agents/{requirements,code,review,deploy} | Cumulative agent previews |

Atlas blocks missing requirements/code, unresolved clarification, non-approved review,
critical findings and failing test signals. Human approval cannot override those gates.
`testsPass` is a simulated/model-proposed signal, not independently executed CI evidence.
Approval endpoints are open local workshop controls, not authenticated production authorization.

## Verification And Reading

Compile application and test sources without executing tests:

```bash
cd backend
sh ./mvnw -B -DskipTests test-compile
# In frontend/: npm run build
```

CI runs `mvn verify` in DEMO. All five test classes are under `backend/src/test/java`;
Spring context tests explicitly select DEMO. Testcontainers is a dependency, not an implemented test suite.
Builds do not establish provider availability: rehearse OpenAI/Ollama and all DEMO scenarios manually.

Start with `PipelineOrchestrator`, `PipelineContext`, the four agent classes,
`SpringAiAgentAiClient`, `DemoResponses`, `PipelineStore`, and `frontend/src/App.jsx`.
See [architecture](docs/architecture.md), [Spring AI](docs/spring-ai.md),
[workshop guide](docs/workshop-guide.md), [failure scenarios](docs/failure-scenarios.md),
[security boundaries](docs/security.md), and [presenter cue card](docs/cue-card.md).
`README_V1.md` is a historical design narrative, not current setup instructions.

No real GitHub/Jira integration, generated-code execution, production deployment, authentication,
RAG, MCP, vector database, message broker or additional agent services are included.