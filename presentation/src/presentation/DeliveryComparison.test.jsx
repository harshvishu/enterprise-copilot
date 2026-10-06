import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import DeliveryComparison from './DeliveryComparison';
import NavigationTestHarness from './navigation-test-harness';
import Presentation from './Presentation';
import { ThemeProvider } from '@/components/theme-provider';

let host, root;
const click = name => act(() => [...host.querySelectorAll('button')].find(button => button.textContent.includes(name)).click());
beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<NavigationTestHarness><DeliveryComparison /></NavigationTestHarness>));
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
    click('Next');
    expect(slide.dataset.deliveryStage).toBe('2');
    expect(host.querySelector('.delivery-opening').getAttribute('aria-hidden')).toBe('true');
    expect(traditional.getAttribute('aria-hidden')).toBe('false');
    expect(agentic.getAttribute('aria-hidden')).toBe('true');
    expect(traditional.querySelectorAll('.delivery-pulse')).toHaveLength(3);
    click('Next');
    expect(slide.dataset.deliveryStage).toBe('3');
    expect(host.querySelector('.delivery-traditional')).toBe(traditional);
    expect(traditional.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('h2').getAttribute('aria-hidden')).toBe('true');
    expect(agentic.getAttribute('aria-hidden')).toBe('false');
    expect([...host.querySelectorAll('button')].find(button => button.textContent.includes('Next')).disabled).toBe(true);
    click('Prev'); click('Prev');
    expect(slide.dataset.deliveryStage).toBe('1');
    expect(traditional.getAttribute('aria-hidden')).toBe('true');
    expect(agentic.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('.delivery-pulse')).toBeNull();
    click('Next');
    expect(traditional.querySelectorAll('.delivery-pulse')).toHaveLength(3);
});

it('compares broad human handoffs with the actual extensible workshop pipeline', () => {
    click('Next');
    const traditional = host.querySelector('.delivery-traditional');
    expect([...traditional.querySelectorAll('[data-delivery-node]')].map(node => node.dataset.deliveryNode)).toEqual(['Requirement', 'Build', 'Verify', 'Release']);
    expect(traditional.textContent).toContain('Human-driven handoffs across delivery stages');
    click('Next');
    const flow = host.querySelector('.delivery-agentic');
    expect([...flow.querySelectorAll('[data-delivery-node]')].map(node => node.dataset.deliveryNode)).toEqual(['Issue', 'Rhea', 'Nova', 'Sentinel', 'Atlas', 'Deterministic gates', 'Human approval', 'Release']);
    expect([...flow.querySelectorAll('.delivery-node-subtitle')].map(node => node.textContent)).toEqual(['Requirements Agent', 'Coding Agent', 'Review Agent', 'Release Agent', 'System enforcement', 'Human authority']);
    const paths = [...flow.querySelectorAll('.delivery-edge')].map(edge => edge.getAttribute('d'));
    expect(paths).toEqual(['M240 80 H325', 'M575 80 H625', 'M875 80 H925', 'M1050 128 V192', 'M925 240 H875', 'M625 240 H575', 'M325 240 H240']);
    const cards = [...flow.querySelectorAll('.delivery-node rect')];
    expect(cards).toHaveLength(6);
    expect(new Set(cards.map(card => card.getAttribute('width')))).toEqual(new Set(['250']));
    expect(new Set(cards.map(card => card.getAttribute('height')))).toEqual(new Set(['96']));
    expect(flow.querySelectorAll('.delivery-pulse')).toHaveLength(7);
    expect(flow.querySelectorAll('.lucide-git-branch, .lucide-check')).toHaveLength(2);
    expect(flow.querySelectorAll('.lucide-shield-check, .lucide-user-round')).toHaveLength(0);
    for (const name of ['Issue', 'Release']) {
        const endpoint = flow.querySelector(`[data-delivery-node="${name}"]`);
        expect(endpoint.querySelector('rect')).toBeNull();
        expect(endpoint.querySelector('.delivery-node-subtitle')).toBeNull();
        expect(Number(endpoint.querySelector('.delivery-icon').getAttribute('x'))).toBeLessThan(Number(endpoint.querySelector('text').getAttribute('x')));
    }
    expect(flow.querySelector('.delivery-section-subtitle').textContent).toBe('Specialized agents collaborate across delivery — extend with more agents as needed.');
    expect(flow.querySelector('.delivery-workshop-caption').textContent).toContain('Our workshop implementation · four agents');
    expect(flow.querySelector('.delivery-extensibility').textContent).toBe('+ More agents');
    expect(flow.querySelector('.delivery-extensibility').closest('[data-delivery-node]')).toBeNull();
    expect(flow.textContent).not.toMatch(/Test Agent|QA Agent|Deployment Agent|PipelineOrchestrator|PipelineContext/);
});

it('keeps page navigation independent of reveal state', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    window.history.replaceState(null, '', '/#problem');
    act(() => root.render(<ThemeProvider><Presentation /></ThemeProvider>));
    const slide = host.querySelector('#problem');
    act(() => host.querySelector('button[aria-label="Next"]').click());
    Element.prototype.scrollIntoView.mockClear();
    act(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true })));
    expect(window.location.hash).toBe('#agentic-sdlc');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: 'smooth', block: 'start' });
    expect(slide.querySelector('[data-delivery-stage]').dataset.deliveryStage).toBe('2');
});
