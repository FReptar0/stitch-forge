import { describe, it, expect, vi } from 'vitest';

vi.mock('node:fs', async () => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => ''),
}));

describe('output validator', () => {
  it('detects missing alt attributes', async () => {
    const { validateOutput } = await import('../../src/utils/output-validator.js');
    const result = validateOutput('<html><body><img src="test.jpg"></body></html>');
    expect(result.issues.some(i => i.category === 'accessibility')).toBe(true);
  });

  it('detects AI slop fonts', async () => {
    const { validateOutput } = await import('../../src/utils/output-validator.js');
    const result = validateOutput(
      '<html><head><style>body { font-family: Inter, sans-serif; }</style></head><body></body></html>'
    );
    expect(result.issues.some(i => i.category === 'slop' && i.message.includes('Inter'))).toBe(true);
  });

  it('passes clean HTML', async () => {
    const { validateOutput } = await import('../../src/utils/output-validator.js');
    const result = validateOutput(
      '<html><head><style>body { font-family: "Space Grotesk", sans-serif; }</style></head>' +
      '<body><h1>Hello</h1><h2>World</h2><img src="test.jpg" alt="Test"></body></html>'
    );
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('detects heading hierarchy issues', async () => {
    const { validateOutput } = await import('../../src/utils/output-validator.js');
    const result = validateOutput(
      '<html><body><h1>Title</h1><h4>Skipped</h4></body></html>'
    );
    expect(result.issues.some(i => i.category === 'structure')).toBe(true);
  });

  it('formats validation report', async () => {
    const { validateOutput, formatValidationReport } = await import('../../src/utils/output-validator.js');
    const result = validateOutput('<html><body><img src="x.jpg"></body></html>');
    const report = formatValidationReport(result);
    expect(report).toContain('Quality Score');
    expect(report).toContain('alt attribute');
  });
});
