import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs to avoid writing real files
vi.mock('node:fs', async () => {
  let stored = '';
  return {
    existsSync: () => stored !== '',
    readFileSync: () => stored,
    writeFileSync: (_path: string, content: string) => { stored = content; },
  };
});

describe('quota tracking', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('reports full quota when fresh', async () => {
    const { getQuotaStatus } = await import('../../src/utils/quota.js');
    const status = getQuotaStatus();
    expect(status.flash.remaining).toBe(350);
    expect(status.pro.remaining).toBe(200);
  });

  it('canGenerate returns true when quota available', async () => {
    const { canGenerate } = await import('../../src/utils/quota.js');
    expect(canGenerate('GEMINI_2_5_FLASH')).toBe(true);
    expect(canGenerate('GEMINI_3_PRO')).toBe(true);
  });
});
