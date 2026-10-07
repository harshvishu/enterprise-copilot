import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import AgentDataFlowPage from './AgentDataFlow';
import NavigationTestHarness from './navigation-test-harness';

let host, root;
const click = name => act(() => [...host.querySelectorAll('button')].find(button => button.textContent.includes(name)).click());
beforeEach(() => {
    host = document.createElement('div'); document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<NavigationTestHarness><AgentDataFlowPage /></NavigationTestHarness>));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

it('reveals four concepts cumulatively and shows the takeaway only at the end', () => {
    expect(host.querySelector('h2').textContent).toBe('What makes this agentic?');
    expect(host.querySelectorAll('[data-concept][aria-hidden="false"]')).toHaveLength(0);
    expect(host.querySelector('.concepts-takeaway').getAttribute('aria-hidden')).toBe('true');
    ['CONTEXT', 'SPECIALIZATION', 'CONTROL', 'ACCOUNTABILITY'].forEach((name, index) => {
        click('Next');
        expect(host.querySelectorAll('[data-concept][aria-hidden="false"]')).toHaveLength(index + 1);
        expect(host.querySelector('[role="status"]').textContent).toBe(`${index + 1} / 4`);
        expect(host.querySelector('.concepts-takeaway').getAttribute('aria-hidden')).toBe(String(index < 3));
    });
    expect([...host.querySelectorAll('button')].find(button => button.textContent.includes('Next')).disabled).toBe(true);
    expect(host.querySelector('.concepts-takeaway').textContent).toBe('Agents advise. Systems enforce. Humans authorize.');
});

it('resets to the sparse opening and can reveal the concepts again', () => {
    for (let i = 0; i < 4; i++) click('Next');
    for (let i = 0; i < 4; i++) click('Prev');
    expect(host.querySelectorAll('[data-concept][aria-hidden="false"]')).toHaveLength(0);
    expect(host.querySelector('[role="status"]').textContent).toBe('0 / 4');
    expect(host.querySelector('.concepts-takeaway').getAttribute('aria-hidden')).toBe('true');
    click('Next');
    expect(host.querySelectorAll('[data-concept][aria-hidden="false"]')).toHaveLength(1);
});

it('keeps the concepts concise and omits the repeated pipeline and implementation details', () => {
    expect([...host.querySelectorAll('[data-concept] p')].map(node => node.textContent)).toEqual([
        'Enterprise policy · Architecture · API contracts',
        'Requirements · Coding · Review',
        'Deterministic gates outside model authority',
        'Humans authorize critical actions',
    ]);
    expect(host.textContent).not.toMatch(/Rhea|Nova|Sentinel|Atlas|PipelineOrchestrator|PipelineContext/);
    expect(host.querySelector('[data-workflow-edge], svg[role="img"]')).toBeNull();
});
