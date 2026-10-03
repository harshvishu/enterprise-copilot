import React from 'react';

export default function ApprovalPanel({
                                          pipeline,
                                          onApprove,
                                          onReject,
                                          pending
                                      }) {
    const dep = pipeline?.deploymentDecision;
    const waiting =
        pipeline?.state === 'WAITING_FOR_APPROVAL';
    const deployed =
        pipeline?.state === 'DEPLOYED';
    const blocked =
        pipeline?.state === 'BLOCKED' ||
        pipeline?.state === 'REVIEW_FAILED' ||
        pipeline?.state === 'FAILED';

    return (
        <div className="rounded-lg border border-edge bg-panel2 p-4">
            <div className="text-sm font-semibold text-slate-200 mb-2">
                🚀 Atlas · Deployment Gate
            </div>
            {deployed && (
                <div className="text-ok text-sm font-semibold">
                    ✅ Deployed to production.
                </div>
            )}

            {blocked && (
                <div className="text-danger text-sm">

                    ❌ Deployment blocked.

                    {dep?.blockingReasons?.length > 0 && (
                        <ul className="list-disc ml-5 mt-1 text-slate-300">

                            {dep.blockingReasons.map((r, i) => (
                                <li key={i}>{r}</li>
                            ))}

                        </ul>
                    )}

                </div>
            )}

            {waiting && (

                <div>

                    <div className="text-warn text-sm font-semibold mb-1">
                        ⚠️ DEPLOYMENT BLOCKED
                    </div>

                    <div className="text-slate-300 text-sm mb-3">
                        Human approval required before production.
                    </div>

                    <div className="flex gap-2">

                        <button
                            onClick={onApprove}
                            disabled={pending}
                            className="px-4 py-2 rounded-md bg-ok/90 hover:bg-ok text-ink text-sm font-semibold disabled:opacity-50"
                        >
                            Approve deployment
                        </button>

                        <button
                            onClick={onReject}
                            disabled={pending}
                            className="px-4 py-2 rounded-md bg-danger/80 hover:bg-danger text-white text-sm font-semibold disabled:opacity-50"
                        >
                            Reject
                        </button>

                    </div>

                    <div className="text-[11px] text-slate-500 mt-2">
                        AI cannot approve. Only a human can.
                    </div>

                </div>

            )}

            {!deployed && !blocked && !waiting && (

                <div className="text-slate-500 text-sm">
                    Awaiting pipeline progress…
                </div>

            )}

        </div>
    );
}