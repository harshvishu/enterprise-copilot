# Live Workshop And Deterministic Fallback

**Goal:** make the audience feel they are watching an
AI-native engineering org - not a chatbot.

## Before you start

- Backend running (`sh ./mvnw spring-boot:run` from `backend/`), frontend running
  (`npm run dev`).
- Dashboard open at http://localhost:5173. Normal workshop banner: **LIVE · OPENAI**.
- Supply backend credentials before startup. Rehearse availability and structured output;
   real model latency and decisions are not deterministic.

## Normal LIVE run

Run the ordinary ticket. Show Rhea's actual analysis and supply complete clarification answers.
Show Nova's proposal and Sentinel's actual review without promising an injected failure.
Atlas enforces hard gates in Java. Approve only if waiting for approval; otherwise explain the block.
Deployment and generated-test outcomes are simulations. Show the significant-action audit.
If the provider fails, show the failure. Never claim a scripted result came from OpenAI.

To use the fallback, explicitly restart with `SPRING_PROFILES_ACTIVE=demo` and reload the dashboard.
Confirm **DEMO · DETERMINISTIC** before proceeding below.

## Deterministic fallback run (approximately 90s)

1. **Set the stage (10s).**
   "A developer files a ticket: notify customers when a
   transaction exceeds R50,000. Watch our AI teammates pick it
   up."
   Scenario = `SECURITY_FAILURE`.

2. **Click Run Pipeline (5s).**
   Stages light up: ISSUE → REQUIREMENTS → CODE → REVIEW →
   DEPLOY.

3. **Rhea (15s).** 🔍
   "Rhea confirms consent and audit requirements from policy."
   Point at the requirement panel.

4. **Nova (15s).** 💻
   "Nova proposes `NotificationService` as a pull-request diff
   with tests."
   Show the diff.

5. **Sentinel - the moment (20s).** 🛡️
   "This fixture demonstrates the review boundary: the account number is logged in plain
   text, and the scripted Sentinel response rejects it."
   Point at the CRITICAL finding.

6. **Atlas (10s).** 🚀
   "Atlas blocks deployment because review failed and a critical finding exists.
   Human approval cannot override this technical block."

7. **Audience vote (10s).**
   "Should the AI deploy anyway?"
   Let them react.
   "No - accountability stays with us."

8. **Clean run (optional).**
   Switch to `NORMAL`, Run Pipeline, reach approval, click
   **Approve** → simulated **DEPLOYED**.

   Show the audit trail: significant actions, ending with
   `Human: APPROVE_DEPLOYMENT`.

## If something misbehaves

Agent/scenario outcomes are deterministic in DEMO; infrastructure can still fail. If the UI stalls,
re-click **Run Pipeline** (a fresh pipeline id resets the
stream). See `docs/troubleshooting.md`.