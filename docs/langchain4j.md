# LangChain4j

LangChain4j is included as a **complementary** agent library,
not a second orchestrator. Spring AI is
the primary Spring-native layer; LangChain4j is present to
demonstrate its distinct strengths without
duplicating orchestration.

## Division of responsibility

| Concern | Owner |
|----------|--------|
| Spring-native DI, config, `ChatClient`, structured output | **Spring AI** |
| Pipeline orchestration & gates | **This app (PipelineOrchestrator)** |
| Illustrative agent-library capabilities (tool calling, bounded memory, routing) | **LangChain4j** |

## Where it adds value (extension points)

- **Tool calling** - LangChain4j `@Tool`-annotated methods
  and `AiServices` can expose the same
  deterministic tools (Compliance/Architecture/GitHistory/
  ApiSpec) to an LLM.

- **Bounded memory** -
  `MessageWindowChatMemory` gives Rhea a
  small, capped memory of prior
  clarifications with an explicit retention policy (no
  unbounded conversational history).

- **Routing** - routing a ticket to the right first agent
  based on its content.

> To keep the workshop understandable and the demo
> deterministic, the main pipeline does not require a
> live LangChain4j service. The dependency and patterns are
> wired so attendees can extend them. This
> avoids two competing orchestration layers.