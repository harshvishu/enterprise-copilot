# Workshop narrative

The presenter app retains its theme, fonts, code viewer, native scrolling,
keyboard navigation, overview, notes and fullscreen controls. There are 20 slides.

## Final order

1. Animated welcome — Your SDLC, Now Agentic - with Spring AI
2. Traditional → Agentic SDLC — coding assistance versus participation across delivery
3. Meet the four agents — Rhea, Nova, Sentinel, Atlas
4. Animated agent data flow — structured state, coordinated by the orchestrator
5. Architecture — workflow ownership, typed state and governance boundaries
6. Spring AI — the four concepts used by this application
7. From prompt to Java — ChatModel → ChatClient → Prompt → .entity(...)
8. Requirements analysis — enterprise context, prompt and clarification
9. Enterprise tools — policy, architecture and API contracts
10. Pipeline orchestration — sequencing and state transitions
11. Structured output — real Spring AI source and validation
12. Deterministic gates — Reasoning informs. Java enforces.
13. Human authorization — Humans authorize. The system checks again.
14. Live demo — UB-4823 before Confluence context
15. Missing business context — Rhea needs the approved business decision
16. ConfluenceAgent assignment — the existing four participant tasks
17. Hands-on — manually controlled five-minute timer
18. Solution — agent class, constructor wiring, call before Rhea
19. UB-4823 Before/After — approved SMS policy resolves the channel clarification
20. Takeaway — Agents advise. Systems enforce. Humans authorize.

## Reveal and motion behavior

- Agent roles reveal one at a time, beginning with Rhea. Reset returns to Rhea.
- The data-flow slide begins with Issue. Each Reveal next advances one stage:
  Issue → Rhea → Nova → Sentinel → Atlas → Gates → Human → Release.
- A small SVG packet travels along the corresponding connector for 850 ms;
  the current stage is highlighted. Its motion starts when the reveal occurs,
  independent of how long the slide has been mounted. It fades after arrival.
- Analysis, Proposal, Review and Decision appear with their respective agents.
  PipelineContext carries RequirementAnalysis, CodeChangeSet, ReviewDecision
  and DeploymentDecision; PipelineOrchestrator owns sequencing.
- The Gates reveal expands the deterministic checks evaluated by Atlas. It does
  not introduce a fifth agent or a separate runtime stage. Failed gates cannot
  be bypassed by human approval. The diagram illustrates the successful path;
  clarification and failed checks can pause/block the real pipeline.
- Reduced motion retains reveal and highlighting, without the animated packet.
- Reset clears the flow. Page keys continue navigating slides; they do not
  silently advance reveals. Source tabs and the three solution tabs remain manual.
- The timer never starts automatically. Presenter notes suggest revealing the
  reference at approximately four minutes if participants are stuck, without
  automatically changing slides or participant files.

## Changes and intentional omissions

- The old “AI can write code” and “More than implementation” slides are merged
  into the visual comparison. Traditional delivery is not described as merely slow.
- The generic agentic-role slide becomes the named four-agent introduction.
- The animated data-flow slide is added; architecture moves immediately after it.
  The deck stays at 20 slides because the separate delivery slide is removed.
- The broad live demo is replaced by the UB-4823 clarification story, creating a
  direct setup and payoff for the Confluence exercise. UB-4822 feedback/revision
  and UB-4825 negative-control walkthroughs are omitted from the main delivery
  notes to keep the narrative focused; those capabilities remain in the app.
- The separate “Structured output” and “Java object” labels in the conceptual
  Spring AI progression become the concrete .entity(...) step. The real code
  walkthrough and validation remain intact.
- No extra technology, production deployment or real test execution is implied.
  Atlas is deterministic Java; test signals and deployment are simulated in this
  workshop. ConfluenceTool retrieves local workshop policy, not a live service.
- No dense summary follows the final takeaway. The participant frontend and
  backend are unchanged; the presenter opens Enterprise Copilot through its
  configurable URL.
