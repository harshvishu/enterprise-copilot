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

Select DEMO under **Next run** beside the theme controls. No restart is needed.
The current LIVE run keeps its mode; the next run shows **DEMO · DETERMINISTIC**.

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
   "Rhea confirms that delivery logs must use masked references, not account numbers."
   Point at the requirement panel.

4. **Nova (15s).** 💻
   "Nova proposes `NotificationService` as a pull-request diff
   with proposed tests. No generated tests execute."
   Show the diff.

5. **Sentinel - the moment (20s).** 🛡️
   "This fixture demonstrates the review boundary: the account number is logged in plain
   text, and Sentinel requests a correction."
   Point at the HIGH finding.

6. **Human feedback (10s).**
   Click **Use masked references** below the input, then **Revise proposal**.
   "Nova revises the proposal and Sentinel reviews it again. Feedback is not approval."

7. **Audience vote (10s).**
   "Should the AI deploy anyway?"
   Let them react.
   "No - accountability stays with us."

8. **Approval.**
   After the fresh review passes and Atlas reaches approval, click
   **Approve** → simulated **DEPLOYED**.

   Show the audit trail: significant actions, ending with
   `Human: APPROVE_DEPLOYMENT`.

For clarification, run UB-4823 in RESET and tap an SMS hint below its single channel question, then submit.
In APPLY, Confluence resolves that question. UB-4825 goes directly to Sentinel's unsupported-API block in DEMO;
its deliberately defective proposal must not be described as evidence of LIVE model performance.

## If something misbehaves

Agent/scenario outcomes are deterministic in DEMO; infrastructure can still fail. If the UI stalls,
re-click **Run Pipeline** (a fresh pipeline id resets the
stream). See `docs/troubleshooting.md`.