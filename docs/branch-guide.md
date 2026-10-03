# Branch Guide

This checkout currently has `main` and `origin/main`, not seven checkpoint branches.
Use the complete application on `main` and follow the source reading stages below.
Do not instruct participants to check out branches that are not distributed.

Suggested reading order: scaffold/configuration, dashboard/API, orchestration/context,
Rhea, Nova, Sentinel, Atlas, deterministic scenarios, persistence/audit and tests.

```bash
git branch              # inspect available branches
cd backend && sh ./mvnw spring-boot:run
```

| Historical curriculum label (not an available branch) | Reading focus |
|----------|------------------|
| `00-start` | Scaffold: backend, frontend, Postgres, compose, health |
| `01-dashboard` | Dashboard shell and pipeline visualisation |
| `02-requirements-agent` | Orchestration foundation + Rhea |
| `03-code-agent` | Nova + the diff viewer |
| `04-review-agent` | Sentinel + findings |
| `05-deploy-agent` | Atlas + gates + human approval |
| `06-complete-enterprise-copilot` | Full app on `main` |

OpenAI LIVE is default and requires credentials. Select `demo` explicitly for credential-free preview;
see [README](../README.md). A future set of teaching branches is outside the current implementation scope.