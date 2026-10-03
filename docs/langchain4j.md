# LangChain4j

LangChain4j is present only as a BOM/dependency in `backend/pom.xml`.
There are no application imports, `AiServices`, tool annotations, memory or routing services.
It currently demonstrates no runtime capability distinct from Spring AI.
Removal is deferred; this workshop's actual model integration is Spring AI.

## Division of responsibility

| Concern | Owner |
|----------|--------|
| Spring-native DI, config, `ChatClient`, structured output | **Spring AI** |
| Pipeline orchestration & gates | **This app (PipelineOrchestrator)** |
| Model-selected tools, bounded memory, routing | **Not implemented** |

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

> The examples above are potential extensions only, not wired services.
> OpenAI is the normal LIVE workshop provider through Spring AI. No second framework is
> required to run OpenAI, Ollama or the deterministic preview.