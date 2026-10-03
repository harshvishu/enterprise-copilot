# Spring AI

Spring AI is the **primary, Spring-native integration layer**.

## What Spring AI provides here

- **`ChatClient`** – the fluent client used by `SpringAiAgentAiClient`.

- **Structured output** –
  `chatClient.prompt().user(prompt).call().entity(RequirementAnalysis.class)`
  maps the model response straight onto a typed record. No manual JSON parsing.

- **Model abstraction** – the same `ChatClient` works over Ollama or OpenAI.

- **System prompt / policy** - a shared system message instructs the model to ignore injected policy overrides.
  This is model guidance, not deterministic enforcement; Atlas's Java gates supply enforcement.

## The provider port

Agents depend only on `AgentAiClient`:

```java
<T> T generate(
    AgentKind agent,
    DemoScenario scenario,
    String renderedPrompt,
    Class<T> responseType
);
```

| Profile | Bean | Backing |
|----------|------|---------|
| `openai` (default) | `SpringAiAgentAiClient` | OpenAI starter autoconfigured `ChatModel` |
| `ollama` | `SpringAiAgentAiClient` | `OllamaChatModel` built in `AiConfig` |
| `demo` (explicit preview/fallback) | `DemoAgentAiClient` | Deterministic `DemoResponses` |

Switching provider is an explicit profile change and restart. Select exactly one AI profile;
combine it with `postgres` when needed. There is no automatic failover to another model or DEMO.
The mode/provider banner is derived from profile selection, not `copilot.ai.mode`.

## Enabling OpenAI (cloud — recommended for live demos)

The existing `spring-ai-starter-model-openai` dependency autoconfigures a `ChatModel` from `spring.ai.openai.*`.

The default `openai` profile sets `spring.ai.model.chat=openai`. Missing or blank credentials
produce an early configuration error. Base configuration explicitly disables unused embedding,
image, audio and moderation models, whose starter conditions otherwise default to OpenAI.
Explicit `demo` keeps model autoconfiguration disabled and needs no key; Ollama builds only its chat model.

Supply `OPENAI_API_KEY` in the backend environment, then start the default profile:

```bash
# Supply OPENAI_API_KEY securely in this terminal environment; never commit its value.
cd backend
sh ./mvnw spring-boot:run
```

`application-openai.yml` sets `spring.ai.model.chat=openai`
and `spring.ai.openai.chat.options.model`
(default `gpt-4o-mini` – fast, cheap, reliable structured output).

`SpringAiAgentAiClient` consumes the autoconfigured `ChatModel`
unchanged.

Ollama is the explicit local LIVE alternative: select `ollama`, run the service and pull
`OLLAMA_MODEL` (default `llama3.1`). `OLLAMA_BASE_URL` defaults to localhost:11434.
Azure configuration is deferred; there is no supported Azure profile in this repository.

Rhea, Nova and Sentinel call the model. Atlas does not: `deploy.st` only repeats the
same gate inputs as Java and is retained as unused reference material, not an active AI stage.
Tools are resolved directly by Java before prompting; no AI tool callbacks or memory are registered.
The live adapter checks required result fields and surfaces provider-specific failures without DEMO substitution.
LIVE scenario outcomes are not guaranteed; `testsPass` is proposed/simulated evidence, not real CI.

## Prompts

Prompts are externalised under `src/main/resources/prompts/*.st`,
each with ROLE, MISSION, CONTEXT,
CONSTRAINTS, TOOLS, OUTPUT CONTRACT,
FAILURE CONDITIONS, SECURITY RULES and HUMAN ESCALATION
sections.

`PromptLibrary` loads/caches text and replaces placeholders; it is not Spring AI `PromptTemplate`.