import React, { useState } from 'react';
import { ArrowDown, ArrowRight, Check, GitBranch, ShieldCheck, UserRound, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CodeSlide from './CodeSlide';
import { ProblemPage, DeliveryPage, AgenticPage, SpringPage, SpringFlowPage, OrchestrationPage, RequirementsPage, EnterpriseToolsPage, GatesPage, ApprovalPage, LiveDemoPage, MissingContextPage, AssignmentPage, HandsOnPage, SolutionPage, BeforeAfterPage, FinishPage } from './workshop-pages';
import aiSource from '../content/SpringAiAgentAiClient.java.txt?raw';
import WelcomePage from './Welcome';

export const pages = [
    { id: 'welcome', title: 'Welcome', act: 'FLO 2026 / WELCOME', component: WelcomePage, notes: 'Leave this welcome screen running while participants join. Harsh Vishwakarma, Sr. Staff Engineer, and Dhruv Gupta, Principal Engineer. Advance when ready; the background dissolves with the existing scroll into the workshop introduction.' },
    { id: 'intro', title: 'Introduction', act: '01 / THE STORY', component: HeroPage, notes: 'Introduce yourself and your co-presenter. Set the promise: build, run, then extend a multi-agent SDLC pipeline. Names remain omitted until supplied. Target: 2 minutes.' },
    { id: 'problem', title: 'Beyond code completion', act: '01 / THE STORY', component: ProblemPage, notes: 'AI helps write code; software delivery also involves requirements, review, policy and authorization. Target: 2 minutes.' },
    { id: 'delivery', title: 'Software delivery', act: '01 / THE STORY', component: DeliveryPage, notes: 'Use Reveal next to introduce each responsibility. Page keys always navigate pages. Target: 1 minute.' },
    { id: 'agentic-sdlc', title: 'Agentic SDLC', act: '01 / THE STORY', component: AgenticPage, notes: 'Introduce roles, without asking the audience to memorize internal names. Reveal one stage at a time. Target: 3 minutes.' },
    { id: 'spring-ai', title: 'Spring AI', act: '02 / THE SYSTEM', component: SpringPage, notes: 'Explain only the Spring AI concepts used by this application. Do not make this a general AI lecture. Target: 1 minute.' },
    { id: 'spring-ai-flow', title: 'From prompt to Java', act: '02 / THE SYSTEM', component: SpringFlowPage, notes: 'ChatModel abstracts the provider; ChatClient is the interaction API. Prompts carry instructions/context, and entity maps the response to Java. Model output still needs validation. Target: 2 minutes.' },
    { id: 'architecture', title: 'Architecture', act: '02 / THE SYSTEM', component: ArchitecturePage, notes: 'Read left to right. Enterprise context informs reasoning; deterministic checks gate delivery. In this workshop Atlas requires human approval after technical gates pass. Critical findings cannot be overridden. Deployment is simulated. Target: 5 minutes.' },
    { id: 'pipeline-orchestration', title: 'Pipeline orchestration', act: '03 / THE CODE', component: OrchestrationPage, notes: 'Walk through the four exact source windows. Explain the state transitions and the pause for feedback. The orchestrator owns sequencing. Target: 2 minutes.' },
    { id: 'requirements-code', title: 'Requirements analysis', act: '03 / THE CODE', component: RequirementsPage, notes: 'Introduce Rhea, the Requirements Agent. Show retrieval, additional context and typed analysis. Ambiguity should become clarification rather than invention. Target: 2 minutes.' },
    { id: 'code', title: 'Structured output', act: '03 / THE CODE', component: SourcePage, notes: 'Exact SpringAiAgentAiClient.java source. Prompt, Java output, then validation. Highlight controls are independent of page navigation. Target: 2 minutes.' },
    { id: 'enterprise-tools', title: 'Enterprise tools', act: '03 / THE CODE', component: EnterpriseToolsPage, notes: 'Policy, architecture and API contracts are provided tools. In this workshop document retrieval uses local fixtures. The model reasons over retrieved evidence. Target: 1 minute.' },
    { id: 'review-gates', title: 'Deterministic gates', act: '03 / THE CODE', component: GatesPage, notes: 'Introduce Sentinel for review and Atlas for deterministic deployment gates. Proposed tests and their signal are simulated/model-provided; generated tests are not executed. Never describe a passing signal as real execution. Target: 1 minute.' },
    { id: 'human-approval', title: 'Human authorization', act: '03 / THE CODE', component: ApprovalPage, notes: 'The approval boundary accepts only a waiting pipeline and revalidates the release decision. Approval cannot bypass failed gates. Target: 1 minute.' },
    { id: 'live-demo', title: 'Live demo', act: '03 / RUN IT', component: LiveDemoPage, notes: 'Open the app using the link below. OpenAI LIVE is primary; choose DEMO explicitly for reproducible teaching outcomes. Run a success case; UB-4822 DEMO demonstrates masked-reference feedback, revision and approval. Run UB-4823 BEFORE and show its SMS clarification. Deployment remains simulated in both modes. Return to this tab. Target: 6 minutes.' },
    { id: 'missing-context', title: 'Something is missing', act: '04 / YOUR TURN', component: MissingContextPage, notes: 'UB-4823 lacks the approved notification-channel decision. Rhea can reason but needs trusted business knowledge. Target: 1 minute.' },
    { id: 'assignment', title: 'The assignment', act: '04 / YOUR TURN', component: AssignmentPage, notes: 'The tool, document loader, Rhea overload, activity wrapper and constructor wiring are supplied. Participants create ConfluenceAgent and pass its context to Rhea. ConfluenceTool reads a local workshop Markdown page, not a live Confluence service. Target: 1 minute.' },
    { id: 'hands-on', title: 'Hands-on exercise', act: '04 / YOUR TURN', component: HandsOnPage, notes: 'Start the five-minute timer manually when participants are ready. Pause/reset as needed. Allow two minutes of setup/recovery flex. Before the session use the supplied confluence-exercise.sh reset command; never reset participant work during the exercise. Target: 7 minutes including buffer.' },
    { id: 'solution', title: 'Solution reveal', act: '04 / THE EXTENSION', component: SolutionPage, notes: 'Reveal the exact reference agent first, then the supplied integration snippet. Explain constructor injection using workshop-guide.md. The context agent has no additional model call. If needed, apply the reference with the supplied exercise script after preserving participant changes. Target: 3 minutes.' },
    { id: 'before-after', title: 'Before and after', act: '04 / THE EXTENSION', component: BeforeAfterPage, notes: 'Open the app below and run UB-4823 AFTER. Approved SMS policy eliminates this business clarification. In DEMO the outcome is reproducible; live output can vary. UB-4825 is a negative control: the policy still does not supply the missing fraud contract. Target: 1 minute plus any unused demo buffer.' },
    { id: 'finish', title: 'Agents advise. Humans authorize.', act: '05 / THE TAKEAWAY', component: FinishPage, notes: 'Close with context, reasoning, deterministic control and accountability. The resource link goes to the official Spring AI reference. Presenter contact and repository QR remain omitted until a destination is supplied. Target: 1 minute.' },
];

function HeroPage() {
    return <div className="hero-layout">
        <div className="hero-copy">
            <p className="eyebrow"><span className="signal-dot" /> A HANDS-ON SPRING AI WORKSHOP</p>
            <h1>Your sprint<br />has <span>agents</span> now<span className="hero-period">.</span></h1>
            <p className="hero-subtitle">Building a Multi-Agent SDLC Pipeline<br />with Spring AI</p>
            <div className="hero-details"><span>45 MINUTES</span><span className="detail-divider" /><span>BUILD. RUN. EXTEND.</span></div>
        </div>
        <div className="hero-flow" aria-label="Requirements to code to review to release, with human authorization">
            <div className="flow-heading"><Workflow size={16} /> DELIVERY, CONNECTED</div>
            {['Requirements', 'Code', 'Review', 'Release'].map((label, i) => <React.Fragment key={label}><div className={`hero-node node-${i}`}><span className="node-index">0{i + 1}</span><span>{label}</span><span className="node-port" /></div>{i < 3 && <div className="hero-connector"><ArrowDown size={16} /></div>}</React.Fragment>)}
            <div className="human-caption"><UserRound size={16} /> Human authorization</div>
        </div>
        <div className="hero-bottom"><span>FROM CODE COMPLETION TO SOFTWARE DELIVERY</span><ArrowDown size={18} /></div>
    </div>;
}

function ArchitecturePage() {
    const roles = ['Requirements', 'Coding', 'Review', 'Deployment'];
    return <div className="technical-page">
        <p className="eyebrow">THE SYSTEM / ENTERPRISE COPILOT</p>
        <h2>Reasoning meets <span>control.</span></h2>
        <p className="page-lead">Agents move the work forward. The system owns the boundaries.</p>
        <div className="architecture-diagram">
            <div className="enterprise-context"><span className="diagram-label">ENTERPRISE CONTEXT</span><div><span>Compliance policy</span><span>API contracts</span><span>Architecture</span></div></div>
            <div className="context-connection"><ArrowDown size={20} /></div>
            <div className="agent-row"><div className="issue-node"><GitBranch size={20} /><span>Issue</span></div><ArrowRight className="agent-arrow" />{roles.map((role, i) => <React.Fragment key={role}><div className="agent-node"><span className="diagram-label">0{i + 1}</span><strong>{role}</strong><span>Agent</span></div>{i < 3 && <ArrowRight className="agent-arrow" />}</React.Fragment>)}</div>
            <div className="gate-flow"><ArrowDown className="gate-connector" size={22} /><div className="gate-node"><ShieldCheck size={25} /><div><strong>Deterministic gates</strong><span>Tests · findings · release policy</span></div></div><ArrowRight className="gate-arrow" /><div className="approval-node"><UserRound size={24} /><div><strong>Human approval</strong><span>When policy requires it</span></div></div><ArrowRight className="gate-arrow" /><div className="production-node"><Check size={19} />Release</div></div>
        </div>
        <div className="architecture-footnote"><span className="signal-dot" />Critical findings block release. Human approval cannot override them.</div>
    </div>;
}

const sourceLines = aiSource.split('\n');
const responseLine = sourceLines.findIndex(line => line.includes('T response;'));
const validationLine = sourceLines.findIndex(line => line.includes('validate(response);')) + 1;
const steps = [
    { label: '01  Prompt', highlight: [responseLine + 3], annotation: 'The rendered prompt carries instructions and enterprise context.' },
    { label: '02  Java object', highlight: [responseLine + 3], annotation: '.entity(responseType) maps the model response to a Java object.' },
    { label: '03  Validate', highlight: [validationLine], annotation: 'The application validates the result before returning it to an agent.' },
];

function SourcePage() {
    const [step, setStep] = useState(0);
    // Two verbatim source windows. Ellipsis explicitly marks omitted error handling.
    // Preserve real source line numbers by rendering each window separately.
    return <div className="technical-page code-page">
        <p className="eyebrow">INSIDE THE IMPLEMENTATION / SPRING AI</p>
        <h2>A prompt in.<br className="small-only" /> <span>A Java object out.</span></h2>
        <div className="code-step-tabs" role="group" aria-label="Code walkthrough">
            {steps.map((item, i) => <Button key={item.label} variant={i === step ? 'secondary' : 'ghost'} aria-pressed={i === step} onClick={() => setStep(i)}>{item.label}</Button>)}
        </div>
        <CodeSlide file="SpringAiAgentAiClient.java" startLine={responseLine + 1} lines={sourceLines.slice(responseLine, responseLine + 3)} highlight={step < 2 ? steps[step].highlight : []} annotation={step < 2 ? steps[step].annotation : undefined} />
        <div className="omitted-code">··· provider error handling omitted ···</div>
        <CodeSlide file="SpringAiAgentAiClient.java · validation" startLine={validationLine - 1} lines={sourceLines.slice(validationLine - 2, validationLine + 1)} highlight={step === 2 ? steps[step].highlight : []} annotation={step === 2 ? steps[step].annotation : undefined} />
        <p className="source-reference">EXACT SOURCE EXCERPTS <span>backend / infrastructure / ai</span></p>
    </div>;
}
