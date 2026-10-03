import React, { useState } from 'react';
import { Menu, Play, Loader2, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ACTIVE_STATES, readable } from '@/lib/pipeline';
import Sidebar from './Sidebar';
import AgentActivity from './AgentActivity';

export default function PageHeader({
    pipeline,
    status,
    scenario,
    onScenarioChange,
    onRun,
    pending,
    action,
    events,
    nav,
    onNavigate,
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const running =
        ACTIVE_STATES.includes(pipeline?.state) ||
        (pipeline?.state === 'REQUIREMENTS_READY' &&
            !pipeline?.requirementAnalysis?.clarificationQuestions?.length);
    const provider =
        status?.provider === 'OPENAI'
            ? 'OpenAI'
            : status?.provider === 'OLLAMA'
              ? 'Ollama'
              : status?.provider === 'DEMO'
                ? 'Deterministic'
                : status?.provider;
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
                                onSelect={(next) => {
                                    onNavigate(next);
                                    setMenuOpen(false);
                                }}
                            />
                        </SheetContent>
                    </Sheet>
                    <span className="text-xs text-muted-foreground">Ubuntu Bank</span>
                    <span className="text-border">/</span>
                    <span className="font-mono text-xs">{pipeline?.ticket.key || 'UB-4821'}</span>
                </div>
                <AgentActivity events={events} />
            </div>
            <h1 className="max-w-4xl break-anywhere text-xl font-semibold leading-tight sm:text-2xl">
                {pipeline?.ticket.title || 'High Value Transaction Notification'}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Badge
                        variant="outline"
                        className="rounded-md border-border px-2 py-1 text-[10px] font-normal text-muted-foreground"
                    >
                        {!status
                            ? 'Connecting'
                            : `${status.aiMode === 'LIVE' ? 'LIVE' : 'DEMO'} · ${provider}`}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Delivery pipeline</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {status?.aiMode === 'DEMO' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pending || running}
                                    className="text-xs"
                                >
                                    {readable(scenario)}
                                    <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuRadioGroup
                                    value={scenario}
                                    onValueChange={onScenarioChange}
                                >
                                    {status.scenarios?.map((value) => (
                                        <DropdownMenuRadioItem key={value} value={value}>
                                            {readable(value)}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                                : 'Start a new pipeline for this work item'}
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </header>
    );
}
