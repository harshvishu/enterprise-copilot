import React from 'react';
import { BookOpen, Layers3, ShieldCheck, UserRound } from 'lucide-react';
import { useSlideState } from './slide-navigation';
import './agent-data-flow.css';

const concepts = [
    { name: 'CONTEXT', description: 'Enterprise policy · Architecture · API contracts', icon: BookOpen },
    { name: 'SPECIALIZATION', description: 'Requirements · Coding · Review', icon: Layers3 },
    { name: 'CONTROL', description: 'Deterministic gates outside model authority', icon: ShieldCheck },
    { name: 'ACCOUNTABILITY', description: 'Humans authorize critical actions', icon: UserRound },
];

export default function AgentDataFlowPage() {
    const [revealed] = useSlideState(0, concepts.length);
    return <div className="technical-page agentic-concepts-page" data-concepts-revealed={revealed}>
        <p className="eyebrow">THE SYSTEM / ENTERPRISE COPILOT</p>
        <div className="concepts-canvas">
            <h2>What makes this <span>agentic?</span></h2>
            <div className="agentic-concepts" aria-label="Four agentic principles">
                {concepts.map((concept, index) => <article key={concept.name} className="agentic-concept" data-concept={concept.name} aria-hidden={index >= revealed}>
                    <div className="concept-heading"><concept.icon size={20} strokeWidth={1.5} aria-hidden="true" /><h3>{concept.name}</h3></div>
                    <p>{concept.description}</p>
                </article>)}
            </div>
        </div>
        <p className="concepts-takeaway" aria-hidden={revealed < concepts.length}>Agents advise. Systems enforce. Humans authorize.</p>
    </div>;
}
