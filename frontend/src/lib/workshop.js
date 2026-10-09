// Educational annotations of real SSE events, verified against backend/src/main/java.
// These describe application boundaries, never private model reasoning.
const AGENTS = {
    Rhea: ['RequirementsAgent', 'analyze', 'RequirementAnalysis', 'Clarifies requirements and surfaces ambiguity before implementation.'],
    Nova: ['CodeGenerationAgent', 'generate', 'CodeChangeSet', 'Proposes file changes and tests for review; it never applies the diff to disk.'],
    Sentinel: ['ReviewAgent', 'review', 'ReviewDecision', 'Challenges the proposal for security, compliance, quality and architecture.'],
};
const TOOLS = {
    compliance: ['ComplianceTool', 'demo-data/compliance-policy.md', 'Grounds the assessment in local compliance and POPIA guidance.'],
    architecture: ['ArchitectureTool', 'demo-data/architecture-guidelines.md', 'Supplies approved patterns instead of relying on model memory.'],
    'git-history': ['GitHistoryTool', 'demo-data/git-history.json', 'Carries prior engineering decisions into the requirement analysis.'],
    'api-spec': ['ApiSpecificationTool', 'demo-data/notification-api.yaml', 'Supplies the published contract so unsupported APIs can be challenged.'],
    confluence: ['ConfluenceTool', 'demo-data/confluence.md', 'Provides business policy for Rhea to assess when the participant ConfluenceAgent is wired in.'],
};
const GATES = {
    REQUIREMENTS_RESOLVED: ['Requirements resolved', 'Checks that RequirementAnalysis exists and needsClarification() is false. Ambiguity must be resolved by a human.'],
    CODE_PROPOSAL_PRESENT: ['Proposal present', 'Checks that CodeChangeSet has files and a nonblank unifiedDiff. This verifies proposal artifacts, not compilation.'],
    REVIEW_APPROVED: ['Review approved', 'Checks ReviewDecision.passed(). An unapproved review prevents release authorization.'],
    NO_CRITICAL_FINDINGS: ['No critical findings', 'Checks ReviewDecision.hasCriticalFindings(). Human approval cannot override unresolved critical findings.'],
    TESTS_PASS: ['Proposed test signal', 'Checks CodeChangeSet.hasPassingTestSignal(): nonblank proposed tests plus testsPass. This is a simulated/model-provided signal; generated tests are not executed.'],
    HUMAN_APPROVAL: ['Human approval', 'Checks ApprovalState.APPROVED only after the technical gates pass. The pipeline waits for an explicit human decision.'],
};
const annotation = (title, component, what, why, springAi) => ({ title, component, what, why, springAi });

export function explainEvent(event, mode, fallback = false) {
    const { type, agent, data = {} } = event;
    const config = AGENTS[agent];
    if (type === 'PIPELINE_STARTED') return annotation('Create and coordinate the run',
        'PipelineOrchestrator · PipelineContext · PipelineStore',
        'Creates a typed PipelineContext, saves the ticket, scenario and AI mode, then invokes run through the @Async proxy.',
        'The orchestrator stores each typed agent result and persists transitions; the same context carries requirements, proposal, review and approval through the pipeline.');
    if (type === 'AI_FALLBACK') return annotation('Provider fallback recorded', 'RoutingAgentAiClient.generateForRun',
        'The LIVE provider failed; the configured fallback switches the rest of this run to deterministic DEMO output.',
        'The event and audit trail disclose the change. Subsequent scripted results are not live model responses.');
    if (type === 'AGENT_STARTED' && config) return annotation(`${agent} begins`, `${config[0]}.${config[1]} · PipelineContext`,
        config[3], 'Each agent reads the preceding typed evidence from PipelineContext and returns its own result.');
    if (agent === 'Confluence' && type === 'AGENT_STARTED') return annotation('Gather business context',
        'PipelineOrchestrator.withConfluenceActivity · ConfluenceAgent.gatherContext (workshop integration)',
        'The optional participant integration begins gathering business context before Rhea.',
        'This explanation appears only when the integration emits real Confluence activity; the baseline does not run ConfluenceAgent.');
    if (type === 'TOOL_INVOKED' && TOOLS[data.tool]) {
        const [component, resource, why] = TOOLS[data.tool];
        return annotation('Collect enterprise references', `${component}.lookup · ToolResources.read`,
            `The application announces a direct Java lookup of ${resource}.`, why,
            'Application-managed context retrieval: local resource text is passed into prompts. No vector search or model-selected Spring AI tool callback is invoked here.');
    }
    if (type === 'AGENT_THINKING' && data.step === 'MODEL_CALL' && config) {
        const demo = mode === 'DEMO' || fallback;
        return annotation(`Request ${config[2]}`, `${config[0]} · PromptLibrary · RoutingAgentAiClient`,
            demo ? `The agent prepares its prompt and requests a typed ${config[2]} from DemoAgentAiClient.`
                : `The agent prepares its prompt and requests a typed ${config[2]} from SpringAiAgentAiClient.`,
            'This event announces the request boundary; it does not expose model reasoning or prove the request succeeded.',
            'ChatClient API: ChatClient.builder(ChatModel).defaultSystem(…) configures the client; prompt().user(renderedPrompt).call().entity(responseType) requests a structured Java response. SpringAiAgentAiClient.validate checks completeness.');
    }
    if (type === 'AGENT_COMPLETED' && config) return annotation(`${config[2]} returned`, `${config[0]} · PipelineOrchestrator · PipelineContext`,
        `The agent returned ${config[2]}; the orchestrator attaches it to PipelineContext before the next stage.`,
        agent === 'Nova' ? 'Files, diff and tests remain proposals. testsPass is a simulated/model-provided signal, not evidence of compiling or executing generated tests.'
            : agent === 'Rhea' ? 'Clarification questions stop the pipeline before Nova; a clear analysis permits implementation.'
                : 'Review outcome and findings determine whether feedback or deterministic release checks come next.');
    if (agent === 'Confluence' && type === 'AGENT_COMPLETED') return annotation('Business context returned',
        'PipelineOrchestrator.withConfluenceActivity · RequirementsAgent.analyze',
        'The optional context call returned. Rhea receives the additional context through the workshop integration.',
        'Rhea assesses policy applicability; retrieved text does not automatically resolve every ambiguity.');
    if (agent === 'Atlas' && type === 'AGENT_STARTED') return annotation('Evaluate release gates', 'DeployAgent.evaluate · DeployAgent.decide',
        'Atlas checks requirements, proposal artifacts, review, critical findings, the proposed test signal and human approval.',
        'These are deterministic Java conditions. There is no LLM or Spring AI call in Atlas.');
    if (agent === 'Atlas' && type === 'AGENT_COMPLETED') return annotation('Release authorization returned', 'DeployAgent.decide · DeploymentDecision',
        'All deterministic gates and human approval passed; Atlas returns an allowed DeploymentDecision.',
        'The orchestrator may now enter its simulated deployment lifecycle. This event does not mean artifacts were deployed.');
    if (type === 'GATE_EVALUATED' && GATES[data.gate]) return annotation(...[
        GATES[data.gate][0], 'DeployAgent.decide · DeployAgent.gate', GATES[data.gate][1],
        data.waiting ? 'This gate is waiting for a human; waiting is not a passing result.'
            : data.passed ? 'This condition passed; every remaining gate must also pass.' : 'This condition failed. Approval cannot bypass a technical block.',
    ]);
    if (type === 'APPROVAL_REQUIRED') return annotation('Wait for a human decision', 'DeployAgent.decide · PipelineOrchestrator.runImplementationStages',
        'Technical gates passed; PipelineContext enters WAITING_FOR_APPROVAL with approval pending.',
        'Only the human approve or reject API resumes this boundary. Presentation playback cannot grant approval.');
    if (type === 'APPROVAL_GRANTED') return annotation('Record human approval', 'PipelineOrchestrator.approve · AuditService',
        'The human approval endpoint records ApprovalState.APPROVED and the approver in the audit trail.',
        'DeployAgent.revalidate checks the gates again before the simulated deployment transition.');
    if (type === 'APPROVAL_REJECTED') return annotation('Record human rejection', 'PipelineOrchestrator.reject · AuditService',
        'The human rejection endpoint records ApprovalState.REJECTED and moves the run to BLOCKED.',
        'Rejection stops deployment; playback retains the decision in the history.');
    if (agent === 'Human' && type === 'AGENT_COMPLETED') return annotation('Resume with human input',
        'PipelineOrchestrator.clarify / reviewFeedback · AuditService',
        event.message,
        'Clarification answers become requirement evidence; review feedback clears previous proposal/review decisions so Nova and Sentinel run again. These are human-only API paths.');
    if (type === 'GATE_BLOCKED') return annotation('Pause or block execution',
        agent === 'Atlas' ? 'DeployAgent.decide' : 'PipelineOrchestrator.run / runImplementationStages',
        event.message, agent === 'Rhea' ? 'Human clarification must answer the outstanding questions before implementation.'
            : agent === 'Sentinel' ? 'Human feedback is required before Nova revises the proposal and Sentinel reviews again.'
                : 'Deterministic gate failures prevent authorization. Human approval cannot override them.');
    if (type === 'DEPLOYMENT_STARTED' || type === 'DEPLOYMENT_COMPLETED') return annotation('Simulated deployment', 'PipelineOrchestrator.deploy',
        'The application records DEPLOYING / DEPLOYED state and publishes deployment activity.',
        'This method simulates deployment in DEMO and LIVE. It does not compile, run generated tests or deploy artifacts to production.');
    if (type === 'PIPELINE_COMPLETED') return annotation('Run completed', 'PipelineOrchestrator.deploy · AuditService',
        'The pipeline completed its simulated deployment after gate authorization and human approval.',
        'The audit trail records the application lifecycle; it is not evidence of a production deployment.');
    if (type === 'PIPELINE_FAILED') return annotation('Execution stopped', 'PipelineOrchestrator.runImplementationStages / failPipeline',
        event.message, 'The run is blocked or failed. No success or deployment is inferred from presentation playback.');
    if (type === 'FINDING_CREATED') return annotation('Record review finding', 'ReviewAgent.review · ReviewFinding',
        'Sentinel publishes a finding from the returned ReviewDecision.',
        'Its severity and category provide review evidence; these are model/scripted assessments rather than test execution.');
    if (agent === 'Atlas' && data.step === 'REVALIDATE') return annotation('Recheck after approval', 'DeployAgent.revalidate · DeployAgent.decide',
        'Runs the same deterministic conditions after human approval, without repeating the individual gate events.',
        'Approval alone cannot make a failing technical gate pass.');
    if (type === 'AGENT_THINKING' && config) return annotation('Prepare stage evidence', `${config[0]}.${config[1]}`,
        event.message, 'This is application activity, not a transcript of private model reasoning.');
    return null;
}

// One paced reference-collection boundary per agent attempt; individual tool/gate
// events remain visible inside that boundary instead of adding a delay per log line.
export function workshopEntries(events, mode) {
    let fallback = false;
    const tools = new Set();
    let gatesStarted = false;
    let step = 0;
    return events.map((event) => {
        if (event.type === 'AI_FALLBACK') fallback = true;
        if (event.type === 'AGENT_STARTED') {
            tools.delete(event.agent);
            if (event.agent === 'Atlas') gatesStarted = false;
        }
        const firstTool = event.type === 'TOOL_INVOKED' && !tools.has(event.agent);
        if (event.type === 'TOOL_INVOKED') tools.add(event.agent);
        const firstGate = event.type === 'GATE_EVALUATED' && !gatesStarted;
        if (event.type === 'GATE_EVALUATED') gatesStarted = true;
        const explanation = explainEvent(event, mode, fallback);
        const meaningful = Boolean(explanation) && (firstTool || firstGate ||
            ['PIPELINE_STARTED', 'AGENT_STARTED', 'APPROVAL_REQUIRED', 'GATE_BLOCKED',
                'APPROVAL_GRANTED', 'APPROVAL_REJECTED', 'AI_FALLBACK', 'DEPLOYMENT_STARTED', 'PIPELINE_COMPLETED'].includes(event.type) ||
            (event.type === 'AGENT_THINKING' && event.data?.step === 'MODEL_CALL') ||
            (event.type === 'AGENT_COMPLETED' && event.agent !== 'Atlas'));
        if (meaningful) step++;
        return { event, explanation, meaningful, step };
    });
}

export function presentationBatch(entries, cursor) {
    let end = cursor + 1;
    while (end < entries.length && !entries[end].meaningful) end++;
    return Math.min(end, entries.length);
}

export function presentationDelay(value) {
    const seconds = Number(value);
    if (seconds === 0) return 0;
    return Number.isFinite(seconds) ? Math.min(10, Math.max(3, seconds)) * 1000 : 3500;
}

// Route every received event into an existing output section, retaining global order.
export function presentationSections(entries) {
    let section = 'Rhea';
    return entries.map((entry, index) => {
        const { event } = entry;
        if (['Rhea', 'Nova', 'Sentinel', 'Atlas'].includes(event.agent)) section = event.agent;
        if (['APPROVAL_GRANTED', 'APPROVAL_REJECTED', 'PIPELINE_COMPLETED'].includes(event.type)) section = 'Atlas';
        // Human clarification stays with Rhea; review feedback begins Nova's revision.
        if (event.agent === 'Human' && event.type === 'AGENT_COMPLETED' && section === 'Sentinel') section = 'Nova';
        return { ...entry, index, section };
    });
}

// A display projection only. Actions always use the original server PipelineContext.
export function presentationPipeline(pipeline, events, count) {
    if (!pipeline) return pipeline;
    const shown = events.slice(0, count);
    const result = { ...pipeline, state: 'CREATED', approvalState: 'NOT_REQUESTED', deploymentDecision: null };
    for (const [agent, field] of [['Rhea', 'requirementAnalysis'], ['Nova', 'codeChangeSet'], ['Sentinel', 'reviewDecision']]) {
        const start = events.findLastIndex((event) => event.agent === agent && event.type === 'AGENT_STARTED');
        const completed = events.findLastIndex((event) => event.agent === agent && event.type === 'AGENT_COMPLETED');
        // Never associate a newer revision's artifact with an older completion event.
        result[field] = completed > start && completed < count ? pipeline[field] : null;
    }
    for (const event of shown) {
        if (event.type === 'PIPELINE_STARTED') result.state = 'ANALYZING_REQUIREMENTS';
        if (event.type === 'AGENT_STARTED') {
            result.state = { Rhea: 'ANALYZING_REQUIREMENTS', Nova: 'GENERATING_CODE', Sentinel: 'REVIEWING', Atlas: 'REVIEW_PASSED' }[event.agent] || result.state;
        }
        if (event.type === 'AGENT_COMPLETED') {
            if (event.agent === 'Rhea') result.state = 'REQUIREMENTS_READY';
            if (event.agent === 'Nova') result.state = 'CODE_READY';
            if (event.agent === 'Sentinel') result.state = event.data?.outcome === 'APPROVE' ? 'REVIEW_PASSED' : 'REVIEW_FAILED';
        }
        if (event.type === 'GATE_BLOCKED') {
            result.state = event.agent === 'Rhea' ? 'REQUIREMENTS_READY'
                : event.agent === 'Sentinel' ? 'WAITING_FOR_REVIEW_FEEDBACK' : 'BLOCKED';
        }
        if (event.type === 'APPROVAL_REQUIRED') { result.state = 'WAITING_FOR_APPROVAL'; result.approvalState = 'PENDING'; }
        if (event.type === 'APPROVAL_GRANTED') result.approvalState = 'APPROVED';
        if (event.type === 'APPROVAL_REJECTED') { result.state = 'BLOCKED'; result.approvalState = 'REJECTED'; }
        if (event.type === 'DEPLOYMENT_STARTED') result.state = 'DEPLOYING';
        if (event.type === 'DEPLOYMENT_COMPLETED' || event.type === 'PIPELINE_COMPLETED') result.state = 'DEPLOYED';
        if (event.type === 'PIPELINE_FAILED') result.state = pipeline.state === 'BLOCKED' ? 'BLOCKED' : 'FAILED';
    }
    const decision = events.findLastIndex((event) => event.agent === 'Atlas' &&
        ['APPROVAL_REQUIRED', 'GATE_BLOCKED', 'AGENT_COMPLETED'].includes(event.type));
    if (decision >= 0 && decision < count) result.deploymentDecision = pipeline.deploymentDecision;
    return result;
}
