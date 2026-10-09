import React, { useState } from 'react';
import { Menu, Play, Loader2, Settings } from 'lucide-react';
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
import { ACTIVE_STATES, usedFallback } from '@/lib/pipeline';
import Sidebar from './Sidebar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
    DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

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
    presentationPace,
    onPresentationPace,
    followLatest,
    onFollowLatest,
    executeRepository,
    onExecuteRepository,
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Presentation settings" title="Presentation settings">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72">
                        <DropdownMenuLabel>Presentation settings</DropdownMenuLabel>
                        <div className="space-y-2 px-2 py-2">
                            <label className="block space-y-2 text-sm">
                                <span>Execution target for the next run</span>
                                <select aria-label="Execution target" value={executeRepository && status?.aiMode === 'LIVE' ? 'repository' : 'proposal'}
                                    onChange={(event) => onExecuteRepository(event.target.value === 'repository')}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-foreground">
                                    <option value="proposal">Proposal only (existing scenarios)</option>
                                    <option value="repository" disabled={status?.aiMode !== 'LIVE'}>Ubuntu Bank · real Git and pytest</option>
                                </select>
                            </label>
                            <p className="text-xs text-muted-foreground">Repository execution requires OpenAI or Ollama and a configured Python environment. Each run uses an isolated clone.</p>
                            <label className="block space-y-2 text-sm">
                                <span>Presentation pace</span>
                                <select aria-label="Presentation pace" value={presentationPace}
                                    onChange={(event) => onPresentationPace(Number(event.target.value))}
                                    onKeyDown={(event) => {
                                        if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation();
                                    }}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-foreground">
                                    <option value={0}>Normal speed (no delay)</option>
                                    <option value={3}>3 seconds per step</option>
                                    <option value={3.5}>3.5 seconds per step</option>
                                    <option value={4}>4 seconds per step</option>
                                    <option value={5}>5 seconds per step</option>
                                    <option value={10}>10 seconds per step</option>
                                </select>
                            </label>
                            <p className="text-xs leading-5 text-muted-foreground">Paces the steps and results in each agent section. Execution and human actions continue normally.</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={followLatest} onCheckedChange={onFollowLatest}>
                            Follow latest output
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
                    {usedFallback(events) && (
                        <Badge
                            variant="outline"
                            className="rounded-md border-warning px-2 py-1 text-[10px] font-normal text-warning"
                        >
                            Fallback to DEMO
                        </Badge>
                    )}
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
