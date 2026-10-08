import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
it('defaults to the independent participant server', async () => {
    vi.stubEnv('VITE_ENTERPRISE_COPILOT_URL', '');
    vi.resetModules();
    const { enterpriseCopilotUrl } = await import('./config');
    expect(enterpriseCopilotUrl).toBe('http://localhost:5173');
});
it('uses a configured participant deployment URL', async () => {
    vi.stubEnv('VITE_ENTERPRISE_COPILOT_URL', 'https://copilot.example.test/workshop');
    vi.resetModules();
    const { enterpriseCopilotUrl } = await import('./config');
    expect(enterpriseCopilotUrl).toBe('https://copilot.example.test/workshop');
});
