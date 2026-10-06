# Your Sprint Has Agents Now — presentation storyboard

Status: the existing 20-page presentation is preserved in the standalone `presentation/` app. Presenter names/contact details and repository QR destination remain to be supplied. No new pages were added during separation.

## Standalone app architecture

`presentation/` owns its Vite/React entry, package manifest/lockfile, tests, Tailwind/PostCSS configuration, shadcn components/configuration, font dependencies and theme provider. `frontend/` is the participant app only. Neither app imports the other's source.

- `presentation/index.html`: standalone entry.
- `presentation/src/presentation/main.jsx`: isolated theme storage and app mounting.
- `Presentation.jsx`: preserved viewport shell, semantic hashes, keyboard navigation, native smooth scrolling, progress, fullscreen, overview/help/notes Sheets.
- `pages.jsx` and `workshop-pages.jsx`: the existing 20-page manifest and components.
- `CodeSlide.jsx`: preserved syntax/highlight rendering.
- `presentation.css`: preserved presentation themes, layouts and reduced-motion behavior.
- `src/content/`: local display snapshots of Java/workshop sources; building the app requires no sibling directories.
- `src/lib/config.js`: configurable participant-app URL, default `http://localhost:5173`.

Run `cd presentation && npm ci && npm run dev`, then open `http://localhost:5174`. Build/test independently with `npm run build` and `npm test`; preview uses port 4174. Hash navigation uses `replaceState` to avoid a history entry per page. Direct hashes restore the page. The participant app still runs on port 5173.

Notes are opt-in and visible in the same browser window; they are not a separate private presenter display. The app launch link lives inside notes and opens `VITE_ENTERPRISE_COPILOT_URL` in a separate tab. Close notes before screen sharing.

## Proposed 20-page narrative (45 minutes)

Times are rehearsal targets. This expands the supplied 11-section outline without adding a page for every source file. All copy below comes from the briefs, or describes verified source behavior. Transitions are brief fades/line emphasis; code windows remain visually consistent across pages. No automatic reveal or timer start.

| # | ID | Time | Audience content / visual | Presenter action and transition |
| --- | --- | --- | --- | --- |
| 01 | intro | 2:00 | “Your Sprint Has Agents Now” / “Building a Multi-Agent SDLC Pipeline with Spring AI.” Presenter names pending. | Very short introductions. Restrained workflow motif. Implemented sample. |
| 02 | problem | 2:00 | “AI can write code. But software delivery is more than writing code.” | Large typography; introduce delivery responsibilities. |
| 03 | delivery | 1:00 | Requirement → Implementation → Review → Release. | Explicit reveal button builds the sequence; page keys still move one page. |
| 04 | agentic-sdlc | 3:00 | Requirements Agent → Coding Agent → Review Agent → Deployment Agent → Human authorization. | Introduce roles before internal names. |
| 05 | spring-ai | 1:00 | Spring AI: model abstraction, interaction API, enterprise context, Java output. | Transition to structured technical surface. |
| 06 | spring-ai-flow | 2:00 | ChatModel → ChatClient → Prompt → Structured Output → Java Object. | Use the concepts in this repository; show model providers as an interchangeable boundary. |
| 07 | architecture | 5:00 | Enterprise context above the agent pipeline; deterministic gates; conditional human approval. | Explain boundaries and policy. Implemented sample; approval is not universal. |
| 08 | pipeline-orchestration | 2:00 | `PipelineOrchestrator.java`: requirements and implementation stages. | Exact source windows; highlight the orchestrator's sequence, not a simplified invented API. |
| 09 | requirements-code | 2:00 | `RequirementsAgent.java`: enterprise context and analysis. | Introduce Rhea only now if useful; highlight prompt assembly. |
| 10 | code | 2:00 | `SpringAiAgentAiClient.java`: `.prompt().user(...).call().entity(responseType)` and `validate(response)`. | Prompt → Java object → validation, explicit highlight controls. Implemented sample. |
| 11 | enterprise-tools | 1:00 | Enterprise tools and context entering the prompt. | Highlight actual calls and their outputs; distinguish fixtures from live integrations. |
| 12 | review-gates | 1:00 | Review evidence → deterministic deployment checks. | Introduce Sentinel/Atlas; explain blocked vs approval-required paths. |
| 13 | human-approval | 1:00 | Human authorization at the controlled boundary. | Exact orchestrator approval checks; no critical-finding override. |
| 14 | live-demo | 6:00 | “LIVE DEMO / Let's run the pipeline.” | Presenter-only app link in notes. Demonstrate success, review/approval, and UB-4823 BEFORE. Return to the same hash. |
| 15 | missing-context | 1:00 | “YOUR TURN / Something is missing.” Issue → Requirements Agent → “Which notification channel should we use?” → Human clarification. | Explain the missing approved business decision. |
| 16 | assignment | 1:00 | “Give the Requirements Agent access to trusted business knowledge.” Four tasks: create ConfluenceAgent, use ConfluenceTool, pass context, rerun UB-4823. | Desired mini architecture. No implementation details beyond the exercise. |
| 17 | hands-on | 7:00 | Same concise task list plus 05:00 timer. | Manual Start/Pause/Reset; no automatic start on entry. Timer stays in the shell session; deadline-based elapsed time. |
| 18 | solution | 3:00 | Exact ~18-line `workshop/reference/ConfluenceAgent.java`; separate short orchestrator integration reveal. | Explicit reveal. Match `withConfluenceActivity` and `requirementsAgent.analyze(ctx, businessContext)` to the workshop guide. |
| 19 | before-after | 1:00 | BEFORE: clarification. AFTER: Confluence → approved SMS policy → requirements → pipeline continues. | Rerun UB-4823 in the actual app; return for comparison. Reserve flex time if live output varies. |
| 20 | finish | 1:00 | “Agents advise. Systems enforce. Humans authorize.” Enterprise Knowledge → AI Agents → Deterministic Gates → Human Accountability. | Minimal closing page. Resource link/QR pending supplied destination. |

## Accuracy constraints for remaining content

Use `docs/workshop-guide.md` and `workshop/reference/ConfluenceAgent.java` for the assignment. ConfluenceTool reads a local Markdown workshop fixture, not the real Confluence service. Its agent deterministically gathers context; it does not make an additional model call. Code, test, and deployment outputs are proposals/simulations in this workshop. Keep that distinction in technical notes and demo narration.

The deck and exercise timer were implemented before separation and are preserved. Do not fill omitted presenter details or resource URLs with invented identities/links.

## Design references

The prototype uses the project's existing shadcn primitives and Lucide icons, with semantic theme tokens. References checked: [shadcn/ui](https://ui.shadcn.com/), [Spring AI](https://spring.io/projects/spring-ai/), [Spring AI reference](https://docs.spring.io/spring-ai/reference/), [Lucide](https://lucide.dev/), and [Tailwind CSS](https://tailwindcss.com/). No visual identity is copied.

## Separation validation

- Participant frontend: 21 tests pass; independent production build passes.
- Standalone presentation: 18 tests pass; independent production build passes.
- Participant frontend also builds from an isolated temporary checkout with no presentation sibling directory.
- Presentation import-boundary test confirms local source imports stay inside its own app.
- Browser check on port 5174 confirms the existing 20-page deck, timer and native smooth arrow navigation render after the move.
- Presentation-only entry and code removed from frontend; its Vite configuration is restored to the participant-only entry. No presentation-only dependencies were added to the frontend manifest.
- Backend and unrelated participant changes were left untouched.
