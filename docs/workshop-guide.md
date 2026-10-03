# Workshop Guide

## Before the session

Use `main`; this checkout does not contain the previously documented checkpoint branches.
Follow [README](../README.md) for JDK 21, Node 22.12+, backend OpenAI credentials and setup.
OpenAI LIVE is primary. Rehearse one real run and complete any clarification questions.
Have the explicit `demo` profile ready for participant self-checks or an identified fallback.
Ollama is optional and explicitly selected; Azure and framework/infrastructure additions are deferred.
After changing provider, restart the backend and reload the dashboard to refresh its status.

## Suggested 45-minute flow

1. **(5m)** The idea: AI teammates across the SDLC; the accountability principle.
2. **(5m)** Tour the dashboard and the pipeline stages.
3. **(10m)** Rhea + real OpenAI call + structured output + directly supplied reference tools; answer clarification.
4. **(5m)** Nova + the diff-as-proposal safety model.
5. **(10m)** Sentinel's real review, then an explicitly labeled DEMO security-failure run if needed.
6. **(5m)** Atlas + gates + the human approval vote.
7. **(5m)** Audit trail, provider distinction and limitations, Q&A.

Do not promise a deterministic live security finding or a 90-second real model response.
Atlas is intentionally Java: the unused deploy prompt merely repeats its hard gates.
DEMO security failure ends BLOCKED and cannot be approved. Use a separate clean run for approval.
Generated tests and deployment are simulated even in LIVE. No production identity/integration is implied.

See [demo-script.md](demo-script.md) for the tight 90-second version.