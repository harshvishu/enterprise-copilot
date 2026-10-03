# 🎤 Enterprise Copilot — Presenter Cue Card

**Thesis:** AI proposes. Humans dispose. — _AI accelerates delivery; humans own accountability._

## Before you start (30s check)

- [ ] Backend up → http://localhost:8080/actuator/health = UP
- [ ] Frontend up → http://localhost:5173
- [ ] Banner reads **LIVE · OPENAI** and a real model call has been rehearsed
- [ ] Explicit DEMO restart command is ready; no automatic fallback

---

## The run (left = what to CLICK, right = what to SAY)

| # | Click | Say (one line) |
|---|--------|----------------|
| 1 | **Run Pipeline** in LIVE | "Three model-backed agents and one deterministic release manager." |
| 2 | 🔍 Rhea panel | "Rhea refuses to guess – she checks consent & compliance first." |
| 3 | 💻 Nova panel / **Pull Requests** tab | "Nova proposes code as a PR diff. Nothing touches my repo." |
| 4 | Answer clarification if requested | "These answers are saved and passed to Nova." |
| 5 | Sentinel panel | "This is the actual model review; approval or rejection is not scripted in LIVE." |
| 6 | Atlas panel | "Java enforces artifacts, clarification, review, criticals, test signal and human approval." |
| 7 | *(pause)* ask the room | "Should the AI deploy anyway?" → let silence land → "No. We own it." |
| 8 | Approve only if waiting | "Human action plus gate recheck -> simulated DEPLOYED." |
| 9 | **Audit Trail** tab | "Significant actions recorded; the presenter label is not authenticated identity." |

---

## Agent one-liners (if asked)

- 🔍 **Rhea** — "Asks 'what do you actually mean?' before any code exists."
- 💻 **Nova** — "Proposes a diff; never merges."
- 🛡 **Sentinel** — "Reads every line at 5pm Friday and still catches the leak."
- 🚀 **Atlas** — "Rule-based, not AI. It can recommend but can't approve."

## If something breaks (60s recovery)

- UI stalls → re-click **Run Pipeline** (fresh pipeline id).
- Live failure -> show it; explicitly restart with `SPRING_PROFILES_ACTIVE=demo` and reload the dashboard.
- In DEMO choose SECURITY_FAILURE: scripted REJECT -> BLOCKED, no approval bypass.
- Then choose NORMAL for a separate approval demonstration. Restarting without a profile selects OpenAI, not DEMO.
- Frontend down → demo via Swagger: http://localhost:8080/swagger-ui.html
- Port 8080 busy → `--server.port=8081` + update Vite proxy.

## Scenario → outcome (quick reference)

| Scenario | Ends at |
|-----------|---------|
| NORMAL | WAITING_FOR_APPROVAL → (approve) → DEPLOYED |
| SECURITY_FAILURE | REVIEW_FAILED then BLOCKED (CRITICAL) |
| AMBIGUOUS_REQUIREMENT | REQUIREMENTS_READY (pauses; answer to resume) |
| TEST_FAILURE | BLOCKED (tests fail) |
| MISSING_APPROVAL | WAITING_FOR_APPROVAL |
| HALLUCINATED_API | REVIEW_FAILED then BLOCKED (invalid API) |
| PROMPT_INJECTION | ignored → WAITING_FOR_APPROVAL |

The scenario table applies only to DEMO. Its dropdown is hidden in LIVE.
Test signals and deployment are simulated; the current deployment prompt is unused gate-reference material.

**Close:** "Not AI replacing engineers – AI accelerating delivery while humans own accountability."

_See also: speaker-notes.md · demo-script.md · failure-scenarios.md_
