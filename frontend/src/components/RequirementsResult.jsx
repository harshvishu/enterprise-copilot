import React, { useState } from 'react';
import { ChevronDown, FileSearch, Loader2, UserRound, ArrowRight } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { agentProgress, modelLabel, splitClarification } from '@/lib/pipeline';
import { cn } from '@/lib/utils';
import AgentProgress from './AgentProgress';

export default function RequirementsResult({ pipeline, pending, onClarify, events, status }) {
    const analysis = pipeline?.requirementAnalysis;
    const awaiting =
        pipeline?.state === 'REQUIREMENTS_READY' && analysis?.clarificationQuestions?.length > 0;
    const progress = agentProgress(events, 'Rhea');
    const running = pipeline?.state === 'ANALYZING_REQUIREMENTS';
    const failed = !analysis && progress.failed;
    const text = splitClarification(analysis?.summary);
    return (
        <section id="requirements" className="scroll-mt-6 border-b">
            <Collapsible
                key={`${pipeline?.id}-${Boolean(awaiting)}-${Boolean(pipeline?.codeChangeSet)}-${running}-${failed}`}
                open={awaiting ? true : undefined}
                defaultOpen={Boolean(
                    awaiting || running || failed || (analysis && !pipeline?.codeChangeSet),
                )}
            >
                <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 py-5 text-left">
                    <div className="flex min-w-0 items-center gap-3">
                        <FileSearch
                            className={cn(
                                'h-4 w-4 shrink-0',
                                running ? 'text-primary' : 'text-muted-foreground',
                            )}
                        />
                        <h2 className="text-sm font-medium">
                            Requirements{' '}
                            <span className="ml-3 text-xs font-normal text-muted-foreground">
                                Rhea
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
                            {awaiting
                                ? 'Human input needed'
                                : running
                                  ? 'Analyzing'
                                  : failed
                                    ? 'Stopped'
                                  : text.clarification
                                    ? 'Human clarified'
                                    : analysis
                                      ? `${analysis.acceptanceCriteria?.length || 0} acceptance criteria`
                                      : 'Not started'}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pb-6">
                    {!analysis ? (
                        running || failed ? (
                            progress.steps.length ? (
                                <AgentProgress progress={progress} modelLabel={modelLabel(status)} />
                            ) : (
                                <div className="space-y-3">
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Rhea is starting...
                                    </p>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            )
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Awaiting requirement analysis.
                            </p>
                        )
                    ) : (
                        <>
                            <p className="max-w-4xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
                                {text.summary}
                            </p>
                            {awaiting && (
                                <ClarificationForm
                                    key={pipeline.id}
                                    questions={analysis.clarificationQuestions}
                                    pending={pending}
                                    onSubmit={onClarify}
                                />
                            )}
                            <div className="mt-5 grid gap-6 md:grid-cols-2">
                                <ResultList
                                    title="Acceptance criteria"
                                    items={analysis.acceptanceCriteria}
                                />
                                <ResultList
                                    title="Compliance concerns"
                                    items={analysis.complianceConcerns}
                                />
                            </div>
                            {text.clarification && (
                                <div className="mt-6 border-l-2 border-primary/40 pl-4">
                                    <h3 className="flex items-center gap-2 text-sm font-medium">
                                        <UserRound className="h-4 w-4 text-primary" />
                                        Human clarification
                                    </h3>
                                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                                        {text.clarification}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </section>
    );
}

function ResultList({ title, items }) {
    if (!items?.length) return null;
    return (
        <div>
            <h3 className="mb-2 text-xs font-medium">{title}</h3>
            <ul className="space-y-2">
                {items.map((item, index) => (
                    <li key={index} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function ClarificationForm({ questions, pending, onSubmit }) {
    const [answers, setAnswers] = useState(() => questions.map(() => ''));
    return (
        <form
            id="clarification"
            className="mt-6 scroll-mt-6 border-t pt-5"
            onSubmit={(event) => {
                event.preventDefault();
                if (!pending && answers.every((answer) => answer.trim())) onSubmit(answers);
            }}
        >
            <h3 className="mb-4 text-sm font-medium text-warning">Rhea needs clarification</h3>
            <div className="space-y-4">
                {questions.map((question, index) => (
                    <div key={index}>
                        <Label htmlFor={`answer-${index}`} className="text-xs leading-5">
                            {question}
                        </Label>
                        <Textarea
                            id={`answer-${index}`}
                            disabled={pending}
                            required
                            value={answers[index]}
                            onChange={(event) =>
                                setAnswers((previous) =>
                                    previous.map((answer, answerIndex) =>
                                        answerIndex === index ? event.target.value : answer,
                                    ),
                                )
                            }
                            className="mt-2 min-h-20 resize-y bg-card"
                        />
                    </div>
                ))}
            </div>
            <Button
                type="submit"
                className="mt-5"
                disabled={pending || answers.some((answer) => !answer.trim())}
            >
                {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                {pending ? 'Submitting clarification...' : 'Submit clarification'}
            </Button>
        </form>
    );
}
