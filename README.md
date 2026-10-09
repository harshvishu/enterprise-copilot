# Enterprise Copilot

Enterprise Copilot is a project for our Spring AI workshop at Flo 2026.
We use fictional Ubuntu Bank tickets to show how AI can help understand requirements,
propose code and review changes, while people stay in control of important decisions.

You can follow a ticket in the dashboard, answer questions when information is missing,
and approve or reject the final step. The workshop also includes a small exercise where
you add an agent that gives the system internal business context.

The default scenarios show code proposals and a simulated test signal. An optional
Ubuntu Bank repository target applies real changes in isolated clones and runs pytest.
Deployment remains simulated. Nothing is pushed to GitHub or deployed for real.

## Prerequisites

For the local setup, you need:

- Java 21 (JDK).
- Node.js 22.12 or newer. npm comes with Node.js.
- Git to clone the repository.
- A code editor, such as VS Code or IntelliJ IDEA.
- An OpenAI API key for LIVE mode. DEMO mode does not need a key.

Maven is included through the wrapper. Docker and Ollama are optional.
The local setup uses an in-memory database, so you do not need to install one.

## Real Ubuntu Bank repository runs

Set up `ubuntu-bank-demo/.venv` using its README and keep that baseline Git repository
alongside `workshop/`. Start the backend from `backend/`, select LIVE with OpenAI or
Ollama, then choose **Ubuntu Bank · real Git and pytest** in the gear menu's
**Execution target** setting. Proposal-only runs remain the default and preserve all
DEMO scenarios. Repository runs never fall back to scripted responses.

Rhea receives actual tracked Python files and the README. Nova returns complete file
contents; `LocalRepositoryTool` validates paths, applies only `app/` and `tests/` Python
changes in a dedicated clone/branch, records a candidate commit, reads its real Git
diff, and executes a fixed pytest command. Sentinel receives that diff, source and
server-recorded test evidence. Atlas ignores the model's `testsPass` flag for these runs.
Failed, timed-out, empty or entirely skipped test runs cannot pass the test gate.

The Nova section displays the actual diff, candidate commit, pytest exit code, counts,
duration and stdout/stderr. Presentation pacing delays only UI playback; human controls
remain available. Clarification and review feedback use the existing workflow. A revision
invalidates previous test, review and approval evidence and reruns pytest.

**Approve candidate changes** approves the exact reviewed/tested commit. It never merges
automatically. **Merge approved commit locally** is a second explicit action that
fast-forwards `.copilot-repository/integration` on `workshop-integration`. It refuses changed
candidates or an integration destination that advanced since the run started. No remote
push occurs. The original `ubuntu-bank-demo` is never written or committed during a run.
The existing DEPLOYED lifecycle still records a clearly labeled simulated deployment;
actual local merge status is stored separately.

Repository execution currently requires **macOS**, `/usr/bin/sandbox-exec`, Git and the
configured Python virtual environment. The test subprocess receives a minimal environment
without provider credentials, has networking disabled, reads only its clone and runtime
locations, and can write only its dedicated temporary/report folder. Repository files and
the baseline are read-only to tests. Unsupported platforms fail closed; there is no
unprotected fallback. This is a local teaching environment, not a sandbox for hostile code:
tests and test reports execute within the same pytest process and still require review.

Optional configuration (environment variables or the corresponding Spring properties):

| Variable | Spring property | Default, relative to `backend/` |
| --- | --- | --- |
| `COPILOT_REPOSITORY_PATH` | `copilot.repository.path` | `../ubuntu-bank-demo` |
| `COPILOT_REPOSITORY_WORKSPACE_ROOT` | `copilot.repository.workspace-root` | `../.copilot-repository` |
| `COPILOT_REPOSITORY_PYTHON` | `copilot.repository.python` | `../ubuntu-bank-demo/.venv/bin/python` |
| `COPILOT_REPOSITORY_TEST_TIMEOUT_SECONDS` | `copilot.repository.test-timeout-seconds` | `60` |

The first run seeds the integration clone from the baseline's committed files plus its
reviewed tracked source edits, without committing those edits to the baseline. Its fingerprint
is pinned. If the baseline changes later, select a new workspace root for a fresh workshop.
Run clones and reports remain available for inspection. Do not delete the workspace root
while a run or merge is active. Changes from approved runs accumulate only in the integration
clone, so later runs can build on them.

For HTTP clients, use `POST /api/demo/run-repository?issueKey=UB-4824` in LIVE mode.
Both `POST /api/pipelines/{id}/approve` and `POST /api/pipelines/{id}/merge` require
JSON `{"candidateCommit":"<exact candidate SHA>"}` for repository runs. The existing
proposal-only approval API remains compatible.

Verification: baseline tests use `ubuntu-bank-demo/.venv/bin/python -m pytest -q` from
the bank folder. Backend `sh ./mvnw test` includes real Git/pytest integration tests on
macOS with the bank virtual environment configured. AI responses in these automated
integration tests are controlled fixtures; they do not call OpenAI or Ollama. Frontend
checks use `npm test` and `npm run build` from `frontend/`.

## Getting Started

### Start the backend

The default mode uses OpenAI. In a terminal, set your API key and start the backend:

```bash
cd backend
export OPENAI_API_KEY="your-api-key"
sh ./mvnw spring-boot:run
```

Keep your actual API key out of Git. If you do not have a key, use DEMO mode below.

### Start the frontend

Open a second terminal from the project folder:

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173, choose an issue and click **Run pipeline**.
Answer any clarification questions. If the checks pass, you can approve or reject the
simulated deployment. Live model responses can vary, and some runs may be blocked.

The **Next run** LIVE/DEMO selector sits beside the theme controls, including in mobile navigation.
Switching it takes effect on the next pipeline only; no server or frontend restart is needed.
In DEMO, UB-4823 asks one channel question: click `SMS`, `Use SMS`, or `Send by SMS` below the
input to fill it, then submit. For UB-4822 review feedback, choose `Use masked references` and
submit to regenerate and independently review the proposal before deployment approval.

The backend runs at http://localhost:8080. You can try its endpoints at
http://localhost:8080/swagger-ui.html.

### Start scripts

From the project folder, `./scripts/start.sh` checks ports 8080 and 5173, starts the backend,
waits until it is up, then starts the frontend. Ctrl+C stops both. To start one at a time, use
`./scripts/start-backend.sh` or `./scripts/start-frontend.sh`. All scripts explain what to do
if a port is already in use. Without an API key the app starts in DEMO mode. To use LIVE, add
`OPENAI_API_KEY=your-api-key` to a `.env` file in the project folder, choose **LIVE** and run the
pipeline again. The key is read on each run, so no restart is needed.
`./scripts/stop.sh [backend|frontend]` stops servers started from this project (both by default).

The startup scripts automatically read `OPENAI_API_KEY` from the project-root `.env` if it is not
already set in the shell. Plain or quoted values are supported; the file is not executed as shell
code and the key is never printed. Keep `.env` private and out of Git. Direct Maven commands still
require the key in the environment.

## Run Without an API Key

Start the backend in DEMO mode instead:

```bash
cd backend
SPRING_PROFILES_ACTIVE=demo sh ./mvnw spring-boot:run
```

The frontend command stays the same. DEMO uses fixed responses and does not call an external model.
A credential-free `demo` server has LIVE disabled. To switch freely during the workshop, configure
OpenAI or Ollama once at startup; both LIVE and DEMO execution are then available in the frontend.
Changing the configured LIVE provider still requires a restart; changing execution mode does not.

## Other Ways to Run

If you prefer Docker, run this from the project folder after setting `OPENAI_API_KEY`:

```bash
docker compose up --build
```

For Docker without a model or API key:

```bash
SPRING_PROFILES_ACTIVE=postgres,demo docker compose up --build
```

Both Docker options use the same dashboard address and include PostgreSQL.
Ollama is also supported if you want to use a local model. See the [Spring AI guide](docs/spring-ai.md).

## Workshop Notes

- [Participant guide](docs/participant-guide.md)
- [Workshop guide and exercise](docs/workshop-guide.md)
- [Troubleshooting](docs/troubleshooting.md)
