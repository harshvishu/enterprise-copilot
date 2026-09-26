import React, { useEffect, useRef } from 'react';

const AGENT_STYLE = {
    Rhea: 'text-sky-300',
    Nova: 'text-violet-300',
    Sentinel: 'text-emerald-300',
    Atlas: 'text-orange-300',
    Human: 'text-amber-300',
    System: 'text-slate-400'
};

const TYPE_BADGE = {
    FINDING_CREATED: 'bg-danger/20 text-danger',
    GATE_BLOCKED: 'bg-danger/20 text-danger',
    APPROVAL_REQUIRED: 'bg-warn/20 text-warn',
    APPROVAL_GRANTED: 'bg-ok/20 text-ok',
    DEPLOYMENT_COMPLETED: 'bg-ok/20 text-ok',
    PIPELINE_COMPLETED: 'bg-ok/20 text-ok',
    PIPELINE_FAILED: 'bg-danger/20 text-danger'
};

export default function AgentActivity({ events }) {
    const endRef = useRef(null);
    useEffect(() => {
        endRef.current?.scrollIntoView({
            behavior: 'smooth'
        });
    }, [events]);

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3 border-b border-edge text-sm font-semibold text-slate-200">
                Live Agent Activity
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {events.length === 0 && (
                    <div className="text-slate-500 text-sm">
                        Run the pipeline to see AI teammates collaborate.
                    </div>
                )}
                {events.map((e, i) => (
                    <div
                        key={i}
                        className="rounded-lg bg-panel2 border border-edge p-3"
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className={`text-sm font-semibold ${
                                    AGENT_STYLE[e.agent] || 'text-slate-300'
                                }`}
                            >
                                {e.agent}
                            </span>
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded ${
                                    TYPE_BADGE[e.type] ||
                                    'bg-edge text-slate-300'
                                }`}
                            >
                                {e.type}
                            </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-300 leading-snug">
                            {e.message}
                        </div>
                    </div>

                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
}