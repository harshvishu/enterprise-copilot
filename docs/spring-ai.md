# Spring AI

Spring AI is the **primary, Spring-native integration layer**.

## What Spring AI provides here

- **`ChatClient`** – the fluent client used by `SpringAiAgentAiClient`.

- **Structured output** –
  `chatClient.prompt().user(prompt).call().entity(RequirementAnalysis.class)`
  maps the model response straight onto a typed record. No manual JSON parsing.

- **Model abstraction** – the same `ChatClient` works over Ollama or OpenAI.

- **System prompt / policy** – a default system message enforces that policy beats ticket text.

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
| `demo` (default) | `DemoAgentAiClient` | Deterministic `DemoResponses` |
| `ollama` | `SpringAiAgentAiClient` | `OllamaChatModel` built in `AiConfig` |
| `openai` | `SpringAiAgentAiClient` | OpenAI starter autoconfigured `ChatModel` |

Switching provider is a **profile change**, never a code change.

## Enabling OpenAI (cloud — recommended for live demos)

The `spring-ai-starter-model-openai` dependency autoconfigures a `ChatModel` from `spring.ai.openapi.*`.

It is inert by default (all `spring.ai.model.*` types are set to `none` in `application.yml`), so DEMO needs no key.

Activate it with the `openai` profile and a key in the **backend** environment:

```powershell
$env:OPENAI_API_KEY="sk-..."
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=openai"
```

`application-openai.yml` sets `spring.ai.model.chat=openai`
and `spring.ai.openai.chat.options.model`
(default `gpt-4o-mini` – fast, cheap, reliable structured output).

`SpringAiAgentAiClient` consumes the autoconfigured `ChatModel`
unchanged.

> **Azure OpenAI note:** Spring AI 1.x had a dedicated Azure module, but it was **removed in Spring AI 2.0** – there is no `spring-ai-starter-model-azure-openai`.
> To reach Azure, point `spring.ai.openai.base-url`
> at your Azure OpenAI endpoint (it is OpenAI-API-compatible).

## Prompts

Prompts are externalised under `src/main/resources/prompts/*.st`,
each with ROLE, MISSION, CONTEXT,
CONSTRAINTS, TOOLS, OUTPUT CONTRACT,
FAILURE CONDITIONS, SECURITY RULES and HUMAN ESCALATION
sections.

`PromptLibrary` loads and renders them – never giant strings in Java.