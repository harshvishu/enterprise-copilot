import React from 'react';

const STAGES = [
    'ISSUE',
    'REQUIREMENTS',
    'CODE',
    'REVIEW',
    'DEPLOY'
];

const AGENTS = {
    REQUIREMENTS: '🔍 Rhea',
    CODE: '💻 Nova',
    REVIEW: '🛡️ Sentinel',
    DEPLOY: '🚀 Atlas'
};

// Map a pipeline state to per-stage status:
// pending | running | done | warn | blocked

function statuses(state) {
    const s = {};
    STAGES.forEach((st) => (s[st] = 'pending'));
    s.ISSUE = 'done';
    const set = (stage, val) => (s[stage] = val);
    switch (state) {
        case 'ANALYZING_REQUIREMENTS':
            set('REQUIREMENTS', 'running');
            break;
        case 'REQUIREMENTS_READY':
            set('REQUIREMENTS', 'done');
            break;
        case 'GENERATING_CODE':
            set('REQUIREMENTS', 'done');
            set('CODE', 'running');
            break;
        case 'CODE_READY':
            set('REQUIREMENTS', 'done');
            set('CODE', 'done');
            break;
        case 'REVIEWING':
            set('REQUIREMENTS', 'done');
            set('CODE', 'done');
            set('REVIEW', 'running');
            break;
        case 'REVIEW_PASSED':
            ['REQUIREMENTS', 'CODE', 'REVIEW']
                .forEach((x) => set(x, 'done'));
            break;
        case 'REVIEW_FAILED':
            set('REQUIREMENTS', 'done');
            set('CODE', 'done');
            set('REVIEW', 'blocked');
            break;
        case 'WAITING_FOR_APPROVAL':
            ['REQUIREMENTS', 'CODE', 'REVIEW']
                .forEach((x) => set(x, 'done'));
            set('DEPLOY', 'warn');
            break;
        case 'DEPLOYING':
            ['REQUIREMENTS', 'CODE', 'REVIEW']
                .forEach((x) => set(x, 'done'));
            set('DEPLOY', 'running');
            break;
        case 'DEPLOYED':
            STAGES.forEach((x) => set(x, 'done'));
            break;
        case 'BLOCKED':
            set('DEPLOY', 'blocked');
            break;
        case 'FAILED':
            set('DEPLOY', 'blocked');
            break;
        default:
            break;
    }
    return s;
}

const ICON = {
    pending: '○',
    running: '🔄',
    done: '✅',
    warn: '⚠️',
    blocked: '❌'
};

const COLOR = {
    pending: 'text-slate-500 border-edge',
    running: 'text-accent border-accent animate-pulse-soft',
    done: 'text-ok border-ok/50',
    warn: 'text-warn border-warn/60',
    blocked: 'text-danger border-danger/60'
};

export default function PipelineStages({ state }) {
    const s = statuses(state || 'CREATED');
    return (
        <div className="flex items-stretch gap-2">
            {STAGES.map((stage, i) => (
                <React.Fragment key={stage}>
                    <div
                        className={`flex-1 rounded-lg border bg-panel2 px-3 py-4 text-center ${
                            COLOR[s[stage]]
                        }`}
                    >
                        <div className="text-2xl leading-none">
                            {ICON[s[stage]]}
                        </div>
                        <div className="mt-2 text-xs font-semibold tracking-wide text-slate-200">
                            {stage}
                        </div>
                        {AGENTS[stage] && (
                            <div className="mt-1 text-[11px] text-slate-400">
                                {AGENTS[stage]}
                            </div>
                        )}
                    </div>
                    {i < STAGES.length - 1 && (
                        <div className="self-center text-slate-600">
                            →
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
