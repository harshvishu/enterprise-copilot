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
| AMBIGUOUS_REQUIREMENT | Active Confluence Agent supplies retail launch decisions; baseline Rhea preview still asks three questions |
| TEST_FAILURE | Scripted failing test signal for the equality defect; ends BLOCKED |
| MISSING_APPROVAL | Same clean fixtures as NORMAL; remains WAITING_FOR_APPROVAL without action |
| HALLUCINATED_API | Missing-screening clarification pause; after answers, scripted unsupported-API finding ends BLOCKED |
| PROMPT_INJECTION | Scripted refusal of injected instructions; still requires human approval |

## Architecture And API

One Spring Boot process, one React dashboard, typed `PipelineContext` and result records.
Agents consult local reference files directly; there is no model-selected tool loop.
JPA stores the latest snapshot, audit stores significant actions, and SSE streams activity.
React fetches current snapshots after events and polls as a fallback.
Nova keeps the summary-first handoff (including human answers), also receives the existing acceptance criteria,
and reads architecture/API evidence. LIVE rehearsal demonstrated material retry criteria omitted from Rhea's
summary; forwarding that existing list prevents the observed loss without changing records or PipelineContext.
Sentinel independently receives the original ticket, resolved analysis, full proposal including tests/assumptions,
and the existing compliance, architecture and API references. Findings must be grounded and calibrated.
The simplified Confluence Agent reference solution is currently active. `ConfluenceAgent.gatherContext(ticket)`
calls `ConfluenceTool`, which reads one local workshop business document, and returns a plain string to Rhea.
The agent is deterministic: no extra AI call, prompt, structured result, citations subsystem or model-generated gaps.
Rhea applies its existing reasoning policy to the document's scope and approved decisions. No PipelineContext/database
fields, real Confluence integration, search infrastructure or runtime flag were added.
The participant starter and recovery package have not yet been extracted.

For the BEFORE comparison, use `POST /api/agents/requirements` with the UB-4823 ticket
(select AMBIGUOUS_REQUIREMENT first in DEMO). This preserves `analyze(ctx)` without additional context.
For AFTER, use `POST /api/demo/run?issueKey=UB-4823`: the active pipeline supplies the approved retail launch
decisions, resolving credit eligibility, channel and absent-consent behaviour. UB-4825 remains paused because
the policy does not provide a screening contract. Context availability never authorizes deployment.
The participant task is one tiny agent plus constructor wiring and two handoff statements: five minutes expected,
eight minutes maximum. See [workshop guide](docs/workshop-guide.md) for the teaching sequence.
The provided activity wrapper and UI support an optional Confluence stage using existing events. No Confluence
activity means the original stage rail; emitted activity inserts Confluence before Rhea. Participants do not edit
frontend code, SSE infrastructure, event schemas or pipeline state.

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
critical findings, missing/blank proposed tests and failing test signals. Human approval cannot override those gates.
`testsPass` is a simulated/model-proposed signal, not independently executed CI evidence.
The mock GitHub projection labels generated builds as not evaluated and test signals as simulated/model-provided.
DEMO adapter contracts and in-process duplicate suppression are illustrative, not verified enterprise integrations
or durable delivery guarantees. For scripted clarification rehearsal answers, see [failure scenarios](docs/failure-scenarios.md).
Approval endpoints are open local workshop controls, not authenticated production authorization.

## Verification And Reading

Compile application and test sources without executing tests:

```bash
cd backend
sh ./mvnw -B -DskipTests test-compile
# In frontend/: npm run build
```

For a full stabilization check, run `SPRING_PROFILES_ACTIVE=demo sh ./mvnw -B verify` in `backend/`
and `npm test` plus `npm run build` in `frontend/`. These test the application, not generated artifacts.
CI runs `mvn verify` in DEMO. All eight backend test classes are under `backend/src/test/java`;
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