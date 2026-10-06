# Enterprise Copilot

Enterprise Copilot is a project for our Spring AI workshop at Flo 2026.
We use fictional Ubuntu Bank tickets to show how AI can help understand requirements,
propose code and review changes, while people stay in control of important decisions.

You can follow a ticket in the dashboard, answer questions when information is missing,
and approve or reject the final step. The workshop also includes a small exercise where
you add an agent that gives the system internal business context.

Generated code is only a proposal. Generated tests and deployment are simulated.
Nothing is pushed to GitHub or deployed for real.

## Prerequisites

For the local setup, you need:

- Java 21 (JDK).
- Node.js 22.12 or newer. npm comes with Node.js.
- Git to clone the repository.
- A code editor, such as VS Code or IntelliJ IDEA.
- An OpenAI API key for LIVE mode. DEMO mode does not need a key.

Maven is included through the wrapper. Docker and Ollama are optional.
The local setup uses an in-memory database, so you do not need to install one.

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