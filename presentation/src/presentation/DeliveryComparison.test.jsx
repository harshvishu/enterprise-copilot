import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import DeliveryComparison from './DeliveryComparison';
import Presentation from './Presentation';
import { ThemeProvider } from '@/components/theme-provider';

let host, root;
const click = name => act(() => [...host.querySelectorAll('button')].find(button => button.textContent.includes(name)).click());
beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<DeliveryComparison />));
});
afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.restoreAllMocks();
});

it('reveals exactly three stages, keeps the traditional diagram mounted, and resets the opening', () => {
    const slide = host.querySelector('[data-delivery-stage]');
    const traditional = host.querySelector('.delivery-traditional');
    const agentic = host.querySelector('.delivery-agentic');
    expect(slide.dataset.deliveryStage).toBe('1');
    expect(host.querySelector('.delivery-opening').getAttribute('aria-hidden')).toBe('false');
    expect(traditional.getAttribute('aria-hidden')).toBe('true');
    expect(agentic.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('.delivery-pulse')).toBeNull();
    click('Reveal next');
    expect(slide.dataset.deliveryStage).toBe('2');
    expect(host.querySelector('.delivery-opening').getAttribute('aria-hidden')).toBe('true');
    expect(traditional.getAttribute('aria-hidden')).toBe('false');
    expect(agentic.getAttribute('aria-hidden')).toBe('true');
    expect(traditional.querySelectorAll('.delivery-pulse')).toHaveLength(6);
    click('Reveal next');
    expect(slide.dataset.deliveryStage).toBe('3');
    expect(host.querySelector('.delivery-traditional')).toBe(traditional);
    expect(traditional.getAttribute('aria-hidden')).toBe('false');
    expect(agentic.getAttribute('aria-hidden')).toBe('false');
    expect([...host.querySelectorAll('button')].find(button => button.textContent.includes('Reveal next')).disabled).toBe(true);
    click('Reset');
    expect(slide.dataset.deliveryStage).toBe('1');
    expect(traditional.getAttribute('aria-hidden')).toBe('true');
    expect(agentic.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('.delivery-pulse')).toBeNull();
    click('Reveal next');
    expect(traditional.querySelectorAll('.delivery-pulse')).toHaveLength(6);
});

it('routes Atlas straight down to gates, then flows left through approval and release with sequential pulses', () => {
    click('Reveal next'); click('Reveal next');
    const flow = host.querySelector('.delivery-wrapped');
    expect([...flow.querySelectorAll('[data-delivery-node]')].map(node => node.dataset.deliveryNode)).toEqual(['Issue', 'Rhea', 'Nova', 'Sentinel', 'Atlas', 'Deterministic gates', 'Human approval', 'Release']);
    const paths = [...flow.querySelectorAll('.delivery-edge')].map(edge => edge.getAttribute('d'));
    expect(paths.slice(0, 4)).toEqual(['M208 45 H268', 'M448 45 H508', 'M688 45 H748', 'M928 45 H988']);
    expect(paths.slice(4)).toEqual(['M1078 83 V151', 'M988 189 H928', 'M748 189 H688']);
    expect([...flow.querySelectorAll('.delivery-pulse')].map(edge => edge.style.animationDelay)).toEqual(['500ms', '1250ms', '2000ms', '2750ms', '3500ms', '4250ms', '5000ms']);
    expect(host.querySelector('.delivery-code-caption').textContent).toBe('AI coding');
});

it('keeps page navigation independent of reveal state', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    window.history.replaceState(null, '', '/#problem');
    act(() => root.render(<ThemeProvider><Presentation /></ThemeProvider>));
    const slide = host.querySelector('#problem');
    act(() => [...slide.querySelectorAll('button')].find(button => button.textContent.includes('Reveal next')).click());
    Element.prototype.scrollIntoView.mockClear();
    act(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true })));
    expect(window.location.hash).toBe('#agentic-sdlc');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'smooth', block: 'start' });
    expect(slide.querySelector('[data-delivery-stage]').dataset.deliveryStage).toBe('2');
});
