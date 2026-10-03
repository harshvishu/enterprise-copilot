# Architecture

Enterprise Copilot is a **modular monolith** (Spring Boot)
plus a React dashboard. One process, clear
package boundaries, no premature microservices.

## 1. System architecture

```mermaid
graph TD

    subgraph Frontend
        UI[React + Vite + Tailwind]
    end

    subgraph Backend[Spring Boot 4.1 modular monolith]
        API[api/ controllers]
        ORCH[orchestration/ PipelineOrchestrator]
        AG[agents/ Rhea Nova Sentinel]
        ATLAS[Atlas / deterministic Java gates]
        TOOLS[tools/ Compliance Architecture GitHistory ApiSpec]
        AI[infrastructure/ai AgentAiClient]
        GH[github/ Mock gateway]
        PERSIST[persistence/ JPA + Flyway]
        SEC[infrastructure/security Redactor]
    end

    DB[(H2 / PostgreSQL)]
    LLM[OpenAI default / Ollama alternative]

    UI -->|REST + SSE| API --> ORCH --> AG
    AG --> TOOLS
    AG --> AI --> LLM
    ORCH --> ATLAS
    API --> GH
    GH --> PERSIST
    ORCH --> PERSIST --> DB
    ORCH --> AUDIT[AuditService] --> SEC
    AUDIT --> PERSIST
```

## 2. Agent flow

```mermaid
flowchart LR

    T[Ticket UB-4821] --> R[🔍 Rhea]

    R -->|needs clarification| PAUSE[Pause for human]
    R -->|ready| N[💻 Nova]

    N --> S[🛡️ Sentinel]

    S -->|APPROVE| A[🚀 Atlas]
    S -->|REJECT / REQUEST_CHANGES| A

    A -->|gates pass| WAIT[Wait for human approval]
    A -->|gate fails| BLOCK

    WAIT -->|human approves and gates rechecked| DEPLOY[Simulated deployment]
    WAIT -->|human rejects| BLOCK
```

## 3. Pipeline state machine

```mermaid
stateDiagram-v2

    [*] --> CREATED

    CREATED --> ANALYZING_REQUIREMENTS

    ANALYZING_REQUIREMENTS --> REQUIREMENTS_READY

    REQUIREMENTS_READY --> GENERATING_CODE: ready
    REQUIREMENTS_READY --> REQUIREMENTS_READY: awaiting human answers
    REQUIREMENTS_READY --> GENERATING_CODE: answers saved and questions cleared

    GENERATING_CODE --> CODE_READY

    CODE_READY --> REVIEWING

    REVIEWING --> REVIEW_PASSED
    REVIEWING --> REVIEW_FAILED

    REVIEW_PASSED --> WAITING_FOR_APPROVAL
    REVIEW_PASSED --> BLOCKED: missing artifacts or failing test signal
    REVIEW_FAILED --> BLOCKED

    WAITING_FOR_APPROVAL --> DEPLOYING: human approves
    WAITING_FOR_APPROVAL --> BLOCKED: human rejects

    DEPLOYING --> DEPLOYED

    BLOCKED --> [*]
    DEPLOYED --> [*]
```

## 4. Sequence (happy path)

```mermaid
sequenceDiagram

    participant U as User
    participant API
    participant O as Orchestrator
    participant R as Rhea
    participant N as Nova
    participant S as Sentinel
    participant A as Atlas
    participant H as Human

    U->>API: POST /api/demo/run

    API->>O: createAndRun(ticket)

    O->>R: analyze()
    R-->>O: RequirementAnalysis (ready)

    O->>N: generate()
    N-->>O: CodeChangeSet (diff)

    O->>S: review()
    S-->>O: ReviewDecision (APPROVE)

    O->>A: evaluate()
    A-->>O: blocked - approval required

    O-->>U: APPROVAL_REQUIRED activity event; UI fetches state

    H->>API: POST /{id}/approve
    API->>O: approve()

    O->>A: evaluate()
    A-->>O: allowed

    O-->>U: completion events; UI fetches DEPLOYED snapshot
```

## 5. Human approval flow

```mermaid
flowchart TD

    G{All gates pass?}
    G -->|no| B[BLOCKED - Atlas explains why]
    G -->|yes| Q[WAITING_FOR_APPROVAL]

    Q --> D{Human decision}

    D -->|Approve and recheck gates| DEP[Simulated production deployment]
    D -->|Reject| B

    note1[Model has no approval capability]:::n -.-> D

    classDef n fill:#1b2436,stroke:#f2b544,color:#f2b544
```

## Persistence

`pipelines` stores the snapshot (structured agent outputs as JSON text columns for portability across
H2 and PostgreSQL). `audit_events` is an append-only,
redacted trail. Flyway owns the schema
(`V1__init.sql`); Hibernate is `validate`-only.

OpenAI is the default LIVE profile; Ollama and DEMO are explicit alternatives without failover.
DEMO supplies scripted results to the same first three agents and preserves all seven scenarios.
LIVE uses the ordinary ticket and actual model output, not deterministic scenario guarantees.
Human answers are saved into the analysis summary before async continuation. No chat memory is used.
SSE history is in-memory; state transitions overwrite snapshots rather than emitting a state-change event.
GitHub is a read-side projection requested by its controller; it is not an orchestrator side effect.
Approval endpoints are open local workshop controls, not authenticated human identity checks.