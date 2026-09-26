import React from 'react';

export default function DiffViewer({ diff }) {

    if (!diff) {
        return (
            <div className="text-slate-500 text-sm">
                No code proposal yet.
            </div>
        );
    }

    const lines = diff.split('\n');

    return (
        <pre className="text-xs font-mono bg-ink rounded-lg border border-edge p-3 overflow-x-auto leading-relaxed">

            {lines.map((line, i) => {

                let cls = 'text-slate-400';

                if (line.startsWith('+') && !line.startsWith('+++')) {
                    cls = 'diff-line-add';
                } else if (
                    line.startsWith('diff') ||
                    line.startsWith('---') ||
                    line.startsWith('+++') ||
                    line.startsWith('@@')
                ) {
                    cls = 'diff-line-meta';
                }

                return (
                    <div key={i} className={cls}>
                        {line || ' '}
                    </div>
                );

            })}

        </pre>
    );
}