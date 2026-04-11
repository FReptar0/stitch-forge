import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', async () => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => ''),
}));

describe('prompt enhancer', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('calculates high slop risk for generic prompts', async () => {
    const { calculateSlopRisk } = await import('../../src/utils/prompt-enhancer.js');
    const score = calculateSlopRisk('A modern clean professional website');
    expect(score).toBeGreaterThanOrEqual(6);
  });

  it('calculates low slop risk for specific prompts', async () => {
    const { calculateSlopRisk } = await import('../../src/utils/prompt-enhancer.js');
    const score = calculateSlopRisk(
      'A bold landing page with asymmetric hero layout, 3 pricing cards in a bento grid, ' +
      'and a testimonial carousel section with customer avatars'
    );
    expect(score).toBeLessThanOrEqual(3);
  });

  it('adds DESIGN.md reference when file exists', async () => {
    const fs = await import('node:fs');
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const { enhancePrompt } = await import('../../src/utils/prompt-enhancer.js');
    const result = enhancePrompt('A landing page for Acme');
    expect(result.enhanced).toContain('design system');
  });

  it('suggests specific UI vocabulary', async () => {
    const { enhancePrompt } = await import('../../src/utils/prompt-enhancer.js');
    const result = enhancePrompt('A nice website for my company');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('returns correct risk levels', async () => {
    const { getSlopRiskLevel } = await import('../../src/utils/prompt-enhancer.js');
    expect(getSlopRiskLevel(2)).toBe('low');
    expect(getSlopRiskLevel(5)).toBe('medium');
    expect(getSlopRiskLevel(8)).toBe('high');
  });
});
