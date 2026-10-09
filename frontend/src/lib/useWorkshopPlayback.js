import { useEffect, useRef, useState } from 'react';
import { presentationBatch } from './workshop';

// A display cursor over the existing activity history. No server/model/action waits.
export function useWorkshopPlayback(entries, runId, enabled, delayMs) {
    const [playback, setPlayback] = useState({ runId, count: 0, skipped: false });
    const deadline = useRef(0);
    const current = playback.runId === runId ? playback : { runId, count: 0, skipped: false };
    const count = !enabled || current.skipped ? entries.length : Math.min(entries.length, current.count);

    useEffect(() => {
        deadline.current = 0;
        setPlayback({ runId, count: 0, skipped: false });
    }, [runId, enabled]);

    useEffect(() => {
        if (!enabled || current.skipped || count >= entries.length) return;
        const advance = () => {
            const end = presentationBatch(entries, count);
            deadline.current = Date.now() + (entries.slice(count, end).some((entry) => entry.meaningful) ? delayMs : 0);
            setPlayback({ runId, count: end, skipped: false });
        };
        const remaining = Math.max(0, deadline.current - Date.now());
        if (!remaining) {
            advance();
            return;
        }
        const timer = setTimeout(advance, remaining);
        return () => clearTimeout(timer);
    }, [entries, runId, enabled, delayMs, count, current.skipped]);

    function skip() {
        deadline.current = 0;
        setPlayback({ runId, count: entries.length, skipped: true });
    }
    return { count, skip, skipped: current.skipped };
}
