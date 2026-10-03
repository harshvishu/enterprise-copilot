import React from 'react';
import {
    FileSearch,
    Code2,
    ShieldCheck,
    LockKeyhole,
    ChevronDown,
    GitPullRequest,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { readable } from '@/lib/pipeline';
import DiffViewer from './DiffViewer';

export default function WorkspaceViews({ nav, pipelines, github, pipeline, audit, status }) {
    if (nav === 'issues')
        return (
            <section className="py-7">
                <ViewHeading title="Issues" count={pipelines.length} />
                {pipelines.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b text-muted-foreground">
                                <tr>
                                    <th className="py-3 font-normal">Work item</th>
                                    <th className="hidden py-3 font-normal sm:table-cell">
                                        Execution
                                    </th>
                                    <th className="py-3 text-right font-normal">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pipelines.map((item) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="py-4 pr-4">
                                            <div className="font-mono text-[11px] text-muted-foreground">
                                                {item.ticket.key}
                                            </div>
                                            <div className="mt-1 font-medium">
                                                {item.ticket.title}
                                            </div>
                                        </td>
                                        <td className="hidden py-4 pr-4 text-muted-foreground sm:table-cell">
                                            {item.aiMode === 'DEMO'
                                                ? readable(item.scenario)
                                                : 'Live model'}
                                        </td>
                                        <td className="py-4 text-right text-muted-foreground">
                                            {readable(item.state)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Empty>No work items yet.</Empty>
                )}
            </section>
        );
    if (nav === 'agents') {
        const agents = [
            { name: 'Rhea', role: 'Requirements analyst', icon: FileSearch },
            { name: 'Nova', role: 'Code proposal', icon: Code2 },
            { name: 'Sentinel', role: 'Security and compliance review', icon: ShieldCheck },
            { name: 'Atlas', role: 'Release authorization', icon: LockKeyhole },
        ];
        return (
            <section className="py-7">
                <ViewHeading title="Agents" count={4} />
                <div>
                    {agents.map((agent) => (
                        <div
                            key={agent.name}
                            className="flex flex-wrap items-center justify-between gap-3 border-b py-5"
                        >
                            <div className="flex items-center gap-4">
                                <agent.icon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <h3 className="text-sm font-medium">{agent.name}</h3>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {agent.role}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {agent.name === 'Atlas'
                                    ? 'Deterministic Java gates'
                                    : status?.aiMode === 'LIVE'
                                      ? 'Spring AI model'
                                      : 'Deterministic preview'}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        );
    }
    if (nav === 'pulls')
        return (
            <section className="min-w-0 py-7">
                <ViewHeading title="Pull Requests" />
                {github?.pullRequest ? (
                    <>
                        <div className="mb-5 flex items-center gap-3">
                            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <h3 className="text-sm font-medium">{github.pullRequest.title}</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {github.pullRequest.number} /{' '}
                                    {readable(github.pullRequest.state)} / Simulated
                                </p>
                            </div>
                        </div>
                        <DiffViewer key={pipeline?.id} diff={github.pullRequest.diff} defaultOpen />
                    </>
                ) : (
                    <Empty>No pull request proposal yet.</Empty>
                )}
            </section>
        );
    if (nav === 'deployments')
        return (
            <section className="py-7">
                <ViewHeading title="Deployments" />
                <div className="border-b pb-6">
                    <p className="text-base font-medium">
                        {pipeline ? readable(pipeline.state) : 'No deployment yet'}
                    </p>
                    {pipeline?.deploymentDecision && (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                            {pipeline.deploymentDecision.summary}
                        </p>
                    )}
                    {pipeline && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            {pipeline.ticket.key} / Simulated deployment
                        </p>
                    )}
                </div>
            </section>
        );
    if (nav === 'audit')
        return (
            <section className="py-7">
                <ViewHeading title="Audit Trail" count={audit.length} />
                {audit.length ? (
                    <div>
                        {audit.map((event) => (
                            <Collapsible key={event.id} className="border-b py-4">
                                <CollapsibleTrigger className="group flex w-full items-start justify-between gap-3 text-left">
                                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:gap-5">
                                        <time className="shrink-0 text-[11px] tabular-nums text-muted-foreground sm:w-20">
                                            {new Date(event.createdAt).toLocaleTimeString()}
                                        </time>
                                        <div className="min-w-0">
                                            <h3 className="text-xs font-medium">
                                                {readable(event.action)}
                                            </h3>
                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                {event.agent}
                                                {event.decision
                                                    ? ` / ${readable(event.decision)}`
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="mt-3 space-y-2 sm:ml-[100px]">
                                        {event.policyOutcome && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] font-normal text-muted-foreground"
                                            >
                                                {readable(event.policyOutcome)}
                                            </Badge>
                                        )}
                                        {event.detail && (
                                            <p className="whitespace-pre-line break-anywhere text-xs leading-5 text-muted-foreground">
                                                {event.detail}
                                            </p>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>
                ) : (
                    <Empty>No audit records for this pipeline.</Empty>
                )}
            </section>
        );
    return null;
}

function ViewHeading({ title, count }) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <h2 className="text-base font-semibold">{title}</h2>
            {count !== undefined && (
                <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
            )}
        </div>
    );
}

function Empty({ children }) {
    return <p className="border-b py-8 text-sm text-muted-foreground">{children}</p>;
}
