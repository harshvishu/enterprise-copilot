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
        AG[agents/ Rhea Nova Sentinel Atlas]
        TOOLS[tools/ Compliance Architecture GitHistory ApiSpec]
        AI[infrastructure/ai AgentAiClient]
        GH[github/ Mock gateway]
        PERSIST[persistence/ JPA + Flyway]
        SEC[infrastructure/security Redactor]
    end

    DB[(H2 / PostgreSQL)]
    LLM[Ollama / Azure OpenAI]

    UI -->|REST + SSE| API --> ORCH --> AG
    AG --> TOOLS
    AG --> AI --> LLM
    ORCH --> GH
    ORCH --> PERSIST --> DB
    ORCH --> SEC
```

## 2. Agent flow

```mermaid
flowchart LR

    T[Ticket UB-4821] --> R[🔍 Rhea]

    R -->|needs clarification| PAUSE[Pause for human]
    R -->|ready| N[💻 Nova]

    N --> S[🛡️ Sentinel]

    S -->|APPROVE| A[🚀 Atlas]
    S -->|REJECT / REQUEST_CHANGES| BLOCK[Blocked]

    A -->|gates pass| WAIT[Wait for human approval]
    A -->|gate fails| BLOCK

    WAIT -->|human approves| DEPLOY[Deployed]
    WAIT -->|human rejects| BLOCK
```

## 3. Pipeline state machine

```mermaid
stateDiagram-v2

    [*] --> CREATED

    CREATED --> ANALYZING_REQUIREMENTS

    ANALYZING_REQUIREMENTS --> REQUIREMENTS_READY

    REQUIREMENTS_READY --> GENERATING_CODE: ready
    REQUIREMENTS_READY --> [*]]: needs clarification (pause)

    GENERATING_CODE --> CODE_READY

    CODE_READY --> REVIEWING

    REVIEWING --> REVIEW_PASSED
    REVIEWING --> REVIEW_FAILED

    REVIEW_PASSED --> WAITING_FOR_APPROVAL
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

    O-->>U: state = WAITING_FOR_APPROVAL (via SSE)

    H->>API: POST /{id}/approve
    API->>O: approve()

    O->>A: evaluate()
    A-->>O: allowed

    O-->>U: DEPLOYED (via SSE)
```

## 5. Human approval flow

```mermaid
flowchart TD

    G{All gates pass?}
    G -->|no| B[BLOCKED - Atlas explains why]
    G -->|yes| Q[WAITING_FOR_APPROVAL]

    Q --> D{Human decision}

    D -->|Approve| DEP[Deploy to production]
    D -->|Reject| B

    note1[AI can recommend but never approve\]:::n -.-> D

    classDef n fill:#1b2436,stroke:#f2b544,color:#f2b544
```

## Persistence

`pipelines` stores the snapshot (structured agent outputs as JSON text columns for rtability across
H2 and PostgreSQL). `audit_events` is an append-only,
redacted trail. Flyway owns the schema
(`V1__init.sql`); Hibernate is `validate`-only.