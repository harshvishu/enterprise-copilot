# Troubleshooting

| Symptom | Cause | Fix |
|----------|--------|-----|
| OpenAI startup configuration error | Missing/blank key or conflicting provider profiles | Supply OPENAI_API_KEY securely; select exactly one of openai, ollama, demo. Add postgres only with an AI profile. |
| LIVE pipeline FAILED | Provider/network/credentials or incomplete structured output | Read the provider/stage error, check the service, then start a new run. No DEMO output is substituted. |
| Need credential-free preview | OpenAI is default | Restart with SPRING_PROFILES_ACTIVE=demo and reload the dashboard. |
| Wrapper permission denied | Wrapper is not executable in this checkout | Use sh ./mvnw from backend/; no system Maven installation is required. |
| Frontend dependency error | Unsupported Node or stale dependencies | Use Node 22.12+ or a supported newer version, then npm install. Vite 7 matches the existing React plugin. |
| Backend won't start: `missing table` | Flyway didn't run | Ensure `spring-boot-flyway` is on the classpath (Boot 4 modular autoconfig) |
| `No qualifying bean ... ObjectMapper` | Boot 4 autoconfigures Jackson 3 | A Jackson 2 `ObjectMapper` bean is provided in `JacksonConfig` |
| Schema validation: `wrong column type ... CLOB` | `@Lob` on a String | Use `columnDefinition = "text"` without `@Lob` |
| Dashboard shows no activity | SSE not connected | Re-click **Run Pipeline**; check the backend is on `:8080` and CORS allows `:5173` |
| Maven can't resolve artifacts behind a corporate proxy | Stale proxy in `~/.m2/settings.xml` | Use a settings file with the mirror but no broken proxy |
| LIVE (Ollama) errors | Ollama not running / model not pulled | `ollama pull llama3.1 && ollama serve` |
| Pipeline seems slow | Step pacing delay | Set `copilot.demo.step-delay-ms=0` (tests already do) |
| Clarification returns 400 | Missing, blank or wrong number of answers | Provide one nonblank answer for every question. |
| Approve/reject returns 409 | Pipeline is not WAITING_FOR_APPROVAL | Technical blocks cannot be approved; create a clean run instead. |

## Reset

Local modes use in-memory H2 unless postgres is selected; restart for a clean slate and reload the dashboard.
The PostgreSQL Compose volume retains snapshots. Provider switching is explicit, not automatic failover.