# Troubleshooting

| Symptom | Cause | Fix |
|----------|--------|-----|
| OpenAI startup configuration error | Missing/blank key or conflicting provider profiles | Supply OPENAI_API_KEY securely; select exactly one of openai, ollama, demo. Add postgres only with an AI profile. |
| LIVE pipeline FAILED | Provider/network/credentials or incomplete structured output | Read the provider/stage error, check the service, then start a new run. No DEMO output is substituted. |
| Need credential-free preview | OpenAI is default | Restart with SPRING_PROFILES_ACTIVE=demo and reload the dashboard. |
| Wrapper permission denied | Wrapper is not executable in this checkout | Use sh ./mvnw from backend/; no system Maven installation is required. |
| Frontend dependency error | Unsupported Node or stale dependencies | Use Node 22.12+ or a supported newer version, then run npm ci from frontend/. Use the checked-in manifest and lockfile together. |
| PostCSS says the Tailwind plugin moved to a separate package | Tailwind 4 installed against this application's Tailwind 3 configuration | Restore the checked-in manifest and lockfile, then run npm ci. Do not install @tailwindcss/postcss: the styles and configuration use Tailwind 3. |
| Invalid key: Expected never but received jsx | Possible Vite/React-plugin version mismatch | Run npm ci with the checked-in lockfile. If it persists, capture the full error and npm ls vite @vitejs/plugin-react tailwindcss --depth=0 output. |
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

## Frontend Dependency Recovery

Stop the frontend dev server, obtain the current checked-in manifest and lockfile, and run:

```bash
cd frontend
npm ci
npm run build
npm run dev
```

These commands work in PowerShell and macOS/Linux shells. `npm ci` replaces stale installed dependencies
with the locked versions. The frontend build toolchain is pinned to Tailwind 3.4.19, Vite 7.3.6 and
React plugin 4.7.0; installing the latest versions individually can introduce incompatible major versions.