import React from 'react';
import { useSlideState } from './slide-navigation';
import { Button } from '@/components/ui/button';
import CodeSlide from './CodeSlide';
import { ProblemPage, AgenticPage, SpringPage, SpringFlowPage, OrchestrationPage, RequirementsPage, EnterpriseToolsPage, GatesPage, ApprovalPage, LiveDemoPage, MissingContextPage, AssignmentPage, HandsOnPage, SolutionPage, BeforeAfterPage, FinishPage } from './workshop-pages';
import aiSource from '../content/SpringAiAgentAiClient.java.txt?raw';
import WelcomePage from './Welcome';
import AgentDataFlowPage from './AgentDataFlow';
import { sourceRows } from './source-excerpts';

export const pages = [
    { id: 'welcome', title: 'Welcome', act: 'FLO 2026 / WELCOME', component: WelcomePage, notes: 'Leave this welcome screen running while participants join. Harsh Vishwakarma, Sr. Staff Engineer, and Dhruv Gupta, Principal Engineer. Advance when ready; the background dissolves with the existing scroll into the problem statement.' },
    { id: 'problem', title: 'Traditional → Agentic SDLC', act: '01 / THE STORY', component: ProblemPage, notes: 'Compare both paths. AI coding accelerates implementation; the agentic pipeline participates across requirements, implementation, review and release. Governance still controls release. Target: 3 minutes.' },
    { id: 'agentic-sdlc', title: 'Meet the four agents', act: '01 / THE STORY', component: AgenticPage, notes: 'Reveal Rhea — Understand, Nova — Build, Sentinel — Challenge, then Atlas — Release. Atlas is deterministic Java, not an additional model call. The orchestrator coordinates all four. Target: 2 minutes.' },
    { id: 'agent-data-flow', title: 'What makes this agentic?', act: '02 / THE SYSTEM', component: AgentDataFlowPage, notes: 'Reveal four principles: Context — enterprise policy, architecture and API contracts; Specialization — requirements, coding and review; Control — deterministic gates outside model authority; Accountability — humans authorize critical actions. The previous slide already explains the pipeline; focus here on the principles rather than repeating agents or execution stages. Agents advise. Systems enforce. Humans authorize. Keep PipelineOrchestrator and PipelineContext details for the later code walkthrough. Prev reverses reveals; re-entering returns to the title-only opening. Target: 3 minutes.' },
    { id: 'spring-ai', title: 'Spring AI', act: '02 / THE SYSTEM', component: SpringPage, notes: 'Explain only the Spring AI concepts used by this application. Do not make this a general AI lecture. Target: 1 minute.' },
    { id: 'spring-ai-flow', title: 'From prompt to Java', act: '02 / THE SYSTEM', component: SpringFlowPage, notes: 'ChatModel abstracts the provider; ChatClient is the interaction API. Prompts carry instructions/context, and entity maps the response to Java. Model output still needs validation. Target: 2 minutes.' },
    { id: 'requirements-code', title: 'Requirements analysis', act: '03 / THE CODE', component: RequirementsPage, notes: 'Introduce Rhea, the Requirements Agent. Show retrieval, additional context and typed analysis. Ambiguity should become clarification rather than invention. Target: 2 minutes.' },
    { id: 'enterprise-tools', title: 'Enterprise tools', act: '03 / THE CODE', component: EnterpriseToolsPage, notes: 'Policy, architecture and API contracts are provided tools. In this workshop document retrieval uses local fixtures. The model reasons over retrieved evidence. Target: 1 minute.' },
    { id: 'pipeline-orchestration', title: 'Pipeline orchestration', act: '03 / THE CODE', component: OrchestrationPage, notes: 'Walk through the four exact source windows. Explain the state transitions and the pause for feedback. The orchestrator owns sequencing. Target: 2 minutes.' },
    { id: 'code', title: 'Structured output', act: '03 / THE CODE', component: SourcePage, notes: 'Exact SpringAiAgentAiClient.java source. Prompt, Java output, then validation. Prev/Next and Left/Right step through highlights before changing slides. Target: 2 minutes.' },
    { id: 'review-gates', title: 'Deterministic gates', act: '03 / THE CODE', component: GatesPage, notes: 'Introduce Sentinel for review and Atlas for deterministic deployment gates. Proposed tests and their signal are simulated/model-provided; generated tests are not executed. Never describe a passing signal as real execution. Target: 1 minute.' },
    { id: 'human-approval', title: 'Human authorization', act: '03 / THE CODE', component: ApprovalPage, notes: 'The approval boundary accepts only a waiting pipeline and revalidates the release decision. Approval cannot bypass failed gates. Target: 1 minute.' },
    { id: 'live-demo', title: 'UB-4823 · Before Confluence', act: '03 / RUN IT', component: LiveDemoPage, notes: 'Open the app using the slide link. Use the supplied starter before the session so Confluence context is absent. Run UB-4823 BEFORE; show Rhea asking which notification channel is approved. Choose DEMO explicitly for a reproducible teaching outcome; LIVE can vary. Leave the question unanswered to motivate the exercise, then return here. Deployment remains simulated in both modes. Target: 6 minutes.' },
    { id: 'missing-context', title: 'Something is missing', act: '04 / YOUR TURN', component: MissingContextPage, notes: 'UB-4823 lacks the approved notification-channel decision. Rhea can reason but needs trusted business knowledge. Target: 1 minute.' },
    { id: 'assignment', title: 'The assignment', act: '04 / YOUR TURN', component: AssignmentPage, notes: 'The tool, document loader, Rhea overload, activity wrapper and constructor wiring are supplied. Participants create ConfluenceAgent and pass its context to Rhea. ConfluenceTool reads a local workshop Markdown page, not a live Confluence service. Target: 1 minute.' },
    { id: 'hands-on', title: 'Hands-on exercise', act: '04 / YOUR TURN', component: HandsOnPage, notes: 'Start the five-minute timer manually when participants are ready. Pause/resume as needed; re-entering the slide restarts the timer. If participants are stuck after about four minutes (one minute remaining), move to the solution slide and reveal the reference; do not reveal automatically or change participant files. Allow two minutes of setup/recovery flex. Before the session use the supplied confluence-exercise.sh reset command; never reset participant work during the exercise. Target: 7 minutes including buffer.' },
    { id: 'solution', title: 'Solution reveal', act: '04 / THE EXTENSION', component: SolutionPage, notes: 'Reveal the complete reference agent, constructor wiring, then the context call inside run(...). Explain the highlighted additions using the surrounding source. The context agent has no additional model call. If needed, apply the reference with the supplied exercise script after preserving participant changes. Target: 3 minutes.' },
    { id: 'before-after', title: 'Before and after', act: '04 / THE EXTENSION', component: BeforeAfterPage, notes: 'Open Enterprise Copilot from the presenter notes and run UB-4823 AFTER. Approved SMS policy eliminates this business clarification. In DEMO the outcome is reproducible; live output can vary. The policy resolves this business clarification; it does not make failing governance checks pass. Target: 1 minute plus any unused demo buffer.' },
    { id: 'finish', title: 'Agents advise. Humans authorize.', act: '05 / THE TAKEAWAY', component: FinishPage, notes: 'Close with context, reasoning, deterministic control and accountability. The resource link goes to the official Spring AI reference. Presenter contact and repository QR remain omitted until a destination is supplied. Target: 1 minute.' },
];

const sourceLines = aiSource.split('\n');
const responseLine = sourceLines.findIndex(line => line.includes('T response;'));
const validationLine = sourceLines.findIndex(line => line.includes('validate(response);')) + 1;
const generateLine = sourceLines.findIndex(line => line.includes('public <T> T generate('));
const returnLine = sourceLines.findIndex(line => line.includes('return response;'));
const promptRows = sourceRows(aiSource, [[generateLine, responseLine + 3]]);
const validationRows = sourceRows(aiSource, [
    [generateLine, generateLine + 2],
    [responseLine + 2, responseLine + 3],
    [validationLine - 2, validationLine],
    [returnLine, returnLine + 2],
]);
const steps = [
    { label: '01  Prompt', highlight: [responseLine + 3], annotation: 'The rendered prompt carries instructions and enterprise context.' },
    { label: '02  Java object', highlight: [responseLine + 3], annotation: '.entity(responseType) maps the model response to a Java object.' },
    { label: '03  Validate', highlight: [validationLine, returnLine + 1], annotation: 'The application validates the result before returning it to an agent.' },
];

function SourcePage() {
    const [step, setStep] = useSlideState(0, steps.length - 1);
    return <div className="technical-page code-page">
        <p className="eyebrow">INSIDE THE IMPLEMENTATION / SPRING AI</p>
        <h2>A prompt in.<br className="small-only" /> <span>A Java object out.</span></h2>
        <div className="code-step-tabs" role="group" aria-label="Code walkthrough">
            {steps.map((item, i) => <Button key={item.label} variant={i === step ? 'secondary' : 'ghost'} aria-pressed={i === step} onClick={() => setStep(i)}>{item.label}</Button>)}
        </div>
        <CodeSlide file="SpringAiAgentAiClient.java" rows={step < 2 ? promptRows : validationRows} highlight={steps[step].highlight} annotation={steps[step].annotation} />
        <p className="source-reference">EXACT SOURCE EXCERPT <span>generate(...) · error handling omitted at marked gaps.</span></p>
    </div>;
}
