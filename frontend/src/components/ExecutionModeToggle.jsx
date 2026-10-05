import React from 'react';
import { Bot, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExecutionModeToggle({ status, onMode, pending }) {
    return (
        <div className="mb-4">
            <div className="mb-2 text-[10px] font-medium text-muted-foreground">Next run</div>
            <div className="flex gap-1" role="group" aria-label="Execution mode for next run">
                {['LIVE', 'DEMO'].map((mode) => {
                    const unavailable = mode === 'LIVE' && !status?.liveAvailable;
                    return (
                        <Button
                            key={mode}
                            type="button"
                            size="sm"
                            variant={status?.aiMode === mode ? 'secondary' : 'ghost'}
                            className="min-w-0 flex-1 px-2 text-[10px]"
                            aria-pressed={status?.aiMode === mode}
                            disabled={pending || !status || unavailable}
                            title={unavailable ? 'No LIVE provider configured' : `${mode} for the next pipeline run`}
                            onClick={() => onMode(mode)}
                        >
                            {mode === 'LIVE' ? <Bot /> : <FlaskConical />}
                            {mode}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}