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
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
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
        settleAt(2);
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
        settleAt(2);
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
        container.scrollTop = 7 * 900;
        act(() => container.dispatchEvent(new Event('scroll')));
        expect(window.location.hash).toBe('#architecture');
        window.history.replaceState(null, '', '/#hands-on');
        act(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
        expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'instant', block: 'start' });
        expect(host.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('18');
    });
    it('unlocks via the scroll-idle fallback when scrollend is unavailable', () => {
        vi.useFakeTimers();
        key('ArrowRight');
        container.scrollTop = 1800;
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
        expect(pages).toHaveLength(21);
        expect(new Set(pages.map(page => page.id)).size).toBe(21);
        expect(host.querySelectorAll('section')).toHaveLength(21);
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
        const preference = window.matchMedia.mock.results.find(result => result.value.media === '(prefers-reduced-motion: reduce)').value;
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
    it('navigates from the welcome screen into the unchanged introduction', () => {
        key('Home');
        settleAt(0);
        expect(window.location.hash).toBe('#welcome');
        click(arrow('Next page'));
        expect(window.location.hash).toBe('#intro');
        expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start' });
        expect(host.querySelector('#welcome').textContent).toContain('Harsh Vishwakarma');
        expect(host.querySelector('#welcome').textContent).toContain('Dhruv Gupta');
    });
});
