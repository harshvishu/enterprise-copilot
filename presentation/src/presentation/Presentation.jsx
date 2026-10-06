import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Keyboard, List, Maximize, Minimize, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import ThemeToggle from '@/components/theme-toggle';
import { pages } from './pages';
import { enterpriseCopilotUrl } from '@/lib/config';
import nagarroLogo from '@/assets/nagarro-logo.png';

export default function Presentation() {
    const viewport = useRef(null);
    const sections = useRef([]);
    const activeRef = useRef(0);
    const scrolling = useRef(false);
    const settleTimer = useRef(null);
    const finishScroll = useRef(() => {});
    const [active, setActive] = useState(0);
    const [panel, setPanel] = useState(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [fullscreenError, setFullscreenError] = useState('');
    const navigate = useCallback((index, { instant = false } = {}) => {
        if (scrolling.current && !instant) return;
        const next = Math.max(0, Math.min(pages.length - 1, index));
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        clearTimeout(settleTimer.current);
        scrolling.current = !instant && !reducedMotion;
        activeRef.current = next;
        setActive(next);
        sections.current[next]?.scrollIntoView({ behavior: scrolling.current ? 'smooth' : 'instant', block: 'start' });
        window.history.replaceState(null, '', `#${pages[next].id}`);
        // Fallback for browsers without scrollend, including navigation to the current page.
        if (scrolling.current) settleTimer.current = setTimeout(() => finishScroll.current(), 200);
    }, []);
    useEffect(() => {
        const container = viewport.current;
        finishScroll.current = () => {
            if (!scrolling.current) return;
            clearTimeout(settleTimer.current);
            scrolling.current = false;
            const position = container.scrollTop + container.clientHeight * 0.3;
            const next = sections.current.reduce((found, section, i) => section.offsetTop <= position ? i : found, 0);
            activeRef.current = next;
            setActive(next);
            window.history.replaceState(null, '', `#${pages[next].id}`);
        };
        const onScrollEnd = () => finishScroll.current();
        container.addEventListener('scrollend', onScrollEnd);
        return () => {
            container.removeEventListener('scrollend', onScrollEnd);
            clearTimeout(settleTimer.current);
        };
    }, []);
    useEffect(() => {
        const restore = () => {
            const index = pages.findIndex(page => page.id === window.location.hash.slice(1));
            navigate(index < 0 ? 0 : index, { instant: true });
        };
        restore();
        window.addEventListener('hashchange', restore);
        return () => window.removeEventListener('hashchange', restore);
    }, [navigate]);
    useEffect(() => {
        const handleKey = event => {
            if (panel || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable], [role="menu"], [role="dialog"], pre')) return;
            if (event.key === ' ' && event.target.closest('button, a')) return;
            if (event.key === '?') { event.preventDefault(); setPanel('help'); return; }
            const forward = ['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key);
            const backward = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key);
            if (!forward && !backward && !['Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            if (event.repeat) return;
            navigate(event.key === 'Home' ? 0 : event.key === 'End' ? pages.length - 1 : activeRef.current + (forward ? 1 : -1));
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [navigate, panel]);
    useEffect(() => {
        const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFullscreen);
        return () => document.removeEventListener('fullscreenchange', onFullscreen);
    }, []);
    const syncScroll = () => {
        if (scrolling.current) {
            clearTimeout(settleTimer.current);
            settleTimer.current = setTimeout(() => finishScroll.current(), 160);
            return;
        }
        const position = viewport.current.scrollTop + viewport.current.clientHeight * 0.3;
        const next = sections.current.reduce((found, section, i) => section.offsetTop <= position ? i : found, 0);
        if (next !== activeRef.current) {
            activeRef.current = next;
            setActive(next);
            window.history.replaceState(null, '', `#${pages[next].id}`);
        }
    };
    const toggleFullscreen = async () => {
        try {
            setFullscreenError('');
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.documentElement.requestFullscreen();
        } catch {
            setFullscreenError('Fullscreen is unavailable here. Use your browser’s fullscreen command.');
            setPanel('help');
        }
    };
    return <div className="presentation">
        <header className="presenter-header">
            <div className="presentation-brand">
                <img className="brand-logo" src={nagarroLogo} alt="Nagarro" />
                <span className="brand-event">FLO 2026</span>
                <span className="brand-slash" aria-hidden="true">/</span>
                <span className="brand-workshop">SPRING AI WORKSHOP</span>
            </div>
            <div className="presenter-tools"><ThemeToggle /><span className="toolbar-divider" />
                <Button variant="ghost" size="icon" aria-label="Page overview" title="Page overview" onClick={() => setPanel('overview')}><List size={17} /></Button>
                <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)" onClick={() => setPanel('help')}><Keyboard size={17} /></Button>
                <Button variant="ghost" size="icon" aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title="Fullscreen" onClick={toggleFullscreen}>{fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}</Button>
            </div>
        </header>
        <main ref={viewport} className="presentation-viewport" onScroll={syncScroll} aria-label="Workshop presentation">
            {pages.map((page, i) => <section ref={node => { sections.current[i] = node; }} id={page.id} key={page.id} className={`presentation-page ${i === active ? 'is-active' : ''}`} aria-label={`${i + 1}. ${page.title}`}><page.component /></section>)}
        </main>
        <footer className="presenter-footer">
            <div className="page-status" aria-live="polite"><span className="page-number">{String(active + 1).padStart(2, '0')}<span> / {String(pages.length).padStart(2, '0')}</span></span><span className="footer-divider" /><span>{pages[active].title}</span></div>
            <span className="footer-act">{pages[active].act}</span>
            <div className="presenter-navigation"><Button variant="ghost" size="icon" aria-label="Speaker notes" title="Speaker notes (visible in this window)" onClick={() => setPanel('notes')}><StickyNote size={16} /></Button><Button variant="ghost" size="icon" aria-label="Previous page" disabled={active === 0} onClick={() => navigate(activeRef.current - 1)}><ArrowLeft size={18} /></Button><Button variant="ghost" size="icon" aria-label="Next page" disabled={active === pages.length - 1} onClick={() => navigate(activeRef.current + 1)}><ArrowRight size={18} /></Button></div>
            <div className="presentation-progress" role="progressbar" aria-label="Presentation progress" aria-valuemin={1} aria-valuemax={pages.length} aria-valuenow={active + 1}><span style={{ width: `${((active + 1) / pages.length) * 100}%` }} /></div>
        </footer>
        <Sheet open={Boolean(panel)} onOpenChange={open => { if (!open) setPanel(null); }}><SheetContent className="presenter-panel">
            <SheetHeader><SheetTitle>{panel === 'overview' ? 'Presentation' : panel === 'notes' ? 'Speaker notes' : 'Keyboard shortcuts'}</SheetTitle><SheetDescription>{panel === 'overview' ? '20 pages · a 45-minute workshop.' : panel === 'notes' ? 'These notes are visible in this window. Close before projecting.' : 'One keypress. One presentation page.'}</SheetDescription></SheetHeader>
            <ScrollArea className="panel-scroll">
                {panel === 'overview' && <nav className="overview-list" aria-label="Presentation pages">{pages.map((page, i) => <Button key={page.id} variant={active === i ? 'secondary' : 'ghost'} aria-current={active === i ? 'page' : undefined} onClick={() => { navigate(i); setPanel(null); }}><span className="font-mono text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>{page.title}<ArrowRight size={16} /></Button>)}</nav>}
                {panel === 'help' && <div className="shortcut-list">{[['Next page', '↓ → PgDn Space'], ['Previous page', '↑ ← PgUp'], ['First / last', 'Home / End'], ['This help', '?'], ['Close panel', 'Esc']].map(([label, key]) => <div key={label}><span>{label}</span><kbd>{key}</kbd></div>)}<p>Scroll or swipe to snap between pages. Focused controls and code panels keep their normal keyboard behavior.</p>{fullscreenError && <p role="status">{fullscreenError}</p>}</div>}
                {panel === 'notes' && <div className="speaker-notes"><span className="eyebrow">{pages[active].title}</span><p>{pages[active].notes}</p><Button variant="outline" asChild><a href={enterpriseCopilotUrl} target="_blank" rel="noopener noreferrer">Open Enterprise Copilot <ExternalLink size={15} /></a></Button></div>}
            </ScrollArea>
        </SheetContent></Sheet>
    </div>;
}
