# 🎤 Enterprise Copilot — Presenter Cue Card

**Thesis:** AI proposes. Humans dispose. — _AI accelerates delivery; humans own accountability._

## Before you start (30s check)

- [ ] Backend up → http://localhost:8080/actuator/health = UP
- [ ] Frontend up → http://localhost:5173
- [ ] Banner reads **DEMO MODE** (deterministic – can't fail)
- [ ] Scenario dropdown set to `NORMAL`

---

## The run (left = what to CLICK, right = what to SAY)

| # | Click | Say (one line) |
|---|--------|----------------|
| 1 | **Run Pipeline** (scenario `NORMAL`) | "Meet my four AI teammates – watch the pipeline light up." |
| 2 | 🔍 Rhea panel | "Rhea refuses to guess – she checks consent & compliance first." |
| 3 | 💻 Nova panel / **Pull Requests** tab | "Nova proposes code as a PR diff. Nothing touches my repo." |
| 4 | Scenario → **SECURITY_FAILURE** → **Run** | "Now watch Sentinel attack the code…" |
| 5 | 🛡 Sentinel panel (point at CRITICAL) | "It logs the account number – POPIA breach. **REJECT.** Caught before prod." |
| 6 | 🚀 Atlas panel | "**DEPLOYMENT BLOCKED – human approval required.** AI can't click this." |
| 7 | *(pause)* ask the room | "Should the AI deploy anyway?" → let silence land → "No. We own it." |
| 8 | Scenario → `NORMAL` → **Run** → **Approve** | "Clean run → human approves → **DEPLOYED**." |
| 9 | **Audit Trail** tab | "Every step recorded – ending with a human's signature." |

---

## Agent one-liners (if asked)

- 🔍 **Rhea** — "Asks 'what do you actually mean?' before any code exists."
- 💻 **Nova** — "Proposes a diff; never merges."
- 🛡 **Sentinel** — "Reads every line at 5pm Friday and still catches the leak."
- 🚀 **Atlas** — "Rule-based, not AI. It can recommend but can't approve."

## If something breaks (60s recovery)

- UI stalls → re-click **Run Pipeline** (fresh pipeline id).
- Wrong result → check banner; if **LIVE**, restart backend without a profile (→ DEMO).
- Frontend down → demo via Swagger: http://localhost:8080/swagger-ui.html
- Port 8080 busy → `--server.port=8081` + update Vite proxy.

## Scenario → outcome (quick reference)

| Scenario | Ends at |
|-----------|---------|
| NORMAL | WAITING_FOR_APPROVAL → (approve) → DEPLOYED |
| SECURITY_FAILURE | REVIEW_FAILED (CRITICAL) |
| AMBIGUOUS_REQUIREMENT | REQUIREMENTS_READY (pauses; answer to resume) |
| TEST_FAILURE | BLOCKED (tests fail) |
| MISSING_APPROVAL | WAITING_FOR_APPROVAL |
| HALLUCINATED_API | REVIEW_FAILED (invalid API) |
| PROMPT_INJECTION | ignored → WAITING_FOR_APPROVAL |

**Close:** "Not AI replacing engineers – AI accelerating delivery while humans own accountability."

_See also: speaker_notes.md · demo-script.md · failure-scenarios.md_
