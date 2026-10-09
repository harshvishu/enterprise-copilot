import React from 'react';
import { Bot, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExecutionModeToggle({ status, onMode, pending }) {
    const missingKey = status?.aiMode === 'LIVE' && status?.liveConfigured === false;
    return (
        <div className="mb-4">
            <div className="mb-2 text-[10px] font-medium text-muted-foreground">Next run</div>
            <div className="flex gap-1" role="group" aria-label="Execution mode for next run">
                {['LIVE', 'DEMO'].map((mode) => {
                    return (
                        <Button
                            key={mode}
                            type="button"
                            size="sm"
                            variant={status?.aiMode === mode ? 'secondary' : 'ghost'}
                            className="min-w-0 flex-1 px-2 text-[10px]"
                            aria-pressed={status?.aiMode === mode}
                            disabled={pending || !status}
                            title={`${mode} for the next pipeline run`}
                            onClick={() => onMode(mode)}
                        >
                            {mode === 'LIVE' ? <Bot /> : <FlaskConical />}
                            {mode}
                        </Button>
                    );
                })}
            </div>
            {missingKey && (
                <p className="mt-2 text-[10px] leading-snug text-amber-600 dark:text-amber-400">
                    OPENAI_API_KEY is not set. Add it to the project .env file, then run the
                    pipeline. No restart needed.
                </p>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground">
                ConfluenceAgent: {status?.confluenceActive ? 'active' : 'inactive'}
            </p>
        </div>
    );
}