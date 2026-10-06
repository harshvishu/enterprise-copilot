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
const arrow = label => host.querySelector(`button[aria-label="${label}"]`);
function settleAt(index) {
    container.scrollTop = index * 900;
    act(() => container.dispatchEvent(new Event('scrollend')));
}

beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/#intro');
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
        expect(window.location.hash).toBe('#intro');
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
        expect(window.location.hash).toBe('#delivery');
    });
    it('honors reduced motion', () => {
        window.matchMedia.mockImplementation(query => ({ matches: query === '(prefers-reduced-motion: reduce)' }));
        click(arrow('Next page'));
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'instant', block: 'start' });
    });
    it('allows scrolling to update page state and restores semantic hash navigation', () => {
        container.scrollTop = 6 * 900;
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
        expect(window.location.hash).toBe('#delivery');
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
        expect(host.querySelector('#code').textContent).toContain('.entity(responseType)');
        expect(host.querySelector('#solution').textContent).not.toContain('return confluenceTool.lookup');
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
    it('reveals the existing reference solution explicitly', () => {
        const solution = host.querySelector('#solution');
        click([...solution.querySelectorAll('button')].find(button => button.textContent === 'Reveal ConfluenceAgent'));
        expect(solution.textContent).toContain('return confluenceTool.lookup(ticket.description());');
        click([...solution.querySelectorAll('button')].find(button => button.textContent === 'Orchestrator integration'));
        expect(solution.textContent).toContain('requirementsAgent.analyze(ctx, businessContext)');
    });
});
