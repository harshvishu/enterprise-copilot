import React from 'react';
import { Code2, ChevronDown, FileCode2, FlaskConical, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { agentProgress, modelLabel } from '@/lib/pipeline';
import { cn } from '@/lib/utils';
import AgentProgress from './AgentProgress';
import DiffViewer from './DiffViewer';
import AgentActivity from './AgentActivity';

export default function CodeProposal({ pipeline, events, status, activity }) {
    const proposal = pipeline?.codeChangeSet;
    const repository = pipeline?.repositoryExecution;
    const tests = repository?.testRun;
    const running = pipeline?.state === 'GENERATING_CODE';
    const progress = agentProgress(events, 'Nova');
    const failed = !proposal && progress.failed;
    return (
        <section className="min-w-0 border-b">
            <Collapsible
                key={pipeline?.id}
                defaultOpen
            >
                <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 py-5 text-left">
                    <div className="flex min-w-0 items-center gap-3">
                        <Code2
                            className={cn(
                                'h-4 w-4 shrink-0',
                                running ? 'text-primary' : 'text-muted-foreground',
                            )}
                        />
                        <h2 className="text-sm font-medium">
                            {repository ? 'Code changes' : 'Code proposal'}{' '}
                            <span className="ml-3 text-xs font-normal text-muted-foreground">
                                Nova
                            </span>
                        </h2>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <span
                            className={cn(
                                'hidden text-xs sm:inline',
                                running ? 'text-primary' : 'text-muted-foreground',
                            )}
                        >
                            {running
                                ? 'Generating'
                                : failed
                                  ? 'Stopped'
                                  : proposal
                                    ? repository ? `${proposal.files?.length || 0} files · pytest exit ${tests?.exitCode ?? 'pending'}` : `${proposal.files?.length || 0} files / ${proposal.tests?.length || 0} tests proposed`
                                    : 'Not started'}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="min-w-0 pb-6">
                    {activity && <AgentActivity {...activity} />}
                    {!proposal ? (
                        activity?.entries.length ? null : running || failed ? (
                            progress.steps.length ? (
                                <AgentProgress
                                    progress={progress}
                                    modelLabel={modelLabel(status)}
                                />
                            ) : (
                                <div className="space-y-3">
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Nova is starting...
                                    </p>
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            )
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Awaiting clarified requirements.
                            </p>
                        )
                    ) : (
                        <div data-result-for="Nova">
                            <p className="text-sm leading-6 text-muted-foreground">
                                {proposal.explanation}
                            </p>
                            <div className="my-5 grid gap-5 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-3 flex items-center gap-2 text-xs font-medium">
                                        <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        Files changed
                                    </h3>
                                    <ul className="space-y-2">
                                        {proposal.files?.map((file) => (
                                            <li
                                                key={file.path}
                                                className="break-anywhere font-mono text-[11px] leading-5 text-muted-foreground"
                                            >
                                                {file.path}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="mb-3 flex items-center gap-2 text-xs font-medium">
                                        <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
                                        Tests proposed
                                    </h3>
                                    <ul className="space-y-2">
                                        {proposal.tests?.map((test, index) => (
                                            <li
                                                key={index}
                                                className="break-anywhere text-xs leading-5 text-muted-foreground"
                                            >
                                                {test}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {repository?.candidateCommit && <p className="mb-3 break-anywhere font-mono text-xs text-muted-foreground">
                                {repository.branch} · candidate {repository.candidateCommit} · base {repository.baseCommit}
                            </p>}
                            <DiffViewer diff={proposal.unifiedDiff} defaultOpen={Boolean(repository)} label={repository ? 'Actual Git diff' : 'Proposed diff'} />
                            {tests && <div className="mt-5 space-y-2" aria-label="Actual pytest results">
                                <h3 className="text-sm font-medium">Actual pytest results</h3>
                                <p className="text-xs text-muted-foreground">{tests.collected} tests · {tests.failures} failures · {tests.errors} errors · {tests.skipped} skipped · exit {tests.exitCode} · {(tests.durationMs / 1000).toFixed(1)}s{tests.timedOut ? ' · TIMED OUT' : ''}</p>
                                <p className="break-anywhere font-mono text-xs">{tests.command}</p>
                                <pre className="max-h-80 overflow-auto rounded-md border p-3 text-xs leading-5 whitespace-pre-wrap">{tests.stdout}{tests.stderr && `\n${tests.stderr}`}</pre>
                            </div>}
                        </div>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </section>
    );
}
