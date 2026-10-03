import React from 'react';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { readable, severityCounts } from '@/lib/pipeline';
import { cn } from '@/lib/utils';

const COLORS = {
    CRITICAL: 'border-l-destructive',
    HIGH: 'border-l-warning/70',
    MEDIUM: 'border-l-muted-foreground/60',
    LOW: 'border-l-border',
};

export default function Findings({ review, running = false, mode }) {
    const counts = severityCounts(review);
    const passed = review?.outcome === 'APPROVE';
    return (
        <section id="review" className="scroll-mt-6 min-w-0 py-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">
                    Review{' '}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">Sentinel</span>
                </h2>
                <span className="text-xs text-muted-foreground">
                    {mode === 'DEMO' ? 'Deterministic preview' : 'Model assessment'}
                </span>
            </div>
            {!review ? (
                running ? (
                    <div className="space-y-3">
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sentinel is reviewing the proposal...
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
                </>
            )}
        </section>
    );
}
