import React, { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useSlideState } from './slide-navigation';
import './system-architecture.css';

let renderSequence = 0;

const phases = [
    {
        label: 'Experience',
        description: 'The dashboard calls one application boundary.',
        diagram: `flowchart LR
            USER["Presenter / Engineer"] --> UI["React + Vite dashboard"]
            UI -->|"REST + SSE"| API["Spring Boot API"]`,
    },
    {
        label: 'Coordination',
        description: 'A modular monolith coordinates focused agents in process.',
        diagram: `flowchart LR
            USER["Presenter / Engineer"] --> UI["React + Vite dashboard"]
            UI -->|"REST + SSE"| API["Spring Boot API"]
            subgraph APP["Spring Boot modular monolith"]
                API --> ORCH["PipelineOrchestrator"]
                ORCH --> AGENTS["Rhea · Nova · Sentinel"]
            end`,
    },
    {
        label: 'Context + reasoning',
        description: 'Agents combine enterprise evidence with model reasoning.',
        diagram: `flowchart LR
            USER["Presenter / Engineer"] --> UI["React + Vite dashboard"]
            UI -->|"REST + SSE"| API["Spring Boot API"]
            subgraph APP["Spring Boot modular monolith"]
                API --> ORCH["PipelineOrchestrator"]
                ORCH --> AGENTS["Rhea · Nova · Sentinel"]
                AGENTS --> TOOLS["Enterprise tools\nPolicy · Architecture · API · Confluence"]
                AGENTS --> AI["AgentAiClient / Spring AI"]
            end
            AI --> MODEL["OpenAI / Ollama"]`,
    },
    {
        label: 'Control + accountability',
        description: 'Java gates, durable state, audit, and people control the outcome.',
        diagram: `flowchart LR
            USER["Presenter / Engineer"] --> UI["React + Vite dashboard"]
            UI -->|"REST + SSE"| API["Spring Boot API"]
            subgraph APP["Spring Boot modular monolith"]
                API --> ORCH["PipelineOrchestrator"]
                ORCH --> AGENTS["Rhea · Nova · Sentinel"]
                AGENTS --> TOOLS["Enterprise tools\nPolicy · Architecture · API · Confluence"]
                AGENTS --> AI["AgentAiClient / Spring AI"]
                ORCH --> ATLAS["Atlas / deterministic Java gates"]
                ORCH --> STORE["JPA + Flyway"]
                ORCH --> AUDIT["Audit + redaction"]
                AUDIT --> STORE
            end
            AI --> MODEL["OpenAI / Ollama"]
            STORE --> DB[("H2 / PostgreSQL")]
            ATLAS --> HUMAN["Human approval"]
            HUMAN --> RELEASE["Simulated deployment"]`,
    },
];

export default function SystemArchitecturePage() {
    const [phase] = useSlideState(0, phases.length - 1);
    const { theme } = useTheme();
    const [svg, setSvg] = useState('');
    const [renderError, setRenderError] = useState(false);
    const current = phases[phase];

    useEffect(() => {
        let cancelled = false;
        if (navigator.userAgent.includes('jsdom')) return undefined;
        const render = async () => {
            try {
                await document.fonts.ready;
                const { default: mermaid } = await import('mermaid');
                const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                mermaid.initialize({
                    startOnLoad: false,
                    securityLevel: 'strict',
                    theme: 'base',
                    fontFamily: 'Geist Variable, sans-serif',
                    themeVariables: dark ? {
                        background: '#171a19', primaryColor: '#202724', primaryTextColor: '#f0eee7', primaryBorderColor: '#83c9a8',
                        lineColor: '#83c9a8', secondaryColor: '#262d2a', tertiaryColor: '#171a19', clusterBkg: '#1c211f', clusterBorder: '#53615b',
                        edgeLabelBackground: '#171a19', fontSize: '18px',
                    } : {
                        background: '#faf9f5', primaryColor: '#f4f3ed', primaryTextColor: '#232926', primaryBorderColor: '#28765c',
                        lineColor: '#28765c', secondaryColor: '#eeece5', tertiaryColor: '#faf9f5', clusterBkg: '#f7f5ef', clusterBorder: '#a7aaa5',
                        edgeLabelBackground: '#faf9f5', fontSize: '18px',
                    },
                    flowchart: { htmlLabels: false, curve: 'basis', useMaxWidth: true },
                });
                const result = await mermaid.render(`system-architecture-${++renderSequence}`, current.diagram);
                if (!cancelled) {
                    setSvg(result.svg);
                    setRenderError(false);
                }
            } catch {
                if (!cancelled) setRenderError(true);
            }
        };
        setSvg('');
        render();
        return () => { cancelled = true; };
    }, [current.diagram, phase, theme]);

    return <div className="technical-page architecture-slide">
        <p className="eyebrow">THE SYSTEM / ARCHITECTURE</p>
        <div className="architecture-title-row">
            <h2>One process.<br /><span>Clear boundaries.</span></h2>
            <div className="architecture-phase-copy" aria-live="polite">
                <span>PHASE 0{phase + 1}</span>
                <strong>{current.label}</strong>
                <p>{current.description}</p>
            </div>
        </div>
        <figure className="architecture-diagram" aria-label={`System architecture, phase ${phase + 1}: ${current.label}`}>
            {svg && <div className="architecture-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />}
            {!svg && !renderError && <span className="architecture-rendering">Rendering architecture...</span>}
            {renderError && <span role="alert" className="architecture-rendering">Architecture diagram could not be rendered.</span>}
        </figure>
        <ol className="architecture-phases" aria-label="Architecture phases">
            {phases.map((item, index) => <li key={item.label} className={index === phase ? 'is-current' : index < phase ? 'is-complete' : ''}>
                <span>0{index + 1}</span>{item.label}
            </li>)}
        </ol>
    </div>;
}