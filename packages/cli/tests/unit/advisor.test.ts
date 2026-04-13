import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock node:fs — we control what the advisor "sees" on the filesystem.
vi.mock('node:fs', () => {
  const _existsSync = vi.fn<(p: string) => boolean>().mockReturnValue(false);
  const _readdirSync = vi.fn<(p: string) => string[]>().mockReturnValue([]);
  const _readFileSync = vi.fn<(p: string, enc?: string) => string>().mockReturnValue('');
  const _writeFileSync = vi.fn();
  return {
    existsSync: _existsSync,
    readdirSync: _readdirSync,
    readFileSync: _readFileSync,
    writeFileSync: _writeFileSync,
  };
});

// Mock config — always reports config exists so quota check doesn't interfere.
vi.mock('../../src/utils/config.js', () => ({
  configExists: vi.fn().mockReturnValue(true),
  getConfig: vi.fn().mockReturnValue({
    defaultModel: 'GEMINI_3_FLASH',
    screens: [],
    quota: { flashUsed: 0, proUsed: 0, resetDate: '2099-01-01' },
  }),
}));

// Mock quota — return a safe default so quota hints don't dominate.
vi.mock('../../src/utils/quota.js', () => ({
  getQuotaStatus: vi.fn().mockReturnValue({
    flash: { used: 0, limit: 350, remaining: 350 },
    pro: { used: 0, limit: 200, remaining: 200 },
    resetDate: '2099-01-01',
    warning: undefined,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { existsSync, readdirSync } from 'node:fs';

const mockedExistsSync = vi.mocked(existsSync);
const mockedReaddirSync = vi.mocked(readdirSync);

/**
 * Configure the mock filesystem for a given test scenario.
 *
 * @param opts.designMd   - Whether DESIGN.md exists
 * @param opts.researchDir - Whether .dg-research/ directory exists
 * @param opts.researchFiles - Files inside .dg-research/ (e.g. ['latest.json'])
 */
function setupFs(opts: {
  designMd?: boolean;
  researchDir?: boolean;
  researchFiles?: string[];
}) {
  mockedExistsSync.mockImplementation((p: unknown) => {
    const path = String(p);
    if (path.endsWith('DESIGN.md')) return opts.designMd ?? false;
    if (path.endsWith('.dg-research')) return opts.researchDir ?? false;
    if (path.endsWith('.guardrc.json')) return true;
    // screens/ and evaluations/ — empty by default
    if (path.endsWith('screens')) return false;
    if (path.endsWith('evaluations')) return false;
    return false;
  });

  mockedReaddirSync.mockImplementation((p: unknown) => {
    const path = String(p);
    if (path.includes('.dg-research')) return (opts.researchFiles ?? []) as any;
    return [] as any;
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getAdvisorReport', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe('discover-first logic', () => {
    it('suggests /dg-discover when no DESIGN.md and no .dg-research/', async () => {
      setupFs({ designMd: false, researchDir: false });

      const { getAdvisorReport } = await import('../../src/utils/advisor.js');
      const report = getAdvisorReport();

      // Should have a blocker hint suggesting discover
      const discoverHint = report.hints.find(
        h => h.level === 'blocker' && h.action === '/dg-discover',
      );
      expect(discoverHint).toBeDefined();
      expect(discoverHint!.message).toMatch(/research|discover/i);
    });

    it('suggests /dg-design when no DESIGN.md but .dg-research/ has JSON files', async () => {
      setupFs({
        designMd: false,
        researchDir: true,
        researchFiles: ['latest.json'],
      });

      const { getAdvisorReport } = await import('../../src/utils/advisor.js');
      const report = getAdvisorReport();

      // Should have a blocker hint suggesting design, NOT discover
      const designHint = report.hints.find(
        h => h.level === 'blocker' && h.action === '/dg-design',
      );
      expect(designHint).toBeDefined();
      expect(designHint!.message).toMatch(/research exists|DESIGN\.md/i);

      // Should NOT have a discover blocker
      const discoverHint = report.hints.find(
        h => h.level === 'blocker' && h.action === '/dg-discover',
      );
      expect(discoverHint).toBeUndefined();
    });

    it('suggests /dg-discover when .dg-research/ exists but is empty', async () => {
      setupFs({
        designMd: false,
        researchDir: true,
        researchFiles: [], // empty directory
      });

      const { getAdvisorReport } = await import('../../src/utils/advisor.js');
      const report = getAdvisorReport();

      // Empty research dir = no research. Should suggest discover.
      const discoverHint = report.hints.find(
        h => h.level === 'blocker' && h.action === '/dg-discover',
      );
      expect(discoverHint).toBeDefined();
    });

    it('emits no design/discover blocker when DESIGN.md exists', async () => {
      setupFs({ designMd: true, researchDir: false });

      const { getAdvisorReport } = await import('../../src/utils/advisor.js');
      const report = getAdvisorReport();

      // Should have an ok hint for DESIGN.md, not a blocker
      const okHint = report.hints.find(
        h => h.level === 'ok' && h.message.includes('DESIGN.md'),
      );
      expect(okHint).toBeDefined();

      // No discover or design blocker
      const blockers = report.hints.filter(
        h =>
          h.level === 'blocker' &&
          (h.action === '/dg-discover' || h.action === '/dg-design'),
      );
      expect(blockers).toHaveLength(0);
    });

    it('suggestedNext is /dg-discover when research is missing', async () => {
      setupFs({ designMd: false, researchDir: false });

      const { getAdvisorReport } = await import('../../src/utils/advisor.js');
      const report = getAdvisorReport();

      expect(report.suggestedNext).toBe('/dg-discover');
    });
  });
});
