# Enterprise Copilot presentation

Standalone presenter app. The 19-page workshop follows problem → agents → What makes this agentic? → Spring AI → implementation → UB-4823 demo → Confluence exercise → payoff. The delivery comparison shows the pipeline; the following conceptual slide progressively reveals context, specialization, control and accountability. A shared footer Prev/Next pair and Left/Right keys reverse or advance reveals and code states, then cross slide boundaries. Slide entry restores the initial state. Themes, native scroll snapping, smooth page navigation, code walkthroughs, notes, timer, and solution reveal are preserved. See [STORYBOARD.md](STORYBOARD.md) for the slide order and reveal behavior. The participant application remains in `../frontend` and is opened only through a URL.

## Run

```sh
cd presentation
npm ci
npm run dev
```

Open [http://localhost:5174](http://localhost:5174). The presenter server uses strict port 5174; the participant frontend remains on 5173. No backend or participant frontend is required to render or build the presentation.

```sh
npm test
npm run build
npm run preview
```

Production output is `presentation/dist/`. Preview uses port 4174.

## Participant application URL

Copy `.env.example` to `.env` and set:

```dotenv
VITE_ENTERPRISE_COPILOT_URL=http://localhost:5173
```

This defaults to `http://localhost:5173`. It is a build-time Vite setting; restart the dev server or rebuild after changing it. Launch links on the live-demo slide and in speaker notes open that URL in another tab. No app embedding or source imports.

## Independence

This directory owns its package manifest and lockfile, Vite/React build, Tailwind/PostCSS configuration, shadcn components/configuration, fonts, theme provider/storage, and tests. There are no workspace packages, symlinks, or imports from `frontend/src`.

`src/content/` contains local source snapshots used as presentation text. These preserve the displayed code without requiring backend, workshop, or documentation files at build time. Original locations:

- `SpringAiAgentAiClient.java.txt`: `backend/src/main/java/com/enterprise/copilot/infrastructure/ai/SpringAiAgentAiClient.java`
- `PipelineOrchestrator.java.txt`: `backend/src/main/java/com/enterprise/copilot/orchestration/PipelineOrchestrator.java`
- `RequirementsAgent.java.txt`: `backend/src/main/java/com/enterprise/copilot/agents/requirements/RequirementsAgent.java`
- `DeployAgent.java.txt`: `backend/src/main/java/com/enterprise/copilot/agents/deploy/DeployAgent.java`
- `ConfluenceAgent.java.txt`: `workshop/reference/ConfluenceAgent.java`
- `workshop-guide.md`: `docs/workshop-guide.md`

Refresh these deliberately when workshop source changes. They are display assets, not executable Java. Presenter delivery notes live in the slide manifest and are available through Speaker notes. Contact and repository QR links remain omitted until destinations are supplied.
