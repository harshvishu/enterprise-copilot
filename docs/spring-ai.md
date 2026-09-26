# Spring AI

Spring AI is the **primary, Spring-native integration layer**.

## What Spring AI provides here

- **`ChatClient`** - the fluent client used by `SpringAiAgentAiClient`.

- **Structured output** -
  `chatClient.prompt().user(prompt).call().entity(RequirementAnalysis.class)`
  maps the model response straight onto a typed record. No
  manual JSON parsing.

- **Model abstraction** - the same `ChatClient` works over
  Ollama or Azure OpenAI.

- **System prompt / policy** - a default system message
  enforces that policy beats ticket text.

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
| `azure` | `SpringAiAgentAiClient` | Azure starter autoconfigured `ChatModel` |

Switching provider is a **profile change**, never a code
change.

## Enabling Azure OpenAI

Spring AI 2.0 uses the official OpenAI SDK client. The
cleanest path for Azure is its starter, which
autoconfigures a `ChatModel` from properties. Add to `backend/pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-model-azure-openai</artifactId>
</dependency>
```

Then run with `-Dspring-boot.run.profiles=azure` and supply
`AZURE_OPENAI_API_KEY` /
`AZURE_OPENAI_ENDPOINT` via environment variables (see
`application-azure.yml`). `SpringAiAgentAiClient`
consumes the autoconfigured `ChatModel` unchanged.

## Prompts

Prompts are externalised under
`src/main/resources/prompts/*.st`, each with ROLE,
MISSION, CONTEXT, CONSTRAINTS, TOOLS, OUTPUT CONTRACT,
FAILURE CONDITIONS, SECURITY RULES and HUMAN ESCALATION
sections.

`PromptLibrary` loads and renders them - never giant strings
in Java.