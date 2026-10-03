import React, { useEffect, useRef, useState } from 'react';
import {
    Activity,
    FileSearch,
    Code2,
    ShieldCheck,
    LockKeyhole,
    UserRound,
    CircleDot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { GATE_LABELS } from '@/lib/pipeline';
import { cn } from '@/lib/utils';

const ICONS = {
    Rhea: FileSearch,
    Nova: Code2,
    Sentinel: ShieldCheck,
    Atlas: LockKeyhole,
    Human: UserRound,
    System: CircleDot,
};
const LABELS = {
    PIPELINE_STARTED: 'Pipeline started',
    AGENT_STARTED: 'Started',
    AGENT_THINKING: 'Step',
    TOOL_INVOKED: 'Reference consulted',
    AGENT_COMPLETED: 'Assessment complete',
    FINDING_CREATED: 'Finding identified',
    GATE_BLOCKED: 'Gate blocked',
    GATE_EVALUATED: 'Gate evaluated',
    APPROVAL_REQUIRED: 'Approval needed',
    APPROVAL_GRANTED: 'Human approved',
    APPROVAL_REJECTED: 'Human rejected',
    DEPLOYMENT_STARTED: 'Deployment started',
    DEPLOYMENT_COMPLETED: 'Deployment complete',
    PIPELINE_COMPLETED: 'Pipeline complete',
    PIPELINE_FAILED: 'Execution stopped',
};

export default function AgentActivity({ events = [] }) {
    const [open, setOpen] = useState(false);
    const endRef = useRef(null);
    useEffect(() => {
        if (open) endRef.current?.scrollIntoView({ block: 'nearest' });
    }, [events.length, open]);
    const groups = events.reduce((result, event) => {
        const last = result[result.length - 1];
        if (last?.agent === event.agent) last.events.push(event);
        else result.push({ agent: event.agent, events: [event] });
        return result;
    }, []);
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                    <Activity />
                    Activity
                    <span className="min-w-4 text-center tabular-nums text-muted-foreground">
                        {events.length}
                    </span>
                </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
                <SheetHeader className="border-b p-6 text-left">
                    <SheetTitle className="text-base">Pipeline activity</SheetTitle>
                    <SheetDescription>{events.length} events recorded</SheetDescription>
                </SheetHeader>
                <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-7 p-6">
                        {!groups.length && (
                            <p className="text-sm text-muted-foreground">
                                No activity recorded yet.
                            </p>
                        )}
                        {groups.map((group, groupIndex) => {
                            const Icon = ICONS[group.agent] || CircleDot;
                            return (
                                <section key={groupIndex}>
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                        {group.agent}
                                    </h3>
                                    <ol className="ml-2 space-y-4 border-l pl-5">
                                        {group.events.map((event, index) => (
                                            <li key={index} className="relative">
                                                <span
                                                    className={cn(
                                                        'absolute -left-[25px] top-1 h-2 w-2 rounded-full border border-background',
                                                        [
                                                            'GATE_BLOCKED',
                                                            'PIPELINE_FAILED',
                                                        ].includes(event.type) ||
                                                            event.data?.severity === 'CRITICAL'
                                                            ? 'bg-destructive'
                                                            : event.type === 'APPROVAL_REQUIRED'
                                                              ? 'bg-warning'
                                                              : 'bg-muted-foreground/50',
                                                    )}
                                                />
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="text-xs font-medium">
                                                                {LABELS[event.type] ||
                                                                    'Activity recorded'}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="font-mono text-[10px]">
                                                            {event.type}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <time className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                                                        {new Date(
                                                            event.timestamp,
                                                        ).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                        })}
                                                    </time>
                                                </div>
                                                <p className="break-anywhere text-xs leading-5 text-muted-foreground">
                                                    {event.type === 'GATE_EVALUATED'
                                                        ? `${GATE_LABELS[event.data?.gate] || event.data?.gate}: ${
                                                              event.data?.waiting
                                                                  ? 'waiting for a human'
                                                                  : event.data?.passed
                                                                    ? 'passed'
                                                                    : 'failed'
                                                          }`
                                                        : event.message}
                                                </p>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            );
                        })}
                        <div ref={endRef} />
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
