import React from 'react';

const SEV = {
    CRITICAL: 'bg-danger/20 text-danger border-danger/40',
    HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    MEDIUM: 'bg-warn/20 text-warn border-warn/40',
    LOW: 'bg-slate-500/20 text-slate-300 border-slate-500/40'
};

export default function Findings({ review }) {
    if (!review) {
        return (
            <div className="text-slate-500 text-sm">
                No review yet.
            </div>
        );
    }

    const outcomeColor =
        review.outcome === 'APPROVE'
            ? 'text-ok'
            : review.outcome === 'REJECT'
                ? 'text-danger'
                : 'text-warn';

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-slate-400">
                    Sentinel decision:
                </span>
                <span
                    className={`text-sm font-semibold ${outcomeColor}`}
                >
                    {review.outcome}
                </span>
            </div>

            <p className="text-sm text-slate-300 mb-3">
                {review.summary}
            </p>
            <div className="space-y-2">
                {review.findings.map((f, i) => (
                    <div
                        key={i}
                        className={`rounded-lg border p-3 ${
                            SEV[f.severity] || SEV.LOW
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">
                                {f.severity} • {f.category}
                            </span>
                            <span className="text-[11px] opacity-80">
                                {f.file}:{f.location}
                            </span>
                        </div>
                        <div className="mt-1 text-sm">
                            {f.description}
                        </div>
                        <div className="mt-1 text-xs opacity-80">
                            ↳ {f.recommendation}
                        </div>
                    </div>
                ))}
                {review.findings.length === 0 && (
                    <div className="text-sm text-ok">
                        No findings — clean review.
                    </div>
                )}
            </div>
        </div>
    );
}