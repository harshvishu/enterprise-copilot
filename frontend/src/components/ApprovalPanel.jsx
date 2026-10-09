import React from 'react';
import { Check, X, Clock3, LockKeyhole, Loader2, Rocket, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    severityCounts,
    GATE_LABELS,
    gateResults,
    revalidation,
    hasProposedTests,
    hasPassingTestSignal,
} from '@/lib/pipeline';
import { cn } from '@/lib/utils';
import AgentActivity from './AgentActivity';

export default function ApprovalPanel({ pipeline, actionPipeline = pipeline, activity, onApprove, onReject, onMerge, pending, action, events }) {
    const repository = pipeline?.repositoryExecution;
    const tests = repository?.testRun;
    const waiting = pipeline?.state === 'WAITING_FOR_APPROVAL';
    const deployed = pipeline?.state === 'DEPLOYED';
    const blocked = ['BLOCKED', 'REVIEW_FAILED'].includes(pipeline?.state);
    const failed = pipeline?.state === 'FAILED';
    const evaluating =
        !pipeline?.deploymentDecision &&
        ['REVIEW_PASSED', 'REVIEW_FAILED'].includes(pipeline?.state);
    const evaluated = gateResults(events);
    const recheck = revalidation(events);
    const counts = severityCounts(pipeline?.reviewDecision);
    const snapshotGates = [
        {
            id: 'REQUIREMENTS_RESOLVED',
            label: GATE_LABELS.REQUIREMENTS_RESOLVED,
            passed: Boolean(
                pipeline?.requirementAnalysis &&
                    !pipeline.requirementAnalysis.clarificationQuestions?.length,
            ),
            known: Boolean(
                pipeline?.requirementAnalysis &&
                    !pipeline.requirementAnalysis.clarificationQuestions?.length,
            ),
            waiting: Boolean(pipeline?.requirementAnalysis?.clarificationQuestions?.length),
        },
        {
            id: 'CODE_PROPOSAL_PRESENT',
            label: GATE_LABELS.CODE_PROPOSAL_PRESENT,
            passed: Boolean(
                pipeline?.codeChangeSet?.files?.length &&
                    pipeline.codeChangeSet.unifiedDiff?.trim(),
            ),
            known: Boolean(pipeline?.deploymentDecision || pipeline?.codeChangeSet),
        },
        {
            id: 'REVIEW_APPROVED',
            label: GATE_LABELS.REVIEW_APPROVED,
            passed: pipeline?.reviewDecision?.outcome === 'APPROVE',
            known: Boolean(pipeline?.reviewDecision),
        },
        {
            id: 'NO_CRITICAL_FINDINGS',
            label: counts.CRITICAL
                ? `${counts.CRITICAL} unresolved critical finding${counts.CRITICAL > 1 ? 's' : ''}`
                : GATE_LABELS.NO_CRITICAL_FINDINGS,
            passed: !counts.CRITICAL,
            known: Boolean(pipeline?.reviewDecision),
        },
        {
            id: 'TESTS_PASS',
            label:
                repository ? 'Actual pytest passed for this candidate'
                : pipeline?.codeChangeSet && !hasProposedTests(pipeline.codeChangeSet)
                    ? 'Test signal not evaluated: no valid proposed tests'
                    : GATE_LABELS.TESTS_PASS,
            passed: repository ? Boolean(tests && !tests.timedOut && tests.exitCode === 0 && tests.collected > tests.skipped && tests.failures === 0 && tests.errors === 0 && tests.commit === repository.candidateCommit) : hasPassingTestSignal(pipeline?.codeChangeSet),
            known: repository ? Boolean(tests) : Boolean(pipeline?.codeChangeSet),
        },
    ];
    // While Atlas runs, reveal each gate only once its deterministic result has been published.
    const gates = evaluating
        ? snapshotGates.map((gate) =>
              evaluated[gate.id]
                  ? { ...gate, passed: evaluated[gate.id].passed, known: true, waiting: false }
                  : { ...gate, known: false, waiting: false },
          )
        : snapshotGates;
    const approvalRequested =
        pipeline?.approvalState === 'PENDING' || Boolean(evaluated.HUMAN_APPROVAL?.waiting);
    return (
        <section id="release" className="scroll-mt-6 min-w-0">
            <Collapsible key={pipeline?.id} defaultOpen>
                <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 py-5 text-left">
                    <div className="flex min-w-0 items-center gap-3">
                        <Rocket className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <h2 className="text-sm font-medium">
                            Release decision{' '}
                            <span className="ml-3 text-xs font-normal text-muted-foreground">Atlas</span>
                        </h2>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                </CollapsibleTrigger>
                <CollapsibleContent className="min-w-0 pb-6">
                    <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <LockKeyhole className="h-3.5 w-3.5" />
                        Deterministic Java rules · no model call
                    </div>
                    {activity && <AgentActivity {...activity} />}
                    <h3
                        data-result-for="Atlas"
                        className={cn(
                            'flex items-center gap-2 text-sm font-medium',
                            deployed
                                ? 'text-success'
                                : blocked || failed
                                  ? 'text-destructive'
                                  : waiting
                                    ? 'text-warning'
                                    : 'text-foreground',
                        )}
                    >
                        {deployed ? (
                            <Check className="h-4 w-4" />
                        ) : blocked || failed ? (
                            <X className="h-4 w-4" />
                        ) : waiting ? (
                            <Clock3 className="h-4 w-4" />
                        ) : (
                            <Rocket className="h-4 w-4 text-muted-foreground" />
                        )}
                        {deployed
                            ? repository ? repository.mergedCommit ? 'Changes merged locally' : 'Changes approved · local merge available' : 'Simulated deployment completed'
                            : blocked
                              ? 'Deployment blocked'
                              : failed
                                ? 'Execution stopped'
                                : waiting
                                  ? 'Ready for approval'
                                  : pipeline?.state === 'DEPLOYING'
                                    ? 'Deploying...'
                                    : evaluating
                                      ? 'Evaluating release gates...'
                                      : 'Awaiting assessment'}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {deployed
                            ? repository ? 'Deployment is simulated. Local merging requires the separate action below; the workshop baseline stays untouched.' : 'Simulated deployment authorized by human approval.'
                            : waiting
                              ? 'Technical gates passed. Your approval is required.'
                              : blocked
                                ? 'The system will not authorize this change.'
                                : failed
                                  ? 'Resolve the execution error before starting a new pipeline.'
                                  : 'Atlas evaluates the proposal after Sentinel finishes.'}
                    </p>
                    {actionPipeline?.state === 'WAITING_FOR_APPROVAL' && (
                        <div data-human-controls className="mt-5 max-w-sm space-y-2">
                            {!waiting && <p className="text-xs text-warning">Human approval is available while the recorded steps are presented.</p>}
                            <Button className="w-full" onClick={onApprove} disabled={pending}>
                                {pending && action === 'approve' ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Check />
                                )}
                                {pending && action === 'approve' ? 'Approving...' : repository ? 'Approve candidate changes' : 'Approve deployment'}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full text-destructive hover:text-destructive"
                                onClick={onReject}
                                disabled={pending}
                            >
                                {pending && action === 'reject' ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <X />
                                )}
                                {pending && action === 'reject' ? 'Rejecting...' : 'Reject'}
                            </Button>
                        </div>
                    )}
                    {actionPipeline?.repositoryExecution?.approvedCommit && actionPipeline.approvalState === 'APPROVED' && !actionPipeline.repositoryExecution.mergedCommit && <div data-human-controls className="mt-5 max-w-sm space-y-2">
                        <p className="break-anywhere font-mono text-xs">Approved commit: {actionPipeline.repositoryExecution.approvedCommit}</p>
                        <Button variant="outline" className="w-full" disabled={pending} onClick={onMerge}>{action === 'merge' ? 'Merging...' : 'Merge approved commit locally'}</Button>
                        <p className="text-xs text-muted-foreground">Fast-forward the separate integration clone only. No remote push or production deployment.</p>
                    </div>}
                    <Separator className="my-5" />
                    <h4 className="mb-3 text-xs font-medium">Release gates</h4>
                    <p className="mb-3 text-xs leading-5 text-muted-foreground">
                        {repository ? 'Atlas uses the server-recorded pytest result and requires Sentinel review of the same candidate commit.' : 'The test signal is simulated/model-provided. Generated tests are not executed.'}
                    </p>
                    <ul className="space-y-3">
                        {gates.map((gate) => (
                            <li key={gate.id} className="flex items-start gap-2.5 text-xs leading-5">
                                {gate.passed && gate.known ? (
                                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                                ) : gate.known ? (
                                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                                ) : (
                                    <Clock3
                                        className={cn(
                                            'mt-0.5 h-3.5 w-3.5 shrink-0',
                                            gate.waiting ? 'text-warning' : 'text-muted-foreground/50',
                                        )}
                                    />
                                )}
                                <span
                                    className={
                                        gate.known && !gate.passed
                                            ? 'text-foreground'
                                            : 'text-muted-foreground'
                                    }
                                >
                                    {gate.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Separator className="my-5" />
                    <h4 className="mb-3 text-xs font-medium">Human authorization</h4>
                    <ul className="space-y-3">
                        <StatusLine
                            status={
                                pipeline?.approvalState === 'APPROVED'
                                    ? 'passed'
                                    : pipeline?.approvalState === 'REJECTED'
                                      ? 'failed'
                                      : approvalRequested
                                        ? 'waiting'
                                        : 'pending'
                            }
                            label={
                                pipeline?.approvalState === 'APPROVED'
                                    ? 'Human approval granted'
                                    : pipeline?.approvalState === 'REJECTED'
                                      ? 'Rejected by a human'
                                      : approvalRequested
                                        ? 'Human approval required'
                                        : 'Requested after all release gates pass'
                            }
                        />
                        {recheck && (
                            <StatusLine
                                status={recheck === 'running' ? 'current' : recheck}
                                label={
                                    recheck === 'running'
                                        ? 'Re-validating release gates...'
                                        : recheck === 'passed'
                                          ? 'All release gates satisfied'
                                          : 'Release gates blocked deployment'
                                }
                            />
                        )}
                    </ul>
                    {pipeline?.deploymentDecision?.blockingReasons?.length > 0 &&
                        blocked &&
                        pipeline.approvalState !== 'REJECTED' && (
                            <div className="mt-5 border-t pt-4">
                                <h4 className="mb-2 text-xs font-medium">Blocking reasons</h4>
                                <ul className="space-y-2">
                                    {pipeline.deploymentDecision.blockingReasons.map((reason, index) => (
                                        <li key={index} className="text-xs leading-5 text-muted-foreground">
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                </CollapsibleContent>
            </Collapsible>
        </section>
    );
}

function StatusLine({ status, label }) {
    return (
        <li className="flex items-start gap-2.5 text-xs leading-5">
            <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                {status === 'passed' ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                ) : status === 'failed' ? (
                    <X className="h-3.5 w-3.5 text-destructive" />
                ) : status === 'current' ? (
                    <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/15" />
                ) : (
                    <Clock3
                        className={cn(
                            'h-3.5 w-3.5',
                            status === 'waiting' ? 'text-warning' : 'text-muted-foreground/50',
                        )}
                    />
                )}
            </span>
            <span
                className={
                    status === 'current' || status === 'waiting'
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                }
            >
                {label}
            </span>
        </li>
    );
}
