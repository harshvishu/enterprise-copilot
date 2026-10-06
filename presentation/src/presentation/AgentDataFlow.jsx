import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stages = [
    { name: 'Issue', x: 80, y: 185, width: 100 },
    { name: 'Rhea', output: 'Analysis', x: 320, y: 185, width: 190 },
    { name: 'Nova', output: 'Proposal', x: 580, y: 185, width: 190 },
    { name: 'Sentinel', output: 'Review', x: 840, y: 185, width: 190 },
    { name: 'Atlas', output: 'Decision', x: 1100, y: 185, width: 190 },
    { name: 'Deterministic gates', x: 630, y: 347, width: 190 },
    { name: 'Human approval', x: 855, y: 347, width: 190 },
    { name: 'Release', x: 1100, y: 347, width: 120 },
];
const paths = [null, 'M130 185 H225', 'M415 185 H485', 'M675 185 H745', 'M935 185 H1005', 'M1100 225 V288 H630 V315', 'M725 347 H760', 'M950 347 H1040'];

function useReducedMotion() {
    const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    useEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(preference.matches);
        update();
        preference.addEventListener?.('change', update);
        return () => preference.removeEventListener?.('change', update);
    }, []);
    return reduced;
}

function DataPacket({ path }) {
    const motion = useRef(null);
    // Slides stay mounted, so the SVG timeline may already be running when a
    // stage is revealed. Start this motion on mount rather than at SVG time 0.
    useEffect(() => { motion.current?.beginElement?.(); }, []);
    return <circle r="5" className="data-packet" aria-hidden="true"><animateMotion ref={motion} begin="indefinite" path={path} dur="0.85s" fill="freeze" /></circle>;
}

export default function AgentDataFlowPage() {
    const [step, setStep] = useState(0);
    const reduced = useReducedMotion();
    return <div className="technical-page diagram-page data-flow-page">
        <p className="eyebrow">THE FLOW / STRUCTURED STATE</p>
        <h2>One workflow. <span>Shared context.</span></h2>
        <figure className="data-flow-figure">
            <svg viewBox="0 0 1220 400" role="img" aria-label={`Pipeline data flow. Current stage: ${stages[step].name}.`}>
                <title>PipelineOrchestrator coordinates specialized agents using PipelineContext</title>
                <defs><marker id="data-flow-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" className="flow-arrowhead" /></marker></defs>
                <g className="flow-context">
                    <rect x="200" y="5" width="760" height="60" rx="4" />
                    <text x="580" y="29" className="flow-context-title">Enterprise Context</text>
                    <text x="580" y="51" className="flow-context-detail">Policy · Architecture · API contracts</text>
                    <path d="M580 65 V95 H320 V145" className="flow-edge context-edge" markerEnd="url(#data-flow-arrow)" />
                </g>
                <rect x="5" y="117" width="1200" height="155" rx="4" className="flow-orchestrator-frame" />
                <text x="22" y="107" className="flow-owner-label">PipelineOrchestrator · workflow owner</text>
                {paths.map((path, index) => path && <path key={index} d={path} className={`flow-edge ${index <= step ? 'is-revealed' : 'is-hidden'}`} markerEnd="url(#data-flow-arrow)" />)}
                {stages.map((stage, index) => <g key={stage.name} data-flow-stage={index} data-current={index === step} aria-hidden={index > step} className={`flow-stage ${index <= step ? 'is-revealed' : 'is-hidden'} ${index === step ? 'is-current' : ''}`}>
                    <rect x={stage.x - stage.width / 2} y={stage.y - (index < 5 ? 40 : 32)} width={stage.width} height={index < 5 ? 80 : 64} rx="4" />
                    <text x={stage.x} y={stage.y + 7} className={index > 4 ? 'flow-governance-label' : 'flow-stage-name'}>{stage.name}</text>
                    {stage.output && <><path d={`M${stage.x} 225 V235`} className="flow-output-edge" /><text x={stage.x} y="255" className="flow-output-label">{stage.output}</text></>}
                </g>)}
                {step > 0 && !reduced && <DataPacket key={step} path={paths[step]} />}
            </svg>
            <figcaption><code>PipelineContext</code> carries typed results between stages.</figcaption>
        </figure>
        <div className="reveal-controls"><Button variant="outline" disabled={step === stages.length - 1} onClick={() => setStep(value => value + 1)}>Reveal next <ArrowRight size={15} /></Button><Button variant="ghost" onClick={() => setStep(0)}>Reset</Button><span role="status">{step + 1} / {stages.length} · {stages[step].name}</span></div>
        <p className="diagram-note">Atlas evaluates Java gates. Human approval cannot bypass them. Release is simulated.</p>
    </div>;
}
