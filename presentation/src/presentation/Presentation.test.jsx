import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Presentation from './Presentation';
import { pages } from './pages';
import AgentDataFlowPage from './AgentDataFlow';
import { ThemeProvider } from '@/components/theme-provider';
import { enterpriseCopilotUrl } from '@/lib/config';

let root;
let host;
let container;
const click = element => act(() => element.click());
const key = (name, options = {}) => act(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...options })));
const arrow = label => host.querySelector(`button[aria-label="${label}"]`);
function settleAt(index) {
    container.scrollTop = index * 900;
    act(() => container.dispatchEvent(new Event('scrollend')));
}

beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    localStorage.clear();
    window.history.replaceState(null, '', '/#welcome');
    document.documentElement.className = '';
    window.matchMedia.mockImplementation(query => ({ media: query, matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<ThemeProvider defaultTheme="system" storageKey="copilot-presentation-theme"><Presentation /></ThemeProvider>));
    container = host.querySelector('main');
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 900 });
    host.querySelectorAll('section').forEach((element, index) => {
        Object.defineProperty(element, 'offsetTop', { configurable: true, value: index * 900 });
    });
    Element.prototype.scrollIntoView.mockClear();
});
afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('standalone presentation navigation', () => {
    it.each(['ArrowDown', 'ArrowRight', 'PageDown', ' '])('%s scrolls exactly one page smoothly', name => {
        key(name);
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'smooth', block: 'start' });
        expect(window.location.hash).toBe('#problem');
    });
    it.each(['ArrowUp', 'ArrowLeft', 'PageUp'])('%s scrolls back smoothly', name => {
        click(arrow('Next page'));
        settleAt(1);
        Element.prototype.scrollIntoView.mockClear();
        key(name);
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'smooth', block: 'start' });
        expect(window.location.hash).toBe('#welcome');
    });
    it('ignores rapid presses and button clicks until the native scroll settles', () => {
        key('ArrowRight');
        key('ArrowRight');
        click(arrow('Next page'));
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
        expect(window.location.hash).toBe('#problem');
        settleAt(1);
        key('ArrowRight', { repeat: true });
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
        key('ArrowRight');
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
        expect(window.location.hash).toBe('#agentic-sdlc');
    });
    it('honors reduced motion', () => {
        window.matchMedia.mockImplementation(query => ({ matches: query === '(prefers-reduced-motion: reduce)' }));
        click(arrow('Next page'));
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'instant', block: 'start' });
    });
    it('allows scrolling to update page state and restores semantic hash navigation', () => {
        container.scrollTop = 4 * 900;
        act(() => container.dispatchEvent(new Event('scroll')));
        expect(window.location.hash).toBe('#architecture');
        window.history.replaceState(null, '', '/#hands-on');
        act(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
        expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'instant', block: 'start' });
        expect(host.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('17');
    });
    it('unlocks via the scroll-idle fallback when scrollend is unavailable', () => {
        vi.useFakeTimers();
        key('ArrowRight');
        container.scrollTop = 900;
        act(() => container.dispatchEvent(new Event('scroll')));
        act(() => vi.advanceTimersByTime(161));
        key('ArrowRight');
        expect(window.location.hash).toBe('#agentic-sdlc');
    });
    it('tracks scrolling and subsequent arrows after a slide is removed from a mounted deck', () => {
        // Reproduce the live-preview removal: React clears the removed section's
        // ref, but the existing ref array retains that trailing null slot.
        const renderDeck = () => act(() => root.render(<ThemeProvider defaultTheme="system" storageKey="copilot-presentation-theme"><Presentation /></ThemeProvider>));
        pages.push({ id: 'temporary', title: 'Temporary', act: '', component: () => <div>Temporary slide</div> });
        try {
            renderDeck();
        } finally {
            pages.pop();
            renderDeck();
        }
        container.scrollTop = 1800;
        act(() => container.dispatchEvent(new Event('scroll')));
        expect(window.location.hash).toBe('#agentic-sdlc');
        expect(host.querySelector('.page-number').textContent).toBe('03 / 20');
        key('ArrowRight');
        expect(window.location.hash).toBe('#agent-data-flow');
        settleAt(3);
        click(arrow('Previous page'));
        expect(window.location.hash).toBe('#agentic-sdlc');
        settleAt(2);
        expect(host.querySelector('.page-number').textContent).toBe('03 / 20');
    });
    it('launches the participant app using the configured URL in a separate tab', () => {
        click(arrow('Speaker notes'));
        const launch = document.querySelector('[role="dialog"] a[target="_blank"]');
        expect(launch.getAttribute('href')).toBe(enterpriseCopilotUrl);
        expect(launch.getAttribute('rel')).toContain('noopener');
    });
});

describe('preserved workshop content', () => {
    it('renders the complete existing manifest with unique semantic IDs and source excerpts', () => {
        expect(pages).toHaveLength(20);
        expect(new Set(pages.map(page => page.id)).size).toBe(20);
        expect(host.querySelectorAll('section')).toHaveLength(20);
        expect(host.querySelector('#intro')).toBeNull();
        expect(host.querySelector('#welcome h1').textContent).toBe('Your SDLC, Now Agentic - with Spring AI');
        expect(host.querySelector('#welcome').textContent).not.toContain('Join us at');
        expect(host.querySelector('#code').textContent).toContain('.entity(responseType)');
        expect(host.querySelector('#solution').textContent).not.toContain('return confluenceTool.lookup');
    });
    it('places the named agents, animated flow and architecture before Spring AI', () => {
        expect(pages.slice(0, 7).map(page => page.id)).toEqual(['welcome', 'problem', 'agentic-sdlc', 'agent-data-flow', 'architecture', 'spring-ai', 'spring-ai-flow']);
        expect(pages.some(page => page.id === 'delivery')).toBe(false);
        const agents = host.querySelector('#agentic-sdlc');
        expect(agents.querySelectorAll('li:not([aria-hidden="true"])')).toHaveLength(1);
        const reveal = [...agents.querySelectorAll('button')].find(button => button.textContent.includes('Reveal next'));
        click(reveal); click(reveal); click(reveal);
        expect(agents.querySelectorAll('li:not([aria-hidden="true"])')).toHaveLength(4);
        expect(agents.textContent).toContain('Deterministic Java gates');
        expect(host.querySelector('#live-demo').textContent).toContain('UB-4823');
        expect(host.querySelector('#before-after').textContent).toContain('Approved business policy');
    });
    it('reveals and pulses one flow stage at a time, resets, and keeps page keys independent', () => {
        const flow = host.querySelector('#agent-data-flow');
        const reveal = [...flow.querySelectorAll('button')].find(button => button.textContent.includes('Reveal next'));
        expect(flow.querySelectorAll('[data-flow-stage][aria-hidden="false"]')).toHaveLength(1);
        for (let index = 1; index <= 7; index++) {
            click(reveal);
            expect(flow.querySelectorAll('[data-flow-stage][aria-hidden="false"]')).toHaveLength(index + 1);
            expect(flow.querySelector('[data-current="true"]').getAttribute('data-flow-stage')).toBe(String(index));
            expect(flow.querySelector('animateMotion')).not.toBeNull();
        }
        expect(reveal.disabled).toBe(true);
        click([...flow.querySelectorAll('button')].find(button => button.textContent === 'Reset'));
        expect(flow.querySelectorAll('[data-flow-stage][aria-hidden="false"]')).toHaveLength(1);
        expect(flow.querySelector('animateMotion')).toBeNull();
        window.history.replaceState(null, '', '/#agent-data-flow');
        act(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
        key('PageDown');
        expect(window.location.hash).toBe('#architecture');
    });
    it('keeps progressive flow usable with reduced motion and no animated packet', () => {
        window.matchMedia.mockImplementation(query => ({ matches: query === '(prefers-reduced-motion: reduce)', addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        act(() => root.render(<AgentDataFlowPage />));
        click([...host.querySelectorAll('button')].find(button => button.textContent.includes('Reveal next')));
        expect(host.querySelector('[data-current="true"]').textContent).toContain('Rhea');
        expect(host.querySelector('animateMotion')).toBeNull();
    });
    it('keeps the exercise timer manual and supports pause/reset', () => {
        vi.useFakeTimers();
        const exercise = host.querySelector('#hands-on');
        const timer = exercise.querySelector('[role="timer"]');
        const start = [...exercise.querySelectorAll('button')].find(button => button.textContent === 'Start');
        act(() => vi.advanceTimersByTime(2000));
        expect(timer.textContent).toBe('05:00');
        click(start);
        act(() => vi.advanceTimersByTime(2000));
        expect(timer.textContent).toBe('04:58');
        click(start);
        act(() => vi.advanceTimersByTime(2000));
        expect(timer.textContent).toBe('04:58');
        click([...exercise.querySelectorAll('button')].find(button => button.textContent === 'Reset'));
        expect(timer.textContent).toBe('05:00');
    });
    it('keeps method context and real line numbers visible during code highlights', () => {
        const code = host.querySelector('#code');
        expect(code.textContent).toContain('public <T> T generate(');
        click([...code.querySelectorAll('button')].find(button => button.textContent === '03  Validate'));
        expect(code.textContent).toContain('return response;');
        const validation = [...code.querySelectorAll('.source-line')].find(row => row.textContent.includes('validate(response);'));
        expect(validation.querySelector('.line-number').textContent).toBe('75');
        expect(validation.classList.contains('highlighted')).toBe(true);
        expect(code.querySelector('.source-omission').textContent).toContain('omitted');
        const requirements = host.querySelector('#requirements-code');
        expect(requirements.textContent).toContain('public RequirementAnalysis analyze(PipelineContext ctx, String additionalContext)');
    });
    it('reveals the existing reference solution explicitly', () => {
        const solution = host.querySelector('#solution');
        click([...solution.querySelectorAll('button')].find(button => button.textContent === '01 ConfluenceAgent'));
        expect(solution.textContent).toContain('return confluenceTool.lookup(ticket.description());');
        click([...solution.querySelectorAll('button')].find(button => button.textContent === '02 Constructor wiring'));
        expect(solution.textContent).toContain('private final ConfluenceAgent confluenceAgent;');
        expect(solution.textContent).toContain('public PipelineOrchestrator(');
        expect(solution.textContent).toContain('this.confluenceAgent = confluenceAgent;');
        click([...solution.querySelectorAll('button')].find(button => button.textContent === '03 Call before Rhea'));
        expect(solution.textContent).toContain('public void run(UUID pipelineId)');
        expect(solution.textContent).toContain('requirementsAgent.analyze(ctx, businessContext)');
        click([...solution.querySelectorAll('button')].find(button => button.textContent === 'Hide'));
        expect(solution.querySelector('.code-workspace')).toBeNull();
    });
});

describe('welcome screen', () => {
    it('dissolves with actual scroll and pauses/resumes the loop on leaving/returning', () => {
        const backdrop = host.querySelector('.welcome-backdrop');
        const video = backdrop.querySelector('video');
        expect(video.muted).toBe(true);
        expect(video.loop).toBe(true);
        expect(video.hasAttribute('playsinline')).toBe(true);
        container.scrollTop = 450;
        act(() => container.dispatchEvent(new Event('scroll')));
        expect(backdrop.style.opacity).toBe('0.5');
        container.scrollTop = 900;
        act(() => container.dispatchEvent(new Event('scroll')));
        expect(backdrop.style.opacity).toBe('0');
        expect(video.pause).toHaveBeenCalled();
        video.play.mockClear();
        container.scrollTop = 0;
        act(() => container.dispatchEvent(new Event('scroll')));
        expect(backdrop.style.opacity).toBe('1');
        expect(video.play).toHaveBeenCalledOnce();
    });
    it('stops video when reduced motion is enabled and resumes when disabled', () => {
        const preference = window.matchMedia.mock.results.find(result => result.value.media === '(prefers-reduced-motion: reduce)' && result.value.addEventListener.mock.calls.some(([event]) => event === 'change')).value;
        const update = preference.addEventListener.mock.calls.find(([event]) => event === 'change')[1];
        const video = host.querySelector('video');
        video.pause.mockClear();
        preference.matches = true;
        act(() => update());
        expect(video.pause).toHaveBeenCalledOnce();
        video.play.mockClear();
        preference.matches = false;
        act(() => update());
        expect(video.play).toHaveBeenCalledOnce();
    });
    it('navigates from the animated introduction directly to the problem statement', () => {
        key('Home');
        settleAt(0);
        expect(window.location.hash).toBe('#welcome');
        click(arrow('Next page'));
        expect(window.location.hash).toBe('#problem');
        expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start' });
        expect(host.querySelector('#welcome').textContent).toContain('Harsh Vishwakarma');
        expect(host.querySelector('#welcome').textContent).toContain('Dhruv Gupta');
    });
});
