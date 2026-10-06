# Enterprise Copilot presentation

Standalone presenter app. The existing 20-page presentation, themes, native scroll snapping, smooth keyboard navigation, code walkthroughs, notes, timer, and solution reveal are preserved. The participant application remains in `../frontend` and is opened only through a URL.

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

This defaults to `http://localhost:5173`. It is a build-time Vite setting; restart the dev server or rebuild after changing it. The launch link in speaker notes opens that URL in another tab. No app embedding or source imports.

## Independence

This directory owns its package manifest and lockfile, Vite/React build, Tailwind/PostCSS configuration, shadcn components/configuration, fonts, theme provider/storage, and tests. There are no workspace packages, symlinks, or imports from `frontend/src`.

`src/content/` contains local source snapshots used as presentation text. These preserve the displayed code without requiring backend, workshop, or documentation files at build time. Original locations:

- `SpringAiAgentAiClient.java.txt`: `backend/src/main/java/com/enterprise/copilot/infrastructure/ai/SpringAiAgentAiClient.java`
- `PipelineOrchestrator.java.txt`: `backend/src/main/java/com/enterprise/copilot/orchestration/PipelineOrchestrator.java`
- `RequirementsAgent.java.txt`: `backend/src/main/java/com/enterprise/copilot/agents/requirements/RequirementsAgent.java`
- `DeployAgent.java.txt`: `backend/src/main/java/com/enterprise/copilot/agents/deploy/DeployAgent.java`
- `ConfluenceAgent.java.txt`: `workshop/reference/ConfluenceAgent.java`
- `workshop-guide.md`: `docs/workshop-guide.md`

Refresh these deliberately when workshop source changes. They are display assets, not executable Java. Presenter/contact details still await supplied content; no new pages were added during separation.
