# 90-Second Demo Script

**Goal:** make the audience feel they are watching an
AI-native engineering org - not a chatbot.

## Before you start

- Backend running (`mvn spring-boot:run`), frontend running
  (`npm run dev`).
- Dashboard open at http://localhost:5173. Confirm the **DEMO
  MODE** banner.

## The run (≈90s)

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
   "Sentinel rejects it: the account number is logged in plain
   text - a POPIA violation."
   Point at the CRITICAL finding.

6. **Atlas (10s).** 🚀
   "Atlas blocks deployment. Screen says
   **DEPLOYMENT BLOCKED - human approval required**."

7. **Audience vote (10s).**
   "Should the AI deploy anyway?"
   Let them react.
   "No - accountability stays with us."

8. **Clean run (optional).**
   Switch to `NORMAL`, Run Pipeline, reach approval, click
   **Approve** → **DEPLOYED**.

   Show the audit trail: every step, ending with
   `Human: APPROVE_DEPLOYMENT`.

## If something misbehaves

Everything is deterministic in DEMO mode. If the UI stalls,
re-click **Run Pipeline** (a fresh pipeline id resets the
stream). See `docs/troubleshooting.md`.