import React, { useLayoutEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2, ArrowRight, Check, Plus, History, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { agentProgress, modelLabel, readable, severityCounts } from '@/lib/pipeline';
import { cn } from '@/lib/utils';
import AgentProgress from './AgentProgress';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

const COLORS = {
    CRITICAL: 'border-l-destructive',
    HIGH: 'border-l-warning/70',
    MEDIUM: 'border-l-muted-foreground/60',
    LOW: 'border-l-border',
};

export default function Findings({ review, running = false, mode, events, status, pipeline, pending, onReviewFeedback, feedbackHistory = [] }) {
    const counts = severityCounts(review);
    const passed = review?.outcome === 'APPROVE';
    const progress = agentProgress(events, 'Sentinel');
    const failed = !review && progress.failed;
    const submittedFeedback = feedbackHistory
        .filter((record) => record.action === 'REVIEW_FEEDBACK' && record.detail)
        .map((record) => ({ id: record.id, text: record.detail, createdAt: record.createdAt }));
    if (pipeline?.reviewFeedback && !submittedFeedback.some((record) => record.text === pipeline.reviewFeedback)) {
        submittedFeedback.push({ id: 'latest', text: pipeline.reviewFeedback, createdAt: pipeline.updatedAt });
    }
    return (
        <section id="review" className="scroll-mt-6 min-w-0 py-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">
                    Review{' '}
                    <span
                        className={cn(
                            'ml-2 text-xs font-normal',
                            running ? 'text-primary' : 'text-muted-foreground',
                        )}
                    >
                        Sentinel
                    </span>
                </h2>
                <span className="text-xs text-muted-foreground">
                    {mode === 'DEMO' ? 'Deterministic preview' : 'Model assessment'}
                </span>
            </div>
            {!review ? (
                (running || failed) && progress.steps.length ? (
                    <AgentProgress progress={progress} modelLabel={modelLabel(status)} />
                ) : running ? (
                    <div className="space-y-3">
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sentinel is starting...
                        </p>
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-3/5" />
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Awaiting the code proposal.</p>
                )
            ) : (
                <>
                    <div
                        className={cn(
                            'mb-3 flex items-center gap-2 text-sm font-medium',
                            passed
                                ? 'text-success'
                                : review.outcome === 'REJECT'
                                  ? 'text-destructive'
                                  : 'text-warning',
                        )}
                    >
                        {passed ? (
                            <ShieldCheck className="h-4 w-4" />
                        ) : (
                            <ShieldAlert className="h-4 w-4" />
                        )}
                        {passed
                            ? 'Review passed'
                            : review.outcome === 'REJECT'
                              ? 'Review rejected'
                              : 'Changes requested'}
                    </div>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        {review.summary}
                    </p>
                    <div className="my-5 flex flex-wrap gap-4 text-xs">
                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
                            .filter((level) => counts[level])
                            .map((level) => (
                                <span
                                    key={level}
                                    className={
                                        level === 'CRITICAL'
                                            ? 'text-destructive'
                                            : 'text-muted-foreground'
                                    }
                                >
                                    <strong className="font-semibold">{counts[level]}</strong>{' '}
                                    {readable(level)}
                                </span>
                            ))}
                    </div>
                    <div className="space-y-3">
                        {(review.findings || []).map((finding, index) => (
                            <article
                                key={`${finding.file}-${index}`}
                                className={cn(
                                    'rounded-md border border-l-[3px] bg-card/40 p-4',
                                    COLORS[finding.severity] || COLORS.LOW,
                                )}
                            >
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'rounded-sm text-[10px] font-medium',
                                            finding.severity === 'CRITICAL'
                                                ? 'border-destructive/25 text-destructive'
                                                : finding.severity === 'HIGH'
                                                  ? 'text-warning'
                                                  : 'text-muted-foreground',
                                        )}
                                    >
                                        {readable(finding.severity)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {readable(finding.category)}
                                    </span>
                                </div>
                                <h3 className="text-sm font-medium leading-6">
                                    {finding.description}
                                </h3>
                                <p className="mt-2 break-anywhere font-mono text-[11px] leading-5 text-muted-foreground">
                                    {finding.file}
                                    <span className="mx-2 text-border">/</span>
                                    {finding.location}
                                </p>
                                <div className="mt-3 border-t pt-3">
                                    <span className="text-xs font-medium">Recommendation</span>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        {finding.recommendation}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                    {!review.findings?.length && (
                        <p className="mt-4 text-sm text-muted-foreground">No review findings.</p>
                    )}
                    {pipeline?.state === 'WAITING_FOR_REVIEW_FEEDBACK' && (
                        <ReviewFeedbackForm key={`${pipeline.id}-${pipeline.reviewFeedback || ''}`}
                            pending={pending} onSubmit={onReviewFeedback}
                            suggestions={reviewSuggestions(review.findings || [])} />
                    )}
                </>
            )}
            {submittedFeedback.length > 0 && (
                <Collapsible className="mt-5 border-t pt-4">
                    <CollapsibleTrigger className="group flex w-full items-center gap-2 text-left text-xs font-medium">
                        <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        Feedback history
                        <span className="text-muted-foreground">({submittedFeedback.length})</span>
                        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <ol className="mt-3 max-h-64 space-y-3 overflow-y-auto">
                            {[...submittedFeedback].sort((first, second) =>
                                new Date(second.createdAt) - new Date(first.createdAt)).map((record) => (
                                <li key={record.id} className="border-l-2 border-border pl-3">
                                    {record.createdAt && (
                                        <time dateTime={record.createdAt} className="text-[10px] text-muted-foreground">
                                            {new Date(record.createdAt).toLocaleString()}
                                        </time>
                                    )}
                                    <p className="mt-1 whitespace-pre-wrap break-anywhere text-xs leading-5 text-muted-foreground">
                                        {record.text}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </CollapsibleContent>
                </Collapsible>
            )}
        </section>
    );
}

function reviewSuggestions(findings) {
    const severity = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const seen = new Set();
    return [...findings]
        .sort((first, second) => (severity[second.severity] || 0) - (severity[first.severity] || 0))
        .filter((finding) => {
            const text = finding.recommendation?.trim();
            const key = text?.toLowerCase().replace(/\s+/g, ' ');
            if (!text || seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 3)
        .map((finding, index) => {
            const text = finding.recommendation.trim();
            const context = `${finding.description || ''} ${text}`;
            const title = text.length <= 42 ? text.replace(/[.!]+$/, '')
                : /consent/i.test(context) ? 'Improve consent checks'
                : /audit/i.test(context) && /reference|tracking|notification events/i.test(context) ? 'Audit notification outcomes'
                : /log/i.test(context) && /sensitive|private|mask|\bPII\b|customerId/i.test(context) ? 'Remove private data from logs'
                : /notification|message|sms/i.test(context) && /sensitive|private|mask|\bPII\b|account/i.test(context) ? 'Keep notifications generic'
                : /audit|log|reference/i.test(context) ? 'Improve audit tracing'
                : /mask|sensitive|private|\bPII\b/i.test(context) ? 'Protect private details'
                : `Address ${readable(finding.category || 'review').toLowerCase()} finding`;
            return { title, text, recommended: index === 0 };
        });
}

function suggestionPattern(text) {
    const pattern = text.trim().split(/\s+/)
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('\\s+');
    return new RegExp(pattern, 'i');
}

function ReviewFeedbackForm({ pending, onSubmit, suggestions }) {
    const [feedback, setFeedback] = useState('');
    const input = useRef(null);
    useLayoutEffect(() => {
        if (!input.current) return;
        input.current.style.height = 'auto';
        input.current.style.height = `${Math.min(288, Math.max(96, input.current.scrollHeight))}px`;
    }, [feedback]);

    function toggleSuggestion(text) {
        const pattern = suggestionPattern(text);
        setFeedback((previous) => pattern.test(previous)
            ? previous.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trim()
            : `${previous.trim()}${previous.trim() ? '\n\n' : ''}${text}`);
    }

    return (
        <form id="review-feedback" className="mt-5 border-t pt-5" onSubmit={(event) => {
            event.preventDefault();
            if (!pending && feedback.trim()) onSubmit(feedback);
        }}>
            <Label htmlFor="review-correction">What should Nova change?</Label>
            <Textarea id="review-correction" ref={input} rows={4} className="mt-2 min-h-24 resize-y leading-5"
                value={feedback} onChange={(event) => setFeedback(event.target.value)}
                required disabled={pending} />
            {suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Review feedback suggestions">
                    {[...suggestions].sort((first, second) => Number(Boolean(second.recommended)) - Number(Boolean(first.recommended)))
                        .map((suggestion) => {
                            const selected = suggestionPattern(suggestion.text).test(feedback);
                            return (
                                <Tooltip key={suggestion.text}>
                                    <TooltipTrigger asChild>
                                        <Button type="button" variant="outline" size="sm"
                                            aria-pressed={selected}
                                            aria-label={`${suggestion.title}${suggestion.recommended ? ' (recommended)' : ''}`}
                                            disabled={pending} onClick={() => toggleSuggestion(suggestion.text)}
                                            className={cn('h-auto min-h-9 max-w-full whitespace-normal text-left text-xs',
                                                selected && 'border-primary bg-primary/10 text-primary hover:bg-primary/15')}>
                                            {selected ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
                                            <span className="min-w-0 break-anywhere">{suggestion.title}</span>
                                            {suggestion.recommended && (
                                                <Badge variant="secondary" className="shrink-0 px-1.5 text-[9px]">Recommended</Badge>
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs break-anywhere leading-5">
                                        {suggestion.text}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                </div>
            )}
            <Button type="submit" className="mt-4" disabled={pending || !feedback.trim()}>
                {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                {pending ? 'Submitting feedback...' : 'Revise proposal'}
            </Button>
        </form>
    );
}
