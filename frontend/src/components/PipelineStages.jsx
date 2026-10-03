import React from 'react';
import {
    CircleDot,
    FileSearch,
    Code2,
    ShieldCheck,
    Rocket,
    Check,
    X,
    Clock3,
    Loader2,
} from 'lucide-react';
import { stageStatuses } from '@/lib/pipeline';
import { cn } from '@/lib/utils';

const STAGES = [
    { name: 'Issue', agent: 'Work item', icon: CircleDot },
    { name: 'Requirements', agent: 'Rhea', icon: FileSearch },
    { name: 'Code', agent: 'Nova', icon: Code2 },
    { name: 'Review', agent: 'Sentinel', icon: ShieldCheck },
    { name: 'Deploy', agent: 'Atlas', icon: Rocket },
];
const STATUS = {
    pending: 'Not started',
    running: 'Running',
    completed: 'Completed',
    waiting: 'Waiting',
    rejected: 'Rejected',
    blocked: 'Blocked',
    failed: 'Failed',
};

export default function PipelineStages({ pipeline, state }) {
    const statuses = stageStatuses(pipeline || (state ? { state } : null));
    return (
        <section aria-label="Delivery pipeline" className="border-y py-6 sm:py-8">
            <ol className="grid grid-cols-5 gap-1 sm:gap-3">
                {STAGES.map((stage, index) => {
                    const status = statuses[index];
                    const Icon =
                        status === 'completed'
                            ? Check
                            : ['rejected', 'blocked', 'failed'].includes(status)
                              ? X
                              : status === 'running'
                                ? Loader2
                                : status === 'waiting'
                                  ? Clock3
                                  : stage.icon;
                    return (
                        <li
                            key={stage.name}
                            aria-current={
                                status === 'running' || status === 'waiting' ? 'step' : undefined
                            }
                            className="relative min-w-0"
                        >
                            {index < STAGES.length - 1 && (
                                <div
                                    aria-hidden="true"
                                    className={cn(
                                        'absolute left-9 right-0 top-4 h-px sm:left-10',
                                        status === 'completed' ? 'bg-success/30' : 'bg-border',
                                    )}
                                />
                            )}
                            <div
                                className={cn(
                                    'relative flex h-8 w-8 items-center justify-center rounded-full border bg-background',
                                    status === 'completed'
                                        ? 'border-success/30 text-success'
                                        : status === 'running'
                                          ? 'border-primary text-primary'
                                          : status === 'waiting'
                                            ? 'border-warning/50 text-warning'
                                            : ['rejected', 'blocked', 'failed'].includes(status)
                                              ? 'border-destructive/50 text-destructive'
                                              : 'text-muted-foreground',
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-4 w-4',
                                        status === 'running' && 'animate-spin',
                                    )}
                                    aria-hidden="true"
                                />
                            </div>
                            <div className="mt-3 break-anywhere text-[10px] font-medium sm:text-sm">
                                {stage.name}
                            </div>
                            <div className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
                                {stage.agent}
                            </div>
                            <div
                                className={cn(
                                    'mt-1 text-[10px] sm:text-xs',
                                    status === 'running'
                                        ? 'text-primary'
                                        : status === 'waiting'
                                          ? 'text-warning'
                                          : ['rejected', 'blocked', 'failed'].includes(status)
                                            ? 'text-destructive'
                                            : 'text-muted-foreground',
                                )}
                            >
                                {index === 3 && pipeline?.reviewDecision?.outcome === 'REQUEST_CHANGES'
                                    ? 'Changes requested'
                                    : STATUS[status]}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
