import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, CircleHelp, Pause, Play, RotateCcw, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CodeSlide from './CodeSlide';
import orchestrator from '../content/PipelineOrchestrator.java.txt?raw';
import requirements from '../content/RequirementsAgent.java.txt?raw';
import deployment from '../content/DeployAgent.java.txt?raw';
import confluence from '../content/ConfluenceAgent.java.txt?raw';
import workshopGuide from '../content/workshop-guide.md?raw';

function Frame({ eyebrow, title, lead, children, className = '' }) {
    return <div className={`technical-page workshop-page ${className}`}><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{lead && <p className="page-lead">{lead}</p>}{children}</div>;
}

export function ProblemPage() {
    return <div className="statement-page"><p className="eyebrow">BEYOND CODE COMPLETION</p><h2>AI can write code.<br /><span>But software delivery<br />is more than writing code.</span></h2></div>;
}

function Flow({ labels, visible = labels.length, vertical = false }) {
    return <ol className={`workshop-flow ${vertical ? 'vertical-flow' : ''}`} aria-label="Workflow">{labels.map((label, i) => <li key={label} className={i >= visible ? 'unrevealed' : ''} aria-hidden={i >= visible}><div><span className="diagram-label">{String(i + 1).padStart(2, '0')}</span><strong>{label}</strong></div>{i < labels.length - 1 && <ArrowRight aria-hidden="true" />}</li>)}</ol>;
}

function RevealFlow({ eyebrow, title, labels, lead }) {
    const [visible, setVisible] = useState(1);
    return <Frame eyebrow={eyebrow} title={title} lead={lead}><Flow labels={labels} visible={visible} /><div className="reveal-controls"><Button variant="outline" disabled={visible === labels.length} onClick={() => setVisible(value => value + 1)}>Reveal next <ArrowRight size={15} /></Button><Button variant="ghost" onClick={() => setVisible(1)}>Reset</Button><span>{visible} / {labels.length}</span></div></Frame>;
}

export function DeliveryPage() {
    return <RevealFlow eyebrow="THE DELIVERY LIFECYCLE" title={<>More than <span>implementation.</span></>} labels={['Requirement', 'Implementation', 'Review', 'Release']} />;
}
export function AgenticPage() {
    return <RevealFlow eyebrow="WHAT WE ARE BUILDING" title={<>Your sprint has <span>agents now.</span></>} lead="One pipeline. Clear responsibilities. Human authorization." labels={['Requirements Agent', 'Coding Agent', 'Review Agent', 'Deployment Agent', 'Human authorization']} />;
}
export function SpringPage() {
    return <Frame eyebrow="THE FRAMEWORK" title={<>Spring AI<span>.</span></>} lead="The pieces we use in this application."><div className="spring-concepts">{[['ChatModel', 'Model abstraction'], ['ChatClient', 'Interaction API'], ['Prompt', 'Instructions + enterprise context'], ['.entity(…)', 'Structured Java output']].map(([name, explanation]) => <div key={name}><code>{name}</code><span>{explanation}</span></div>)}</div></Frame>;
}
export function SpringFlowPage() {
    return <RevealFlow eyebrow="SPRING AI / FROM MODEL TO APPLICATION" title={<>From a prompt to <span>Java objects.</span></>} labels={['ChatModel', 'ChatClient', 'Prompt', 'Structured output', 'Java object']} lead="OpenAI / Ollama behind the model abstraction." />;
}

function excerpt(source, anchor, count) {
    const lines = source.split('\n');
    const start = lines.findIndex(line => line.includes(anchor));
    if (start < 0) throw new Error(`Presentation source anchor not found: ${anchor}`);
    const selected = lines.slice(start, start + count);
    const indent = Math.min(...selected.filter(line => line.trim()).map(line => line.match(/^ */)[0].length));
    return { lines: selected.map(line => line.slice(indent)), startLine: start + 1 };
}

function SourceWalkthrough({ title, file, source, windows, lead }) {
    const [step, setStep] = useState(0);
    const current = windows[step];
    const snippet = excerpt(source, current.anchor, current.count ?? 9);
    const highlight = (current.highlight ?? [0]).map(offset => snippet.startLine + offset);
    return <Frame eyebrow="INSIDE THE IMPLEMENTATION" title={title} lead={lead} className="code-page source-walkthrough"><div className="code-step-tabs" role="group" aria-label={`${file} walkthrough`}>{windows.map((window, i) => <Button key={window.label} variant={i === step ? 'secondary' : 'ghost'} aria-pressed={i === step} onClick={() => setStep(i)}>{window.label}</Button>)}</div><CodeSlide file={file} {...snippet} highlight={highlight} annotation={current.annotation} /><p className="source-reference">EXACT SOURCE EXCERPT <span>Other code omitted for focus.</span></p></Frame>;
}
export function OrchestrationPage() {
    return <SourceWalkthrough title={<>The orchestrator owns <span>the workflow.</span></>} file="PipelineOrchestrator.java" source={orchestrator} windows={[
        { label: '01 Requirements', anchor: '// TODO: Gather business context', count: 6, highlight: [1, 4], annotation: 'Requirements are analyzed before implementation starts.' },
        { label: '02 Code', anchor: 'CodeChangeSet changeSet = codeAgent.generate(ctx);', count: 7, highlight: [0, 2, 4], annotation: 'The proposal becomes pipeline state for the next stage.' },
        { label: '03 Review', anchor: 'ReviewDecision review = reviewAgent.review(ctx);', count: 9, highlight: [0, 4, 6], annotation: 'A request for changes pauses the pipeline for human feedback.' },
        { label: '04 Deployment', anchor: 'DeploymentDecision decision = deployAgent.evaluate(ctx);', count: 11, highlight: [0, 4, 8], annotation: 'The deployment decision controls release or the approval path.' },
    ]} />;
}
export function RequirementsPage() {
    return <SourceWalkthrough title={<>Requirements meet <span>enterprise context.</span></>} file="RequirementsAgent.java" source={requirements} windows={[
        { label: '01 Context', anchor: 'String complianceGuidance =', count: 8, highlight: [0, 7], annotation: 'Rhea retrieves policy before asking the model to reason.' },
        { label: '02 Prompt', anchor: '"additionalContext",', count: 8, highlight: [0, 1, 4, 6], annotation: 'Additional business context joins the prompt and typed requirement analysis.' },
        { label: '03 Clarification', anchor: 'String decision = analysis.needsClarification()', count: 7, highlight: [0], annotation: 'Unresolved requirements become a clarification decision.' },
    ]} />;
}
export function EnterpriseToolsPage() {
    return <SourceWalkthrough title={<>Context is <span>part of the input.</span></>} file="RequirementsAgent.java" source={requirements} windows={[
        { label: '01 Policy', anchor: 'String complianceGuidance =', count: 8, highlight: [4, 7], annotation: 'Compliance guidance is retrieved through the provided tool.' },
        { label: '02 Architecture', anchor: 'String architectureGuidance =', count: 8, highlight: [4, 7], annotation: 'Architecture guidance informs implementation choices.' },
        { label: '03 API contracts', anchor: 'String spec =', count: 8, highlight: [4, 7], annotation: 'The API specification supplies contract evidence.' },
    ]} />;
}
export function GatesPage() {
    return <SourceWalkthrough title={<>Reasoning informs.<br /><span>Java enforces.</span></>} file="DeployAgent.java" source={deployment} windows={[
        { label: '01 Critical findings', anchor: 'boolean criticalFindings =', count: 5, highlight: [0, 1, 4], annotation: 'Atlas blocks release when critical findings remain.' },
        { label: '02 Test signal', anchor: 'boolean testSignalPassed =', count: 10, highlight: [0, 2, 4, 8], annotation: 'Tests must be proposed and the simulated/model-provided signal must pass.' },
        { label: '03 Approval', anchor: 'boolean gatesPass =', count: 9, highlight: [0, 2, 8], annotation: 'Passing technical gates leads to human authorization.' },
    ]} />;
}
export function ApprovalPage() {
    return <SourceWalkthrough title={<>Humans authorize.<br /><span>The system checks again.</span></>} file="PipelineOrchestrator.java" source={orchestrator} windows={[
        { label: '01 Approval boundary', anchor: 'public PipelineContext approve(', count: 9, highlight: [0, 4, 6], annotation: 'Only a pipeline waiting for approval can take this path.' },
        { label: '02 Revalidate', anchor: 'DeploymentDecision decision = deployAgent.revalidate(ctx);', count: 11, highlight: [0, 4, 6, 10], annotation: 'Approval does not bypass the gates. Atlas revalidates before release.' },
    ]} />;
}
export function LiveDemoPage() {
    return <div className="statement-page"><p className="eyebrow"><span className="signal-dot" />LIVE DEMO</p><h2>Let's run<br /><span>the pipeline.</span></h2><p className="page-lead">Enterprise Copilot</p><div className="demo-scenarios"><span>Requirements</span><ArrowRight /><span>Review</span><ArrowRight /><span>Human approval</span></div></div>;
}
export function MissingContextPage() {
    return <Frame eyebrow="YOUR TURN / SOMETHING IS MISSING" title={<>Rhea knows how to reason.<br /><span>But it needs the business decision.</span></>}><div className="missing-context"><Flow labels={['Issue', 'Requirements Agent', 'Human clarification']} /><blockquote><CircleHelp size={25} />Which notification channel should we use?</blockquote><span className="diagram-label">UB-4823 / BEFORE</span></div></Frame>;
}
const tasks = ['Create ConfluenceAgent', 'Use ConfluenceTool to retrieve context', 'Pass context to RequirementsAgent', 'Run UB-4823 again'];
function TaskList() {
    return <ol className="assignment-list">{tasks.map((task, i) => <li key={task}><span>{String(i + 1).padStart(2, '0')}</span>{task}</li>)}</ol>;
}
export function AssignmentPage() {
    return <Frame eyebrow="YOUR TASK" title={<>Give the pipeline access to<br /><span>approved business knowledge.</span></>}><div className="assignment-layout"><TaskList /><div className="assignment-diagram"><BookOpen size={26} /><Flow vertical labels={['Confluence', 'Confluence Agent', 'Requirements Agent']} /></div></div></Frame>;
}
export function HandsOnPage() {
    const [remaining, setRemaining] = useState(300);
    const [running, setRunning] = useState(false);
    const deadline = useRef(null);
    useEffect(() => {
        if (!running) return undefined;
        const tick = () => {
            const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
            setRemaining(seconds);
            if (!seconds) { deadline.current = null; setRunning(false); }
        };
        tick();
        const timer = setInterval(tick, 250);
        return () => clearInterval(timer);
    }, [running]);
    const toggle = () => {
        if (running) {
            setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
            deadline.current = null;
            setRunning(false);
        } else {
            deadline.current = Date.now() + remaining * 1000;
            setRunning(true);
        }
    };
    const reset = () => { deadline.current = null; setRunning(false); setRemaining(300); };
    return <Frame eyebrow="YOUR TURN / HANDS-ON" title={<>Add enterprise <span>knowledge.</span></>}><div className="hands-on-layout"><TaskList /><div className="exercise-timer"><span className="diagram-label">FIVE-MINUTE EXERCISE</span><div role="timer" aria-label="Exercise time remaining" aria-live="off">{String(Math.floor(remaining / 60)).padStart(2, '0')}<span>:</span>{String(remaining % 60).padStart(2, '0')}</div><div className="timer-controls"><Button variant="outline" disabled={remaining === 0} onClick={toggle}>{running ? <Pause size={16} /> : <Play size={16} />}{running ? 'Pause' : remaining < 300 ? 'Resume' : 'Start'}</Button><Button variant="ghost" onClick={reset}><RotateCcw size={16} />Reset</Button></div><p role="status">{remaining === 0 ? 'Time is up. Let’s look at the solution.' : running ? 'Time to build.' : 'Start when everyone is ready.'}</p></div></div></Frame>;
}
const solutionSource = confluence.trimEnd().split('\n');
const integration = workshopGuide.match(/```java\n(String businessContext[\s\S]*?)\n```/)[1].split('\n');
export function SolutionPage() {
    const [reveal, setReveal] = useState(0);
    return <Frame eyebrow="THE SOLUTION" title={<>Gather context.<br /><span>Let Rhea use it.</span></>} className="solution-page code-page"><div className="code-step-tabs"><Button variant={reveal === 1 ? 'secondary' : 'outline'} onClick={() => setReveal(1)} aria-pressed={reveal === 1}>Reveal ConfluenceAgent</Button><Button variant={reveal === 2 ? 'secondary' : 'outline'} disabled={reveal === 0} onClick={() => setReveal(2)} aria-pressed={reveal === 2}>Orchestrator integration</Button><Button variant="ghost" onClick={() => setReveal(0)}>Hide</Button></div>{reveal === 0 ? <div className="solution-cover"><BookOpen size={32} /><p>One small agent.<br />Approved business context.</p></div> : <CodeSlide file={reveal === 1 ? 'ConfluenceAgent.java' : 'PipelineOrchestrator.java · workshop integration'} lines={reveal === 1 ? solutionSource : integration} startLine={1} highlight={reveal === 1 ? [15, 16] : [1, 2, 3]} annotation={reveal === 1 ? 'The agent gathers context. It does not make another model call.' : 'The supplied wrapper records activity; Rhea receives the additional context.'} />}<p className="source-reference">{reveal === 1 ? 'WORKSHOP REFERENCE SOURCE' : reveal === 2 ? 'SUPPLIED WORKSHOP GUIDE SNIPPET · NUMBERING RELATIVE TO SNIPPET' : 'EXPLICIT REVEAL / NO AUTOMATIC SOLUTION'}</p></Frame>;
}
export function BeforeAfterPage() {
    return <Frame eyebrow="UB-4823 / BEFORE AND AFTER" title={<>The same issue.<br /><span>Better business context.</span></>}><div className="comparison-layout"><div><span className="comparison-label">BEFORE</span><Flow vertical labels={['Issue', 'Requirements Agent', 'Human clarification']} /></div><div><span className="comparison-label after-label">AFTER</span><Flow vertical labels={['Issue', 'Confluence Agent', 'Approved SMS policy', 'Requirements Agent', 'Pipeline continues']} /></div></div></Frame>;
}
export function FinishPage() {
    return <div className="statement-page finish-page"><p className="eyebrow">THE TAKEAWAY</p><h2>Agents advise.<br />Systems enforce.<br /><span>Humans authorize.</span></h2><div className="finish-principles"><span><BookOpen />Enterprise knowledge</span><ArrowRight /><span>AI agents</span><ArrowRight /><span><ShieldCheck />Deterministic gates</span><ArrowRight /><span><UserRound />Human accountability</span></div><a className="resource-link" href="https://docs.spring.io/spring-ai/reference/" target="_blank" rel="noopener noreferrer">Spring AI reference <ArrowRight size={15} /></a></div>;
}
