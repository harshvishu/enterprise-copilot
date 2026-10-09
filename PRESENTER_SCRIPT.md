# Presenter script — FLO 2026

## Your SDLC, Now Agentic — with Spring AI

This is the spoken script. Use it as a guide, not something you have to read word for word. Your main sections are the opening, the four agents, and the live walkthrough. The code sections are kept short and can be handed to Dhruv. That speaker split is a suggested plan; change it if you have agreed otherwise.

The separate [presenter notes](PRESENTER_NOTES.md) contain the technical details, demo preparation, recovery steps, and cross-question answers.

**Two issues for the main story:** UB-4821 — SMS payment alerts; UB-4823 — Choose the alert channel. Running UB-4823 again after the exercise is still the same second issue.

## Suggested 45-minute plan

| Time | Part | Lead |
| --- | --- | --- |
| 0–2 min | Opening | Harsh |
| 2–4 min | Traditional to agentic delivery | Harsh |
| 4–8 min | Four agents | Harsh |
| 8–9 min | What makes this agentic? | Harsh |
| 9–16 min | Spring AI and code walkthrough | Dhruv, suggested |
| 16–26 min | Two-issue live walkthrough | Harsh |
| 26–34 min | Assignment and five-minute exercise | Both |
| 34–36 min | Solution and second issue again | Both |
| 36–38 min | Closing | Harsh |
| 38–43 min | Questions | Both |
| 43–45 min | Buffer | Both |

## 1. Welcome — animated intro

*Leave the intro running while people join. Start speaking when you are ready. Keep the existing title.*

> Hi everyone. I am Harsh, and this is Dhruv.
>
> Today we will see how we can use Spring AI to build a workflow where agents help us across software delivery.
>
> Most of us have used AI to write a method, explain some code, or fix an error. That is useful. But writing code is only one part of delivering a feature.
>
> We still need to understand the requirement, follow our architecture, review the changes, and decide whether they are safe to release.
>
> We have built a small Enterprise Copilot around that idea. We will run it, see what each agent does, and then add one missing piece together.
>
> This is a workshop project using a fictional bank. We will be clear about which parts are real and which parts are simulated.
>
> By the end, you should understand how to create a focused agent, give it the right context, and connect it to a controlled workflow.

*Next: move into the problem slide.*

## 2. From coding assistance to software delivery

**Opening state**

> AI coding helps us implement faster. But software delivery starts before implementation and continues after it.

**Next: traditional delivery**

> Here we have requirement, build, verify, and release.
>
> These are broad stages. In a normal workflow, people pass information from one stage to the next. Sometimes a requirement is unclear. Sometimes the developer does not have the latest decision. Sometimes review sends the change back.
>
> The delay is not always in writing code. It can also be in these handoffs and missing information.

**Next: agentic SDLC**

> Our idea is to give different agents a clear responsibility and let them work with shared enterprise context.
>
> This diagram shows the four agents we actually built for this workshop. It is not the complete list of agents that could exist across the SDLC.
>
> Testing and other responsibilities still exist. Some belong to system checks, some belong to humans, and we can add more agents where they are useful.
>
> Notice the end of the flow. We still have system gates and human approval. The agents do not get permission to release something just because they generated it.

## 3. Four specialists. One pipeline.

*Reveal one agent at a time. Give each name a simple job before explaining the implementation.*

**Rhea — Requirements Agent**

> Rhea starts with the issue and asks: what exactly are we trying to build?
>
> It gets context about policy, architecture, API contracts, and history. It uses that information to produce a requirements analysis with acceptance criteria, risks, and clarification questions.
>
> The important part is that it can ask a question. If the business has not decided something, the agent should not quietly make that decision for us.
>
> For example, if an issue says notify the customer but does not say which channel is approved, we want that gap to be visible before we write code.

**Nova — Coding Agent**

> Nova takes the requirements analysis and proposes the implementation.
>
> It also gets the architecture and API contracts. So the task is not just write some code. The task is write code for this requirement, using the interfaces and rules we supplied.
>
> We can inspect the proposed files, the diff, and the explanation. If review asks for changes, we can send feedback and generate a fresh proposal.
>
> A proposal is still a proposal. It needs verification before we accept it.

**Sentinel — Review Agent**

> Sentinel reviews the change against the original issue, the requirements analysis, and our enterprise rules.
>
> It looks for problems such as private information in logs, unsupported API calls, and changes that do not match the requirement.
>
> It returns a structured review decision with findings. It can ask for changes instead of passing the proposal.
>
> It is another model-based check, so it can also make mistakes. We use it as one layer of review, not as proof that the code is correct.

**Atlas — Release Agent**

> Atlas checks whether the workflow is allowed to move forward.
>
> This part is important: Atlas is deterministic Java code. It is not another model deciding whether its own rules matter.
>
> It checks the required artifacts, unresolved questions, the review decision, and the test signal or actual test evidence, depending on the execution target.
>
> If a required check fails, the pipeline stops. If the checks pass, it waits for human approval. Approval does not bypass the checks; they are checked again.
>
> So the four simple jobs are: understand, build, challenge, and control release.

## 4. What makes this agentic?

*Reveal the four concepts. Keep this section short.*

> There are four things behind this workflow.
>
> Context: agents get information from our enterprise sources.
>
> Specialization: each agent has a focused job.
>
> Control: the system owns the rules and the workflow.
>
> Accountability: a human authorizes the critical action.
>
> That is the line we want you to remember: agents advise, systems enforce, humans authorize.

## 5–12. Spring AI and implementation — short bridge

*Suggested handoff.*

> Dhruv will now show how we built this in Java. Focus on where the context comes from, where the model is called, and what happens to its response.

*If you cover these slides yourself, use the short lines below. The detailed explanation is in the notes.*

| Slide | What to say |
| --- | --- |
| Spring AI | Spring AI gives us a Java interface to work with a model. We use a model abstraction, ChatClient, prompts, and typed responses. |
| From prompt to Java | We send instructions and context, then map the response into a Java object. Mapping it does not make it correct. We still validate it. |
| Requirements analysis | This is Rhea. The surrounding Java code gathers the context, calls the model, and returns a requirements analysis. |
| Enterprise tools | In this workshop, these tools mostly read local documents. They represent the enterprise sources we would connect in a larger system. |
| Pipeline orchestration | The orchestrator owns the order and the state. It decides when to continue and when to wait for clarification, feedback, or approval. |
| Structured output | We ask for a structured result so the next stage receives known fields. We validate the result before using it. |
| Deterministic gates | Sentinel gives a review decision. Atlas applies system rules. In proposal mode, the test signal is simulated or model-provided; it is not a real test run. |
| Human authorization | Passing the gates makes the change eligible for approval. It does not approve itself. |

*Take back the demo.*

> Let us run it now. I will use two issues. First, a requirement with the important business details already present. Then, a requirement where one decision is missing.

## 13. Live walkthrough — first issue: UB-4821

*Open Enterprise Copilot using the presentation link. Select the proposal execution target for this main walkthrough. Use LIVE only after rehearsal; DEMO is the predictable fallback. Say which mode you are using before running.*

**If LIVE:**

> This run is using a real model. The issue is fixed, but the response can vary.

**If DEMO:**

> This run uses fixed model responses so we can see the intended teaching outcome. The application workflow and gates still run, but Rhea, Nova, and Sentinel are not calling a model in this mode.

*Select UB-4821 — SMS payment alerts. Read the issue before clicking Run pipeline.*

> The requirement is to send an SMS when a payment is above R50,000. We must use the approved notification service, check SMS consent, and keep private account details out of the message.
>
> This issue already gives us the channel. That will matter when we compare it with the second issue.

*Click Run pipeline. Follow the visible activity. Let the actual result finish before claiming an outcome.*

**At Rhea**

> Rhea is turning this issue into a more usable requirements analysis.
>
> Let us check the acceptance criteria. Do they keep the amount condition, consent, and privacy requirements? The next agent will build from this, so we should not skip this part.

**At Nova**

> Nova now has the issue analysis and the supplied technical context.
>
> Here is the proposal. I am looking at the changed files and the diff, not just the explanation saying everything is fine.
>
> In this execution target, these are proposed changes. They have not been applied to our application repository. The proposed test result is also not evidence of an executed test suite.

**At Sentinel**

> Sentinel checks the proposal against the requirement and the rules.
>
> Let us look at the actual review decision and any findings. We should understand the decision before moving forward.

**At Atlas / waiting for approval**

> The system gates have passed for this run, and now it is waiting for us.
>
> This is the boundary we wanted. The model can help create and review a proposal. It cannot give itself human approval.

*Only if the run is waiting for approval, inspect the gates and click Approve deployment.*

> I have checked the proposal and the decision, and I am approving this workshop run.
>
> The final release step here is simulated. We are not deploying a banking application to production.
>
> The useful thing we have demonstrated is the controlled path from an issue to a reviewed proposal and an explicit human decision.

*Briefly show the audit/activity view.*

> We can follow the recorded actions and decisions rather than treating the whole run as one black box.

**If LIVE pauses or blocks:**

> This run has stopped at a decision boundary. Let us read the reason instead of forcing it through.

*If useful, resolve the question or feedback. If it becomes a long debugging session, use DEMO on the same issue and explain the switch. Do not approve a failed run.*

## 13–14. Second issue: UB-4823 — Choose the alert channel

*Use DEMO deliberately for the reproducible before/after exercise. The starter must have Confluence context unwired. Start a new run for UB-4823.*

> Now the second issue looks very similar. Notify customers when a payment exceeds R50,000, use the approved service, and check consent.
>
> But this time the issue does not tell us which notification channel is approved.
>
> I am using DEMO for this before-and-after example so everyone can compare the same outcome.

*Click Run pipeline. Show Rhea's clarification question. Leave it unanswered.*

> Rhea is asking which channel is approved. It has not continued into code generation.
>
> We could answer this question manually. But what if the business already documented the decision and our application simply did not retrieve it?
>
> That is the missing piece we will add. We need to give Rhea the approved business context before it analyses the issue.

*Return to the presentation.*

## 15–16. Assignment and hands-on

> Your task is to create a small ConfluenceAgent and connect it before Rhea.
>
> The tool and the local decision document are already provided. You do not need to build a Confluence integration today.
>
> Read the context through the supplied tool, pass it into Rhea, and run UB-4823 again.
>
> Keep the change small. We are adding a source of information. We are not changing the gates or removing the human approval step.
>
> You have five minutes. We will help if you get stuck.

*Start the timer manually once participants are ready. Walk around; avoid filling the exercise with another lecture. If needed, show the reference near the end.*

## 17–18. Solution and the same second issue again

*Show the small context helper and wiring. Restart the backend if required. Run a fresh UB-4823 pipeline after the context is connected.*

> This helper reads the supplied decision page and returns the business context. It does not need another model call.
>
> We pass that context into the requirements analysis before the coding stage starts.
>
> The approved decision says SMS is the launch channel. Consent is still required. Email and push are outside this decision.

*Check the actual result.*

> In this DEMO run, the channel clarification is now resolved because we supplied the approved decision.
>
> We did not make the model smarter. We gave it information it was missing.
>
> That does not mean every proposal will pass. Review, system gates, and human approval still apply.

## 19. Finish

> Today we started with a familiar problem: code generation is useful, but delivery needs more than code.
>
> We gave four parts of the workflow clear responsibilities. We made the context visible. We kept the system rules outside model authority. And we kept a human decision at the boundary.
>
> Then we added one small context helper and saw why the right information matters.
>
> If you take one thing from this workshop, take this: do not start by giving an agent every permission. Start with a clear job, the right context, a result you can inspect, and a controlled next step.
>
> Agents advise. Systems enforce. Humans authorize.
>
> Thank you. Let us take your questions.

## Short answers you can say during the talk

**Is this fully autonomous?**

> No. This is a controlled agent workflow. Java owns the sequence, agents handle focused reasoning tasks, and people handle the decision boundaries.

**Are these four different models?**

> No. They are different roles and prompts. Rhea, Nova, and Sentinel can use the same model. Atlas uses Java rules.

**Did we really run the generated tests?**

> In this proposal walkthrough, no. The separate local repository target can apply a candidate in a dedicated clone and run pytest. We should not mix up those two targets.

**Does approved mean deployed to production?**

> No. Release is simulated here. In the local repository target, approval and local merge are also separate actions.

**Where is testing in the agentic diagram?**

> It has not disappeared. The diagram shows our four workshop agents, not every delivery responsibility. Test evidence belongs to the verification and system controls, and the workflow can be extended.

**What if an agent is wrong?**

> That can happen. We inspect the output, use review and system checks, and ask for human input where needed. These layers reduce risk; they do not make the model infallible.
