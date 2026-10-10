import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Presentation from './Presentation';
import { pages } from './pages';
import { ThemeProvider } from '@/components/theme-provider';
import { enterpriseCopilotUrl } from '@/lib/config';

let root;
let host;
let container;
const click = element => act(() => element.click());
const key = (name, options = {}) => act(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...options })));
const go = id => {
    window.history.replaceState(null, '', `/#${id}`);
    act(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
    container.scrollTop = pages.findIndex(page => page.id === id) * 900;
};
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
        click(arrow('Next'));
        settleAt(1);
        Element.prototype.scrollIntoView.mockClear();
        key(name);
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'smooth', block: 'start' });
        expect(window.location.hash).toBe('#welcome');
    });
    it('ignores rapid presses and button clicks until the native scroll settles', () => {
        key('ArrowRight');
        key('ArrowRight');
        click(arrow('Next'));
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
        expect(window.location.hash).toBe('#problem');
        settleAt(1);
        key('ArrowRight', { repeat: true });
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
        key('ArrowRight');
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
        expect(window.location.hash).toBe('#problem');
        expect(host.querySelector('[data-delivery-stage]').dataset.deliveryStage).toBe('2');
    });
    it('honors reduced motion', () => {
        window.matchMedia.mockImplementation(query => ({ matches: query === '(prefers-reduced-motion: reduce)' }));
        click(arrow('Next'));
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'instant', block: 'start' });
    });
    it('allows scrolling to update page state and restores semantic hash navigation', () => {
        container.scrollTop = 4 * 900;
        act(() => container.dispatchEvent(new Event('scroll')));
        expect(window.location.hash).toBe('#spring-ai');
        window.history.replaceState(null, '', '/#hands-on');
        act(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
        expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'instant', block: 'start' });
        expect(host.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('16');
    });
    it('unlocks via the scroll-idle fallback when scrollend is unavailable', () => {
        vi.useFakeTimers();
        key('ArrowRight');
        container.scrollTop = 900;
        act(() => container.dispatchEvent(new Event('scroll')));
        act(() => vi.advanceTimersByTime(161));
        key('PageDown');
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
        expect(host.querySelector('.page-number').textContent).toBe('03 / 19');
        key('PageDown');
        expect(window.location.hash).toBe('#agent-data-flow');
        settleAt(3);
        click(arrow('Prev'));
        expect(window.location.hash).toBe('#agentic-sdlc');
        settleAt(2);
        expect(host.querySelector('.page-number').textContent).toBe('03 / 19');
    });
    it('launches the participant app using the configured URL in a separate tab', () => {
        click(arrow('Speaker notes'));
        const launch = document.querySelector('[role="dialog"] a[target="_blank"]');
        expect(launch.getAttribute('href')).toBe(enterpriseCopilotUrl);
        expect(launch.getAttribute('rel')).toContain('noopener');
    });
});

describe('shared reversible state navigation', () => {
    it.each([
        ['problem', 3], ['agentic-sdlc', 4], ['agent-data-flow', 5],
        ['spring-ai-flow', 4], ['requirements-code', 3], ['enterprise-tools', 3],
        ['pipeline-orchestration', 4], ['code', 3], ['review-gates', 3],
        ['human-approval', 2], ['solution', 4],
    ])('%s reverses states and preserves them when returning from the next slide', (id, states) => {
        go(id);
        const index = pages.findIndex(page => page.id === id);
        const initialNode = host.querySelector(`#${id}`).cloneNode(true);
        const indicator = () => host.querySelector('[aria-label="Slide state"]').textContent;
        expect(indicator()).toBe(`1 / ${states}`);
        for (let state = 2; state <= states; state++) {
            const previousNode = host.querySelector(`#${id}`).cloneNode(true);
            click(arrow('Next'));
            expect(indicator()).toBe(`${state} / ${states}`);
            expect(window.location.hash).toBe(`#${id}`);
            key('ArrowLeft');
            expect(indicator()).toBe(`${state - 1} / ${states}`);
            expect(host.querySelector(`#${id}`).isEqualNode(previousNode)).toBe(true);
            key('ArrowRight');
            expect(indicator()).toBe(`${state} / ${states}`);
        }
        const revealedNode = host.querySelector(`#${id}`).cloneNode(true);
        click(arrow('Next'));
        expect(window.location.hash).toBe(`#${pages[index + 1].id}`);
        settleAt(index + 1);
        click(arrow('Prev'));
        expect(window.location.hash).toBe(`#${id}`);
        settleAt(index);
        expect(indicator()).toBe(`${states} / ${states}`);
        expect(host.querySelector(`#${id}`).isEqualNode(revealedNode)).toBe(true);
        for (let state = states - 1; state >= 1; state--) {
            key('ArrowLeft');
            expect(indicator()).toBe(`${state} / ${states}`);
        }
        expect(host.querySelector(`#${id}`).isEqualNode(initialNode)).toBe(true);
        key('ArrowLeft');
        expect(window.location.hash).toBe(`#${pages[index - 1].id}`);
    });
    it('preserves state on backward re-entry through scrolling, overview and hash navigation', () => {
        go('problem');
        key('ArrowRight'); key('ArrowRight');
        expect(host.querySelector('[data-delivery-stage]').dataset.deliveryStage).toBe('3');
        container.scrollTop = 2 * 900;
        act(() => container.dispatchEvent(new Event('scroll')));
        container.scrollTop = 900;
        act(() => container.dispatchEvent(new Event('scroll')));
        expect(host.querySelector('[data-delivery-stage]').dataset.deliveryStage).toBe('3');
        key('ArrowRight');
        go('spring-ai'); go('problem');
        expect(host.querySelector('[data-delivery-stage]').dataset.deliveryStage).toBe('3');
        key('ArrowRight');
        go('spring-ai');
        click(arrow('Page overview'));
        click([...document.querySelectorAll('[aria-label="Presentation pages"] button')].find(button => button.textContent.includes('Traditional → Agentic SDLC')));
        settleAt(1);
        expect(host.querySelector('[data-delivery-stage]').dataset.deliveryStage).toBe('3');
    });
    it('shows one Prev/Next pair on all slides and removes old navigation controls', () => {
        expect(host.querySelectorAll('button[aria-label="Prev"]')).toHaveLength(1);
        expect(host.querySelectorAll('button[aria-label="Next"]')).toHaveLength(1);
        expect([...host.querySelectorAll('button')].some(button => /^(Reveal next|Reset|Hide)$/.test(button.textContent.trim()))).toBe(false);
        expect(arrow('Prev').disabled).toBe(true);
        Element.prototype.scrollIntoView.mockClear();
        key('ArrowLeft');
        expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
        go('finish');
        expect(arrow('Next').disabled).toBe(true);
        Element.prototype.scrollIntoView.mockClear();
        key('ArrowRight');
        expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });
    it('steps code states with Left/Right even when the source panel has focus', () => {
        go('code');
        const source = host.querySelector('#code pre');
        act(() => source.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })));
        expect(host.querySelector('[aria-label="Slide state"]').textContent).toBe('2 / 3');
        act(() => source.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })));
        expect(host.querySelector('[aria-label="Slide state"]').textContent).toBe('1 / 3');
    });
});

describe('preserved workshop content', () => {
    it('renders the complete existing manifest with unique semantic IDs and source excerpts', () => {
        expect(pages).toHaveLength(19);
        expect(new Set(pages.map(page => page.id)).size).toBe(19);
        expect(host.querySelectorAll('section')).toHaveLength(19);
        expect(host.querySelector('#intro')).toBeNull();
        expect(host.querySelector('#welcome h1').textContent).toBe('Your SDLC, Now Agentic - with Spring AI');
        expect(host.querySelector('#welcome').textContent).not.toContain('Join us at');
        expect(host.querySelector('#code').textContent).toContain('.entity(responseType)');
        expect(host.querySelector('#solution').textContent).not.toContain('return confluenceTool.lookup');
    });
    it('places the conceptual agentic principles slide before Spring AI', () => {
        expect(pages.slice(0, 6).map(page => page.id)).toEqual(['welcome', 'problem', 'agentic-sdlc', 'agent-data-flow', 'spring-ai', 'spring-ai-flow']);
        expect(host.querySelector('#architecture')).toBeNull();
        expect(pages.filter(page => page.title === 'What makes this agentic?')).toHaveLength(1);
        expect([...host.querySelectorAll('h2')].filter(heading => heading.textContent === 'What makes this agentic?')).toHaveLength(1);
        expect(pages.some(page => page.id === 'delivery')).toBe(false);
        go('agentic-sdlc');
        const agents = host.querySelector('#agentic-sdlc');
        expect(agents.querySelectorAll('li:not([aria-hidden="true"])')).toHaveLength(1);
        const reveal = arrow('Next');
        click(reveal); click(reveal); click(reveal);
        expect(agents.querySelectorAll('li:not([aria-hidden="true"])')).toHaveLength(4);
        expect(agents.textContent).toContain('Deterministic Java gates');
        expect(host.querySelector('#live-demo').textContent).toContain('UB-4823');
        expect(host.querySelector('#before-after').textContent).toContain('Approved business policy');
    });
    it('reverses four concepts and keeps page-only keys independent', () => {
        go('agent-data-flow');
        const flow = host.querySelector('#agent-data-flow');
        expect(flow.querySelectorAll('[data-concept][aria-hidden="false"]')).toHaveLength(0);
        for (let index = 1; index <= 4; index++) {
            click(arrow('Next'));
            expect(flow.querySelectorAll('[data-concept][aria-hidden="false"]')).toHaveLength(index);
        }
        for (let index = 3; index >= 0; index--) {
            key('ArrowLeft');
            expect(flow.querySelectorAll('[data-concept][aria-hidden="false"]')).toHaveLength(index);
        }
        key('PageDown');
        expect(window.location.hash).toBe('#spring-ai');
    });
    it('updates the overview and footer to the 19-page consolidated manifest', () => {
        window.history.replaceState(null, '', '/#agent-data-flow');
        act(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
        expect(host.querySelector('.page-number').textContent).toBe('04 / 19');
        expect(host.querySelector('[role="progressbar"]').getAttribute('aria-valuemax')).toBe('19');
        click(arrow('Page overview'));
        const overview = document.querySelector('[aria-label="Presentation pages"]');
        expect(overview.querySelectorAll('button')).toHaveLength(19);
        expect([...overview.querySelectorAll('button')].filter(button => button.textContent.includes('What makes this agentic?'))).toHaveLength(1);
        expect(overview.textContent).not.toContain('Animated agent data flow');
    });
    it('keeps conceptual reveals usable with reduced motion', () => {
        window.matchMedia.mockImplementation(query => ({ matches: query === '(prefers-reduced-motion: reduce)', addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        go('agent-data-flow');
        key('ArrowRight'); key('ArrowRight');
        expect(host.querySelectorAll('[data-concept][aria-hidden="false"]')).toHaveLength(2);
        expect(host.querySelector('.flow-tracer, [data-workflow-edge]')).toBeNull();
    });
    it('keeps the exercise timer manual and supports pause/resume', () => {
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
        click(start);
        act(() => vi.advanceTimersByTime(2000));
        expect(timer.textContent).toBe('04:56');
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
        go('solution');
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
        click(arrow('Prev')); click(arrow('Prev')); click(arrow('Prev'));
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
        click(arrow('Next'));
        expect(window.location.hash).toBe('#problem');
        expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start' });
        expect(host.querySelector('#welcome').textContent).toContain('Harsh Vishwakarma');
        expect(host.querySelector('#welcome').textContent).toContain('Dhruv Gupta');
    });
});
