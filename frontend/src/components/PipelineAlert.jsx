import React from 'react';
import {
    ShieldAlert,
    MessageSquareText,
    Rocket,
    CircleAlert,
    CheckCircle2,
    ArrowDown,
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { pipelineAttention, readable } from '@/lib/pipeline';
import { cn } from '@/lib/utils';

const ICONS = {
    review: ShieldAlert,
    clarification: MessageSquareText,
    release: Rocket,
    failure: CircleAlert,
    complete: CheckCircle2,
};

export default function PipelineAlert({ pipeline, events, error }) {
    const attention = pipelineAttention(pipeline, events);
    return (
        <div aria-live="polite" className="space-y-3">
            {error && (
                <Alert className="border-destructive/30 bg-card">
                    <CircleAlert className="h-4 w-4 text-destructive" />
                    <AlertTitle>Request could not complete</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                        {error.status
                            ? 'The application could not accept this action.'
                            : 'The application could not be reached. Check your connection and the backend.'}
                        <TechnicalDetail detail={error.message || String(error)} />
                    </AlertDescription>
                </Alert>
            )}
            {attention &&
                (() => {
                    const Icon = ICONS[attention.icon];
                    return (
                        <Alert
                            className={cn(
                                'motion-enter bg-card',
                                attention.tone === 'destructive'
                                    ? 'border-destructive/30'
                                    : attention.tone === 'warning'
                                      ? 'border-warning/30'
                                      : 'border-success/30',
                            )}
                        >
                            <Icon
                                className={cn(
                                    'h-4 w-4',
                                    attention.tone === 'destructive'
                                        ? 'text-destructive'
                                        : attention.tone === 'warning'
                                          ? 'text-warning'
                                          : 'text-success',
                                )}
                            />
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                <div className="min-w-0">
                                    <AlertTitle className="text-base">{attention.title}</AlertTitle>
                                    <AlertDescription className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                                        {attention.description}
                                    </AlertDescription>
                                    {attention.counts && (
                                        <div className="mt-3 flex flex-wrap gap-4 text-xs">
                                            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
                                                .filter((level) => attention.counts[level])
                                                .map((level) => (
                                                    <span
                                                        key={level}
                                                        className={
                                                            level === 'CRITICAL'
                                                                ? 'text-destructive'
                                                                : 'text-muted-foreground'
                                                        }
                                                    >
                                                        {attention.counts[level]} {readable(level)}
                                                    </span>
                                                ))}
                                        </div>
                                    )}
                                    <TechnicalDetail detail={attention.detail} />
                                </div>
                                {attention.action && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0 self-start"
                                        onClick={() =>
                                            document
                                                .getElementById(attention.target)
                                                ?.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'start',
                                                })
                                        }
                                    >
                                        {attention.action}
                                        <ArrowDown />
                                    </Button>
                                )}
                            </div>
                        </Alert>
                    );
                })()}
        </div>
    );
}

function TechnicalDetail({ detail }) {
    if (!detail) return null;
    return (
        <Collapsible className="mt-2">
            <CollapsibleTrigger className="text-xs text-muted-foreground underline underline-offset-4">
                Technical details
            </CollapsibleTrigger>
            <CollapsibleContent>
                <p className="mt-2 break-anywhere text-xs leading-relaxed text-muted-foreground">
                    {detail}
                </p>
            </CollapsibleContent>
        </Collapsible>
    );
}
