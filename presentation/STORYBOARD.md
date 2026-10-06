# Workshop narrative

The presenter app retains its theme, fonts, code viewer, native scrolling,
keyboard navigation, overview, notes and fullscreen controls. There are 19 slides.

## Final order

1. Animated welcome — Your SDLC, Now Agentic - with Spring AI
2. Traditional → Agentic SDLC — coding assistance versus participation across delivery
3. Meet the four agents — Rhea, Nova, Sentinel, Atlas
4. What makes this agentic? — context, specialization, control and accountability
5. Spring AI — the four concepts used by this application
6. From prompt to Java — ChatModel → ChatClient → Prompt → .entity(...)
7. Requirements analysis — enterprise context, prompt and clarification
8. Enterprise tools — policy, architecture and API contracts
9. Pipeline orchestration — sequencing and state transitions
10. Structured output — real Spring AI source and validation
11. Deterministic gates — Reasoning informs. Java enforces.
12. Human authorization — Humans authorize. The system checks again.
13. Live demo — UB-4823 before Confluence context
14. Missing business context — Rhea needs the approved business decision
15. ConfluenceAgent assignment — the existing four participant tasks
16. Hands-on — manually controlled five-minute timer
17. Solution — agent class, constructor wiring, call before Rhea
18. UB-4823 Before/After — approved SMS policy resolves the channel clarification
19. Takeaway — Agents advise. Systems enforce. Humans authorize.

## Reveal and motion behavior

- Agent roles reveal one at a time, beginning with Rhea. Prev reverses reveals.
- “What makes this agentic?” opens with only its title. Next cumulatively
  shows Context, Specialization, Control and Accountability in four sparse panels.
  Small secondary text explains each concept. The final reveal adds “Agents advise.
  Systems enforce. Humans authorize.” Prev reverses concepts and the takeaway.
- This slide contains no repeated pipeline or implementation annotations. Reduced
  motion preserves reveals with immediate visibility changes.
- The footer has one consistent ← Prev / Next → pair on every slide. Next and
  Right advance the current reveal or code state; Prev and Left reverse it.
  At the initial/final state they cross to the previous/next slide. Every entry
  through controls, scrolling, hash or overview begins in the initial state.
  PageUp/PageDown, Up/Down and Space remain direct slide navigation. Code tabs
  remain available for explicit selection. Reveal next, Reset and Hide are removed.
  The timer retains manual Start/Pause/Resume and restarts on slide re-entry.
- The timer never starts automatically. Presenter notes suggest revealing the
  reference at approximately four minutes if participants are stuck, without
  automatically changing slides or participant files.

## Changes and intentional omissions

- The old “AI can write code” and “More than implementation” slides are merged
  into the visual comparison. Traditional delivery uses Requirement → Build →
  Verify → Release to describe sequential human handoffs. Stage 3 hides the hero
  title and shows the workshop pipeline in two balanced rows: Issue → Rhea → Nova
  → Sentinel, then down to Atlas and left through gates, approval and Release.
  Explicit role subtitles distinguish agents from system enforcement and human
  authority. The subtitle and a separate “+ More agents” cue explain extensibility
  without inventing agents or omitting testing responsibilities. All arrows loop
  continuously; reduced motion keeps static connectors. The concrete architecture
  is followed by “What makes this agentic?” explaining the four principles.
- The generic agentic-role slide becomes the named four-agent introduction.
- The former “Reasoning meets control.” pipeline slide is replaced by
  “What makes this agentic?” at the existing `#agent-data-flow` URL. The manifest
  supplies all 19 page numbers, overview entries and navigation bounds.
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
