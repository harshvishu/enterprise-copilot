# Branch Guide

The repository ships with seven checkpoint branches. **Every
branch is the complete, runnable
application** - stable checkpoints you can start a session
from, not partial builds. Because the four
agents, orchestrator and dashboard are interdependent in this
modular monolith, each branch contains
the whole app so it always compiles and runs.

The **learning narrative lives in the commit history** (`git
log --oneline`), structured phase by
phase: scaffold → dashboard → orchestration → Rhea → Nova →
Sentinel → Atlas → scenarios → tests →
productionisation.

```bash
git branch              # list checkpoints
git checkout 04-review-agent
cd backend && ./mvnw spring-boot:run
```

| Branch | Checkpoint focus |
|----------|------------------|
| `00-start` | Scaffold: backend, frontend, Postgres, compose, health |
| `01-dashboard` | Dashboard shell and pipeline visualisation |
| `02-requirements-agent` | Orchestration foundation + Rhea |
| `03-code-agent` | Nova + the diff viewer |
| `04-review-agent` | Sentinel + findings |
| `05-deploy-agent` | Atlas + gates + human approval |
| `06-complete-enterprise-copilot` | Full app (same as `main`) |