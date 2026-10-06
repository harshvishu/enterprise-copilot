import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './delivery-comparison.css';

const traditional = ['Requirement', 'Developer', 'Code', 'Review', 'Tests', 'Approval', 'Deploy'];
const agentic = ['Issue', 'Rhea', 'Nova', 'Sentinel', 'Atlas', 'Deterministic gates', 'Human approval', 'Release'];

function Lifecycle({ kind, layout = 'row', animate }) {
    const labels = kind === 'traditional' ? traditional : agentic;
    const wrapped = layout === 'serpentine';
    const width = kind === 'traditional' ? 148 : wrapped ? 180 : 128;
    const points = labels.map((_, index) => wrapped
        ? index < 5 ? [118 + index * 240, 45] : [1078 - (index - 5) * 240, 189]
        : [kind === 'traditional' ? 85 + index * 172 : 75 + index * 150, 55]);
    const edges = points.slice(0, -1).map(([x, y], index) => {
        const [nextX, nextY] = points[index + 1];
        if (y !== nextY) return `M${x} ${y + 38} V${nextY - 38}`;
        const direction = nextX > x ? 1 : -1;
        return `M${x + direction * width / 2} ${y} H${nextX - direction * width / 2}`;
    });
    const marker = `delivery-${kind}-${layout}-arrow`;
    return <svg viewBox={`0 0 1200 ${wrapped ? 234 : 110}`} role="img" aria-label={`${kind === 'traditional' ? 'Traditional delivery' : 'Agentic SDLC'}: ${labels.join(' → ')}`}>
        <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" /></marker></defs>
        {edges.map((path, index) => <g key={path} data-delivery-edge={index}>
            <path className="delivery-edge" d={path} markerEnd={`url(#${marker})`} />
            {animate && <path className="delivery-pulse" d={path} pathLength="100" style={{ animationDelay: `${500 + index * 750}ms` }} aria-hidden="true" />}
        </g>)}
        {labels.map((label, index) => {
            const [x, y] = points[index];
            const lines = label === 'Deterministic gates' ? ['Deterministic', 'gates'] : label === 'Human approval' ? ['Human', 'approval'] : [label];
            const coding = label === 'Code';
            return <g key={label} className={`delivery-node ${coding ? 'delivery-code' : ''} ${lines.length > 1 ? 'delivery-governance-node' : ''}`} data-delivery-node={label}>
                <rect x={x - width / 2} y={y - 38} width={width} height="76" rx="4" />
                <text x={x} y={y + (lines.length > 1 || coding ? -5 : 7)}>{lines.map((line, lineIndex) => <tspan key={line} x={x} dy={lineIndex ? 25 : 0}>{line}</tspan>)}</text>
                {coding && <text className="delivery-code-caption" x={x} y={y + 21}>AI coding</text>}
            </g>;
        })}
    </svg>;
}

export default function DeliveryComparison() {
    const [stage, setStage] = useState(1);
    return <div className="technical-page workshop-page delivery-comparison" data-delivery-stage={stage}>
        <p className="eyebrow">THE PROBLEM / BEYOND CODE COMPLETION</p>
        <div className="delivery-canvas">
            <h2>From coding assistance<br />to <span>software delivery.</span></h2>
            <p className="delivery-opening" aria-hidden={stage !== 1}>AI coding accelerates implementation. Software delivery extends across the entire SDLC.</p>
            <div className="delivery-traditional" aria-hidden={stage === 1}>
                <span className="comparison-label">TRADITIONAL DELIVERY</span>
                <Lifecycle kind="traditional" animate={stage === 2} />
            </div>
            <div className="delivery-agentic" aria-hidden={stage !== 3}>
                <span className="comparison-label after-label">AGENTIC SDLC</span>
                <div className="delivery-wrapped"><Lifecycle kind="agentic" layout="serpentine" animate={stage === 3} /></div>
                <div className="delivery-horizontal"><Lifecycle kind="agentic" animate={stage === 3} /></div>
            </div>
        </div>
        <div className="reveal-controls">
            <Button variant="outline" disabled={stage === 3} onClick={() => setStage(value => Math.min(value + 1, 3))}>Reveal next <ArrowRight size={15} /></Button>
            <Button variant="ghost" onClick={() => setStage(1)}>Reset</Button>
            <span role="status" aria-live="polite">{stage} / 3</span>
        </div>
    </div>;
}
