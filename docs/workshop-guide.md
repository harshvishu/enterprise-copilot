# Workshop Guide

## Before the session

Use `main`; this checkout does not contain the previously documented checkpoint branches.
Follow [README](../README.md) for JDK 21, Node 22.12+, backend OpenAI credentials and setup.
OpenAI LIVE is primary. Rehearse one real run and complete any clarification questions.
Have the explicit `demo` profile ready for participant self-checks or an identified fallback.
Ollama is optional and explicitly selected; Azure and framework/infrastructure additions are deferred.
After changing provider, restart the backend and reload the dashboard to refresh its status.

## Suggested 45-minute flow

| Minutes | Activity |
|---|---|
| 0-5 | Problem and agentic SDLC concept |
| 5-12 | Rhea, Nova, Sentinel, deterministic Atlas and human authorization |
| 12-20 | Spring AI fundamentals using the actual ChatModel, ChatClient and structured output code |
| 20-27 | Run the pipeline; explain events, tools, proposals and typed results |
| 27-32 | Human clarification and governance demonstration |
| 32-40 | Participant exercise: add a deterministic Confluence Agent |
| 40-45 | Run the AFTER comparison and recap |

## Five-Minute Exercise

Show `SpringAiAgentAiClient` calling `chatClient.prompt().user(renderedPrompt).call().entity(RequirementAnalysis.class)`.
Explain ChatModel as the provider abstraction, ChatClient as the interaction API, the prompt as instructions/context,
and `.entity(...)` as structured Java output. Rhea already knows how to reason; it needs the missing business context.

The tool and document loading, Rhea's string overload and DEMO plumbing are provided. Participants create only
`agents/confluence/ConfluenceAgent.java` with the supplied package/imports and constructor injection:

```java
public String gatherContext(Ticket ticket) {
	return confluenceTool.lookup(ticket.description());
}
```

Inject the agent using the supplied constructor snippet and replace the initial Rhea call:

```java
String businessContext = withConfluenceActivity(ctx,
	() -> confluenceAgent.gatherContext(ctx.ticket()));
RequirementAnalysis analysis = requirementsAgent.analyze(ctx, businessContext);
```

This is about 15-20 lines for the agent including imports, plus supplied wiring: five minutes expected, eight maximum.
No extra LLM call, prompt, DTO, validation subsystem, fixtures or persistence work is assigned to participants.
`ConfluenceTool` reads one local workshop Markdown page, not a real Confluence service or search system.
Rhea decides whether that page's approved decisions apply; the new agent only gathers context.
The supplied `withConfluenceActivity` wrapper records existing agent/tool activity events. It is provided plumbing,
not participant work. Without Confluence activity, the stage rail stays Rhea -> Nova -> Sentinel -> Atlas. Once the
participant context call runs, it shows Confluence -> Rhea -> Nova -> Sentinel -> Atlas. Participants never change
React, event schemas, SSE infrastructure or pipeline state; the UI detects the optional stage from the events.

Use UB-4823 BEFORE to show missing credit eligibility, channel and absent-consent choices. AFTER supplies the
approved retail launch decision. UB-4825 remains a negative control because that page provides no fraud contract.
The currently active reference exposes BEFORE through the baseline `/api/agents/requirements` preview (select
AMBIGUOUS_REQUIREMENT first in DEMO); the pipeline itself is AFTER. The participant starter is not restored yet.

After four or five exercise minutes, offer the recovery helper; minute eight is the hard stop. The helper will be
packaged from this tested reference only after approval. It does not exist in the repository yet, and no installer
or destructive reset is part of the current implementation.

Do not promise a deterministic live security finding or a 90-second real model response.
Atlas is intentionally Java: the unused deploy prompt merely repeats its hard gates.
DEMO security failure ends BLOCKED and cannot be approved. Use a separate clean run for approval.
Generated tests and deployment are simulated even in LIVE. No production identity/integration is implied.

See [demo-script.md](demo-script.md) for the tight 90-second version.