import React from 'react';
import { Check, GitBranch } from 'lucide-react';
import { useSlideState } from './slide-navigation';
import './delivery-comparison.css';

const traditional = ['Requirement', 'Build', 'Verify', 'Release'];
const agentic = [
    { name: 'Issue', icon: GitBranch, unboxed: true },
    { name: 'Rhea', subtitle: 'Requirements Agent' },
    { name: 'Nova', subtitle: 'Coding Agent' },
    { name: 'Sentinel', subtitle: 'Review Agent' },
    { name: 'Atlas', subtitle: 'Release Agent' },
    { name: 'Deterministic gates', subtitle: 'System enforcement' },
    { name: 'Human approval', subtitle: 'Human authority' },
    { name: 'Release', icon: Check, unboxed: true },
];

function Lifecycle({ kind, animate }) {
    const workshop = kind === 'agentic';
    const nodes = workshop ? agentic : traditional.map(name => ({ name }));
    const width = 250;
    const height = workshop ? 96 : 76;
    const points = nodes.map((_, index) => workshop
        ? index < 4 ? [150 + index * 300, 80] : [1050 - (index - 4) * 300, 240]
        : [150 + index * 300, 55]);
    const edges = points.slice(0, -1).map(([x, y], index) => {
        const [nextX, nextY] = points[index + 1];
        if (y !== nextY) return `M${x} ${y + height / 2} V${nextY - height / 2}`;
        const direction = nextX > x ? 1 : -1;
        const fromWidth = nodes[index].unboxed ? 180 : width;
        const toWidth = nodes[index + 1].unboxed ? 180 : width;
        return `M${x + direction * fromWidth / 2} ${y} H${nextX - direction * toWidth / 2}`;
    });
    const marker = `delivery-${kind}-arrow`;
    return <svg viewBox={`0 0 1200 ${workshop ? 320 : 110}`} role="img" aria-label={`${workshop ? 'Workshop Agentic SDLC' : 'Traditional delivery'}: ${nodes.map(node => node.name).join(' → ')}`}>
        <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" /></marker></defs>
        {edges.map((path, index) => <g key={path} data-delivery-edge={index}>
            <path className="delivery-edge" d={path} markerEnd={`url(#${marker})`} />
            {animate && <path className="delivery-pulse" d={path} style={{ animationDelay: `${-index * 350}ms` }} aria-hidden="true" />}
        </g>)}
        {nodes.map((node, index) => {
            const [x, y] = points[index];
            return <g key={node.name} className={`delivery-node ${workshop ? 'delivery-workshop-node' : ''} ${node.unboxed ? 'delivery-endpoint' : ''}`} data-delivery-node={node.name}>
                {!node.unboxed && <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx="4" />}
                {node.icon && <node.icon x={x - 50} y={y - 12} className="delivery-icon" aria-hidden="true" />}
                <text x={node.unboxed ? x - 14 : x} y={workshop && !node.unboxed ? y - 3 : y + 8} className="delivery-node-name">{node.name}</text>
                {node.subtitle && <text className="delivery-node-subtitle" x={x} y={y + 32}>{node.subtitle}</text>}
            </g>;
        })}
    </svg>;
}

export default function DeliveryComparison() {
    const [stage] = useSlideState(1, 3);
    return <div className="technical-page workshop-page delivery-comparison" data-delivery-stage={stage}>
        <p className="eyebrow">THE PROBLEM / BEYOND CODE COMPLETION</p>
        <div className="delivery-canvas">
            <h2 aria-hidden={stage === 3}>From coding assistance<br />to <span>software delivery.</span></h2>
            <p className="delivery-opening" aria-hidden={stage !== 1}>AI coding accelerates implementation. Software delivery extends across the entire SDLC.</p>
            <div className="delivery-traditional" aria-hidden={stage !== 2}>
                <span className="comparison-label">TRADITIONAL DELIVERY</span>
                <p className="delivery-section-subtitle">Human-driven handoffs across delivery stages</p>
                <Lifecycle kind="traditional" animate={stage === 2} />
            </div>
            <div className="delivery-agentic" aria-hidden={stage !== 3}>
                <span className="comparison-label after-label">AGENTIC SDLC</span>
                <p className="delivery-section-subtitle">Specialized agents collaborate across delivery — extend with more agents as needed.</p>
                <div className="delivery-workshop-caption"><span>Our workshop implementation · four agents</span><span className="delivery-extensibility">+ More agents</span></div>
                <Lifecycle kind="agentic" animate={stage === 3} />
            </div>
        </div>
    </div>;
}
