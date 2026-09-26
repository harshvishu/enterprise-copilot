# Workshop Guide

## Checkpoint branches

Each branch is runnable and has a meaningful checkpoint.

| Branch | You have learned… |
|----------|-------------------|
| `00-start` | Project scaffold: backend, frontend, Postgres, compose, health |
| `01-dashboard` | The dashboard shell and pipeline visualisation |
| `02-requirements-agent` | Pipeline orchestration foundation + Rhea |
| `03-code-agent` | Nova + the GitHub-style diff viewer |
| `04-review-agent` | Sentinel + findings + REQUEST_CHANGES |
| `05-deploy-agent` | Atlas + gates + human approval |
| `06-complete-enterprise-copilot` | Full app: scenarios, SSE, audit, GitHub sim, tests |

Check out a branch and run it:

```bash
git checkout 03-code-agent

cd backend && mvn spring-boot:run
```

## Suggested 45-minute flow

1. **(5m)** The idea: AI teammates across the SDLC; the accountability principle.
2. **(5m)** Tour the dashboard and the pipeline stages.
3. **(10m)** Rhea + Spring AI structured output + tools + deterministic mode.
4. **(5m)** Nova + the diff-as-proposal safety model.
5. **(10m)** **Sentinel** - the hero: catch the sensitive-data leak live.
6. **(5m)** Atlas + gates + the human approval vote.
7. **(5m)** Audit trail, LIVE vs DEMO, Q&A.

See [demo-script.md](demo-script.md) for the tight 90-second version.