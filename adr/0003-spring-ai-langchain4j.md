# ADR 0003 – Spring AI as primary, LangChain4j as complementary

## Status

Accepted

## Context

The workshop showcases the Java AI ecosystem. Using two
orchestration frameworks that overlap would
confuse attendees and duplicate responsibilities.

## Decision

**Spring AI** is the primary, Spring-native integration layer
(`ChatClient`, structured output, model
abstraction, provider switching by profile). **LangChain4j**
is included to demonstrate complementary
agent-library capabilities (tool calling, bounded memory,
routing) as documented extension points –
not as a second orchestrator.

## Consequences

- One clear orchestration story (the app's
  `PipelineOrchestrator` + Spring AI).
- Attendees see where each framework shines without competing
  layers.
- LangChain4j currently exists only as a dependency: no tools, services, memory or routing are wired.
  Retention/removal is deferred; all real model calls use Spring AI's existing OpenAI/Ollama abstraction.