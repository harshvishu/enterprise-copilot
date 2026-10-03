# Speaker Notes — Enterprise Copilot

Stage-ready notes to make the demo engaging. Introduce the four agents like teammates who just
joined your team. Format per agent: **summary**, **speaker notes (say + click)**, **engagement move**,
**one-liner**.

> Guiding thesis: **AI proposes. Humans dispose.** — _AI accelerates delivery; humans own accountability._

Normal workshop execution is OpenAI LIVE; Ollama is an explicit local alternative.
DEMO is an explicitly identified deterministic preview/fallback. Restart the backend with its
profile and reload the dashboard before showing scripted scenarios. Never promise deterministic LIVE findings.
Rhea, Nova and Sentinel use real model calls in LIVE; Atlas is deterministic Java in every mode.

---

## Opening hook (10s)

> "I want you to meet my four newest teammates. They don't drink coffee, they never argue in standup,
> and one of them is about to stop a bug from reaching production. This isn't a chatbot — it's an
> engineering team made of AI, with a human holding the deploy button."

**On screen:** the pipeline strip `ISSUE → REQUIREMENTS → CODE → REVIEW → DEPLOY`.
"Watch it light up left to right." → click **Run Pipeline**.

---

## 🔍 Rhea — Requirements Analyst

**Summary:** Reads the ticket, consults compliance/architecture/history tools, and produces a
structured analysis. Her superpower is **refusing to guess**.

**Speaker notes (say + point):**

> "First up, Rhea. Give a junior a vague ticket and they start coding. Give it to Rhea and she asks
> the awkward questions first." (Point at the requirement panel.) "Notify on transactions over
> R50,000" — she immediately spots what's missing: which channel? Has the customer consented? That's
> POPIA. She won't let us build on assumptions."

**Engagement move:** in explicit DEMO, run `AMBIGUOUS_REQUIREMENT` — the pipeline **pauses** and shows her
questions. Ask: "How many of you have shipped the wrong thing because the ticket was vague?"

In LIVE show whatever clarification Rhea actually requests. Submit one nonblank answer per question;
the saved analysis summary carries those answers to Nova before implementation resumes.

**One-liner:** "Rhea's job is to be the teammate who asks 'wait, what do you actually mean?' before a
line of code exists."

---

## 💻 Nova — Senior Java Engineer

**Summary:** Turns the approved requirement into a **proposal rendered as a pull-request diff** — with
tests. Never touches the filesystem.

**Speaker notes:**

> "Once it's clear, Nova writes the code. But notice — it's a **proposal**, a diff, exactly like a
> pull request." (Point at the diff / Pull Requests tab.) "Nothing is applied. No AI reached into my
> repo. It's asking for review, like any good engineer would."

**Engagement move:** open **Pull Requests**: this screen renders the proposed diff, not real GitHub
operations or a full checks UI. Test names/signals are proposals/simulations, not executed tests.

**One-liner:** "Nova proposes; it never merges. It hands you a diff and says 'take a look'."

---

## 🛡 Sentinel — Security & Compliance Architect (the hero)

**Summary:** Challenges Nova's code — security, compliance, quality, architecture — and returns
severity-tagged findings. **This is the moment of the talk.**

**Speaker notes (slow down here):**

> "Now the review boundary." (In explicitly labeled DEMO, select
> `SECURITY_FAILURE`.) "This scripted example logs the customer's **account number**.
> A rushed human reviewer misses that at 5pm on a Friday. Sentinel doesn't." (Point at the CRITICAL
> finding.) "The scripted verdict is REJECT. Atlas blocks this even if someone wants to approve."

**Engagement move:** pause. "Show of hands — who's confident that exact bug has never shipped in your
org?" Let the silence land.

**One-liner:** "Sentinel is the teammate who reads every line at 5pm on a Friday and still catches the
leak."

---

## 🚀 Atlas — Release Manager

**Summary:** **Rule-based, not AI.** Enforces the gates (review passed, no criticals, valid proposed-test signal,
human approved) and blocks deployment until a person signs off.
Generated tests are never executed. Missing/blank test proposals cannot satisfy a passing signal.

**Speaker notes:**

> "And Atlas controls authorization. Atlas is **not** an LLM; it evaluates hard rules.
> Because the one decision that touches production shouldn't be a probability." (Point at
> **DEPLOYMENT BLOCKED — human approval required**.) "The AI can recommend all day. It cannot click
> this button." (On a separate clean run only, approve -> simulated **DEPLOYED**.)

**Engagement move:** the audience vote — "Should the AI just deploy it anyway?" Let them answer, then:
"No. Accountability stays with us."

**One-liner:** "Atlas can recommend, but it can't approve — a human always owns the last click."

---

## Closing (15s)

> "Four teammates: one clarified, one proposed, one caught the flaw, one held the gate — and a human
> made the call. That's the shift. Not AI replacing engineers. AI **accelerating** delivery while
> humans **own accountability**." (Open the **Audit Trail** — "and every step is recorded, ending with
> a human's approval.")

**Leave them with:** "AI proposes. Humans dispose."

---

## Three engagement tactics that always work here

1. **Ask before you show** — pose the question ("who's shipped a PII-in-logs bug?") _then_ reveal
   Sentinel catching it. The reveal hits harder.

2. **Use the pause** — after DEPLOYMENT BLOCKED, stop talking for 3 seconds and run the audience vote.
   Silence is a tool.

3. **Name them like people** — say "Rhea noticed...", "Sentinel rejected..." not "the requirements
   agent". It makes the room feel they're watching a team.

See also: cue-card.md (one-page presenter card), demo-script.md
(90-second run) and agent-design.md (typed contracts).