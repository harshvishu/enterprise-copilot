import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AgentProgress({ progress, modelLabel }) {
    if (!progress?.steps.length) return null;
    return (
        <div className="space-y-3">
            <ol aria-label="Agent activity" className="space-y-2.5">
                {progress.steps.map((step) => (
                    <li
                        key={step.key}
                        aria-current={step.status === 'current' ? 'step' : undefined}
                        className="flex items-start gap-2.5 text-xs leading-5"
                    >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                            {step.status === 'done' ? (
                                <Check className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : step.status === 'failed' ? (
                                <X className="h-3.5 w-3.5 text-destructive" />
                            ) : (
                                <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/15" />
                            )}
                        </span>
                        <span
                            className={cn(
                                step.status === 'done' && 'text-muted-foreground',
                                step.status === 'current' && 'font-medium text-foreground',
                                step.status === 'failed' && 'text-destructive',
                            )}
                        >
                            {step.label}
                            {step.status === 'current' && '...'}
                            {step.key === 'MODEL_CALL' && (
                                <span className="ml-2 font-normal text-muted-foreground">
                                    {modelLabel}
                                </span>
                            )}
                        </span>
                    </li>
                ))}
            </ol>
            {progress.failed && (
                <p className="text-xs text-destructive">
                    {/LIVE/.test(progress.failure)
                        ? 'Provider request failed. No deterministic response was substituted.'
                        : 'Execution stopped before this agent completed.'}
                </p>
            )}
        </div>
    );
}
