import React, { useState } from 'react';
import { Menu, Play, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ACTIVE_STATES } from '@/lib/pipeline';
import Sidebar from './Sidebar';
import AgentActivity from './AgentActivity';

export default function PageHeader({
    pipeline,
    status,
    issue,
    onRun,
    pending,
    action,
    events,
    nav,
    onNavigate,
    onMode,
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const running =
        ACTIVE_STATES.includes(pipeline?.state) ||
        (pipeline?.state === 'REQUIREMENTS_READY' &&
            !pipeline?.requirementAnalysis?.clarificationQuestions?.length);
    const runMode = pipeline?.aiMode || status?.aiMode;
    const runProvider = runMode === 'DEMO' ? 'DEMO' : status?.liveProvider || status?.provider;
    const provider =
        runProvider === 'OPENAI'
            ? 'OpenAI'
            : runProvider === 'OLLAMA'
              ? 'Ollama'
              : runProvider === 'DEMO'
                ? 'Deterministic'
                : runProvider;
    return (
        <header className="pb-7 pt-6 sm:pt-9">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="-ml-2 lg:hidden"
                                aria-label="Open navigation"
                            >
                                <Menu />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <SheetTitle className="sr-only">Navigation</SheetTitle>
                            <SheetDescription className="sr-only">
                                Workspace navigation
                            </SheetDescription>
                            <Sidebar
                                active={nav}
                                status={status}
                                onMode={onMode}
                                pending={pending}
                                onSelect={(next) => {
                                    onNavigate(next);
                                    setMenuOpen(false);
                                }}
                            />
                        </SheetContent>
                    </Sheet>
                    <span className="text-xs text-muted-foreground">Ubuntu Bank</span>
                    <span className="text-border">/</span>
                    <span className="font-mono text-xs">
                        {pipeline?.ticket.key || issue?.key || 'UB-4821'}
                    </span>
                </div>
                <AgentActivity events={events} />
            </div>
            <h1 className="max-w-4xl break-anywhere text-xl font-semibold leading-tight sm:text-2xl">
                {pipeline?.ticket.title || issue?.title || 'High Value Transaction Notification'}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Badge
                        variant="outline"
                        className="rounded-md border-border px-2 py-1 text-[10px] font-normal text-muted-foreground"
                    >
                        {!status
                            ? 'Connecting'
                            : `${runMode === 'LIVE' ? 'LIVE' : 'DEMO'} · ${provider}`}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Delivery pipeline</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {issue && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => onNavigate('issues')}
                        >
                            <span className="font-mono text-muted-foreground">{issue.key}</span>
                            Change issue
                        </Button>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <Button
                                    size="sm"
                                    onClick={onRun}
                                    disabled={pending || running || !status}
                                >
                                    {running || action === 'run' ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <Play />
                                    )}
                                    {action === 'run'
                                        ? 'Starting...'
                                        : running
                                          ? 'Pipeline running'
                                          : 'Run pipeline'}
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {running
                                ? 'A pipeline is currently executing'
                                : `Run ${issue?.key || 'the selected issue'} through the pipeline`}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </header>
    );
}
