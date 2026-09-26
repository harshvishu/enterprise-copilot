# Troubleshooting

| Symptom | Cause | Fix |
|----------|--------|-----|
| Backend won't start: `missing table` | Flyway didn't run | Ensure `spring-boot-flyway` is on the classpath (Boot 4 modular autoconfig) |
| `No qualifying bean ... ObjectMapper` | Boot 4 autoconfigures Jackson 3 | A Jackson 2 `ObjectMapper` bean is provided in `JacksonConfig` |
| Schema validation: `wrong column type ... CLOB` | `@Lob` on a String | Use `columnDefinition = "text"` without `@Lob` |
| Dashboard shows no activity | SSE not connected | Re-click **Run Pipeline**; check the backend is on `:8080` and CORS allows `:5173` |
| Maven can't resolve artifacts behind a corporate proxy | Stale proxy in `~/.m2/settings.xml` | Use a settings file with the mirror but no broken proxy |
| LIVE (Ollama) errors | Ollama not running / model not pulled | `ollama pull llama3.1 && ollama serve` |
| Pipeline seems slow | Step pacing delay | Set `copilot.demo.step-delay-ms=0` (tests already do) |

## Reset

DEMO mode uses in-memory H2 - restart the backend for a clean slate.