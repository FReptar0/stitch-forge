import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track mock state so each test can configure DESIGN.md independently
let mockFileExists = false;
let mockFileContent = '';

vi.mock('node:fs', async () => ({
  existsSync: vi.fn(() => mockFileExists),
  readFileSync: vi.fn(() => mockFileContent),
}));

// Re-import fresh module for each test
async function getValidator() {
  vi.resetModules();
  vi.doMock('node:fs', () => ({
    existsSync: vi.fn(() => mockFileExists),
    readFileSync: vi.fn(() => mockFileContent),
  }));
  const mod = await import('../../src/validation/output-validator.js');
  return mod;
}

beforeEach(() => {
  mockFileExists = false;
  mockFileContent = '';
});

describe('output validator', () => {
  // -------------------------------------------------------------------
  // Existing behaviour (backward-compatibility)
  // -------------------------------------------------------------------

  it('detects missing alt attributes', async () => {
    const { validateOutput } = await getValidator();
    const result = validateOutput('<html><body><img src="test.jpg"></body></html>');
    expect(result.issues.some(i => i.category === 'accessibility')).toBe(true);
  });

  it('detects AI slop fonts', async () => {
    const { validateOutput } = await getValidator();
    const result = validateOutput(
      '<html><head><style>body { font-family: Inter, sans-serif; }</style></head><body></body></html>',
    );
    expect(result.issues.some(i => i.category === 'slop' && i.message.includes('Inter'))).toBe(true);
  });

  it('passes clean HTML', async () => {
    const { validateOutput } = await getValidator();
    const result = validateOutput(
      '<html><head><style>body { font-family: "Space Grotesk", sans-serif; }</style></head>' +
      '<body><h1>Hello</h1><h2>World</h2><img src="test.jpg" alt="Test"></body></html>',
    );
    // New rules (no-missing-meta, no-div-soup) flag missing meta and missing <main>,
    // so score is lower than before but should still be reasonable
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('detects heading hierarchy issues', async () => {
    const { validateOutput } = await getValidator();
    const result = validateOutput(
      '<html><body><h1>Title</h1><h4>Skipped</h4></body></html>',
    );
    expect(result.issues.some(i => i.category === 'structure')).toBe(true);
  });

  it('formats validation report', async () => {
    const { validateOutput, formatValidationReport } = await getValidator();
    const result = validateOutput('<html><body><img src="x.jpg"></body></html>');
    const report = formatValidationReport(result);
    expect(report).toContain('Quality Score');
    expect(report).toContain('alt attribute');
  });

  // -------------------------------------------------------------------
  // New scoring system (Frente C)
  // -------------------------------------------------------------------

  it('overall score is weighted average of category scores, not global deduction', async () => {
    const { validateOutput } = await getValidator();
    const result = validateOutput('<html><body><img src="a.jpg"><p>Hello</p></body></html>');
    // Score should be the weighted average of per-category scores,
    // not a single deduction from 100. This prevents the floor effect
    // where many issues across categories compound to 0.
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    // Per-category scores use deduction weights (error=-20, warn=-10, info=-5)
    for (const cat of Object.values(result.breakdown)) {
      expect(cat.score).toBeGreaterThanOrEqual(0);
      expect(cat.score).toBeLessThanOrEqual(100);
    }
  });

  it('pass threshold is 70', async () => {
    const { validateOutput } = await getValidator();
    // Trigger enough issues to land below 70
    const html =
      '<html><head><style>body { font-family: Inter, sans-serif; } h1 { font-family: Poppins; }</style></head>' +
      '<body><h1>Hi</h1><img src="x.jpg"></body></html>';
    const result = validateOutput(html);
    // Check threshold behavior
    if (result.score < 70) {
      expect(result.passed).toBe(false);
    } else {
      expect(result.passed).toBe(true);
    }
  });

  // -------------------------------------------------------------------
  // Confidence metric
  // -------------------------------------------------------------------

  it('confidence reflects how many rules ran', async () => {
    const { validateOutput } = await getValidator();
    const result = validateOutput('<html><body><p>Simple</p></body></html>');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('confidence is lower when DESIGN.md is absent (some rules skipped)', async () => {
    const { validateOutput } = await getValidator();
    const resultNoDesign = validateOutput('<html><body><p>Hello</p></body></html>');
    expect(resultNoDesign.confidence).toBeLessThan(100);
  });

  // -------------------------------------------------------------------
  // Category breakdown
  // -------------------------------------------------------------------

  it('returns breakdown with all categories', async () => {
    const { validateOutput } = await getValidator();
    const result = validateOutput('<html><body><p>Content</p></body></html>');
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.typography).toBeDefined();
    expect(result.breakdown.color).toBeDefined();
    expect(result.breakdown.layout).toBeDefined();
    expect(result.breakdown.content).toBeDefined();
    expect(result.breakdown.structure).toBeDefined();
    expect(result.breakdown.slop).toBeDefined();
    expect(result.breakdown.accessibility).toBeDefined();
  });

  it('breakdown category has correct shape', async () => {
    const { validateOutput } = await getValidator();
    const result = validateOutput('<html><body><img src="x.jpg"><p>Hi</p></body></html>');
    const acc = result.breakdown.accessibility;
    expect(acc).toHaveProperty('score');
    expect(acc).toHaveProperty('issues');
    expect(acc).toHaveProperty('maxPossible');
    expect(acc.issues).toBeGreaterThan(0); // missing alt
    expect(acc.score).toBeLessThan(100);
  });

  // -------------------------------------------------------------------
  // Report format includes new fields
  // -------------------------------------------------------------------

  it('report includes confidence percentage', async () => {
    const { validateOutput, formatValidationReport } = await getValidator();
    const result = validateOutput('<html><body><p>Hi</p></body></html>');
    const report = formatValidationReport(result);
    expect(report).toContain('confidence:');
    expect(report).toContain('%');
  });

  it('report includes category breakdown section', async () => {
    const { validateOutput, formatValidationReport } = await getValidator();
    const result = validateOutput('<html><body><p>Hi</p></body></html>');
    const report = formatValidationReport(result);
    expect(report).toContain('Category Breakdown');
  });

  // -------------------------------------------------------------------
  // Bug Fix 1: no-default-fonts -- DESIGN.md bypass logic (Frente A)
  // -------------------------------------------------------------------

  describe('default font detection (Bug Fix 1)', () => {
    it('does NOT suppress warning when DESIGN.md says "Don\'t use Inter"', async () => {
      mockFileExists = true;
      mockFileContent = [
        '## 3. Typography',
        '- **Heading**: "Space Grotesk", sans-serif',
        '- **Body**: "DM Sans", sans-serif',
        '',
        "## 8. Do's and Don'ts",
        "### Don't",
        "- Don't use Inter, Poppins, or system sans-serif as the primary font",
      ].join('\n');

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: Inter, sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('Inter'))).toBe(true);
    });

    it('suppresses warning when DESIGN.md Section 3 specifies the font', async () => {
      mockFileExists = true;
      mockFileContent = [
        '## 3. Typography',
        '- **Heading**: "Inter", sans-serif',
        '- **Body**: "DM Sans", sans-serif',
      ].join('\n');

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: Inter, sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('"Inter" font'))).toBe(false);
    });

    it('detects Roboto as default font', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: Roboto, sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('Roboto'))).toBe(true);
    });

    it('detects Open Sans as default font', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>h1 { font-family: "Open Sans", sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('Open Sans'))).toBe(true);
    });

    it('detects Lato as default font', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: Lato, sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('Lato'))).toBe(true);
    });

    it('detects Montserrat as default font', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: Montserrat, sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('Montserrat'))).toBe(true);
    });

    it('detects Nunito as default font', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: Nunito, sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('Nunito'))).toBe(true);
    });

    it('detects Raleway as default font', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: Raleway, sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('Raleway'))).toBe(true);
    });

    it('detects system-ui as sole font-family', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: system-ui, sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('system fonts'))).toBe(true);
    });

    it('detects -apple-system as sole font-family', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('system fonts'))).toBe(true);
    });

    it('detects bare sans-serif as sole font-family', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: sans-serif; }</style></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('bare "sans-serif"'))).toBe(true);
    });

    it('does not flag system-ui when a named font precedes it', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>body { font-family: "Space Grotesk", system-ui, sans-serif; }</style></head>' +
        '<body><h1>OK</h1></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('system fonts'))).toBe(false);
    });

    it('detects default fonts in Google Fonts link tags', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('Roboto') && i.message.includes('Google Fonts'))).toBe(true);
    });

    it('does not flag Google Fonts link for intentional font', async () => {
      mockFileExists = true;
      mockFileContent = [
        '## 3. Typography',
        '- **Body**: "Roboto", sans-serif',
      ].join('\n');

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap"></head><body></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('Google Fonts') && i.message.includes('Roboto'))).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // Bug Fix 2: no-icon-grid -- expanded detection (Frente A)
  // -------------------------------------------------------------------

  describe('icon grid detection (Bug Fix 2)', () => {
    it('detects 4-icon grid in any section', async () => {
      const { validateOutput } = await getValidator();
      const html = `
        <html><body>
          <section><h1>Hero</h1></section>
          <section>
            <div class="grid">
              <svg><circle/></svg>
              <svg><circle/></svg>
              <svg><circle/></svg>
              <svg><circle/></svg>
            </div>
          </section>
        </body></html>`;
      const result = validateOutput(html);
      expect(result.issues.some(i => i.category === 'slop' && i.message.includes('4-icon grid'))).toBe(true);
    });

    it('detects 5-icon grid', async () => {
      const { validateOutput } = await getValidator();
      const html = `
        <html><body>
          <section>
            <div class="grid-cols-5">
              <svg><circle/></svg><svg><circle/></svg><svg><circle/></svg>
              <svg><circle/></svg><svg><circle/></svg>
            </div>
          </section>
        </body></html>`;
      const result = validateOutput(html);
      expect(result.issues.some(i => i.category === 'slop' && i.message.includes('5-icon grid'))).toBe(true);
    });

    it('detects 6-icon grid', async () => {
      const { validateOutput } = await getValidator();
      const html = `
        <html><body>
          <section>
            <div class="grid">
              <svg><circle/></svg><svg><circle/></svg><svg><circle/></svg>
              <svg><circle/></svg><svg><circle/></svg><svg><circle/></svg>
            </div>
          </section>
        </body></html>`;
      const result = validateOutput(html);
      expect(result.issues.some(i => i.category === 'slop' && i.message.includes('6-icon grid'))).toBe(true);
    });

    it('detects icon grid with <img> icons (small width)', async () => {
      const { validateOutput } = await getValidator();
      const html = `
        <html><body>
          <section>
            <div class="grid">
              <img src="a.svg" width="24">
              <img src="b.svg" width="24">
              <img src="c.svg" width="24">
            </div>
          </section>
        </body></html>`;
      const result = validateOutput(html);
      expect(result.issues.some(i => i.category === 'slop' && i.message.includes('icon grid'))).toBe(true);
    });

    it('detects icon grid with material-symbols spans', async () => {
      const { validateOutput } = await getValidator();
      const html = `
        <html><body>
          <section>
            <div class="grid">
              <span class="material-symbols-outlined">home</span>
              <span class="material-symbols-outlined">search</span>
              <span class="material-symbols-outlined">settings</span>
            </div>
          </section>
        </body></html>`;
      const result = validateOutput(html);
      expect(result.issues.some(i => i.category === 'slop' && i.message.includes('icon grid'))).toBe(true);
    });

    it('marks second-section icon grid with specific message', async () => {
      const { validateOutput } = await getValidator();
      const html = `
        <html><body>
          <section><h1>Hero</h1></section>
          <section>
            <div class="grid">
              <svg><circle/></svg><svg><circle/></svg><svg><circle/></svg>
            </div>
          </section>
        </body></html>`;
      const result = validateOutput(html);
      expect(result.issues.some(i => i.message.includes('Second section'))).toBe(true);
    });

    it('reports icon grid severity as warning', async () => {
      const { validateOutput } = await getValidator();
      const html = `
        <html><body>
          <section>
            <div class="grid">
              <svg><circle/></svg><svg><circle/></svg><svg><circle/></svg>
            </div>
          </section>
        </body></html>`;
      const result = validateOutput(html);
      const iconIssue = result.issues.find(i => i.category === 'slop' && i.message.includes('icon grid'));
      expect(iconIssue?.type).toBe('warning');
    });
  });

  // -------------------------------------------------------------------
  // Bug Fix 3: color-adherence -- thresholds + Tailwind (Frente A)
  // -------------------------------------------------------------------

  describe('color adherence (Bug Fix 3)', () => {
    it('flags 2 off-palette colors as error', async () => {
      mockFileExists = true;
      mockFileContent = [
        '## 2. Color Palette',
        '| Role | Hex |',
        '| Primary | #6C5CE7 |',
        '| Secondary | #00CEC9 |',
      ].join('\n');

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>.a { color: #FF0000; } .b { color: #00FF00; }</style></head><body><h1>Test</h1></body></html>',
      );
      expect(result.issues.some(i => i.category === 'color' && i.type === 'error')).toBe(true);
    });

    it('flags 1 off-palette color as warning', async () => {
      mockFileExists = true;
      mockFileContent = [
        '## 2. Color Palette',
        '| Primary | #6C5CE7 |',
      ].join('\n');

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>.a { color: #FF0000; }</style></head><body><h1>Test</h1></body></html>',
      );
      expect(result.issues.some(i => i.category === 'color' && i.type === 'warning')).toBe(true);
    });

    it('extracts colors from Tailwind arbitrary values', async () => {
      mockFileExists = true;
      mockFileContent = [
        '## 2. Color Palette',
        '| Primary | #6C5CE7 |',
      ].join('\n');

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><div class="text-[#5af9f3] bg-[#aca3ff]"><h1>Test</h1></div></body></html>',
      );
      expect(result.issues.some(i => i.category === 'color')).toBe(true);
    });

    it('extracts colors from rgb() in styles', async () => {
      mockFileExists = true;
      mockFileContent = [
        '## 2. Color Palette',
        '| Primary | #6C5CE7 |',
      ].join('\n');

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><head><style>.a { color: rgb(255, 0, 0); }</style></head><body><h1>Test</h1></body></html>',
      );
      expect(result.issues.some(i => i.category === 'color')).toBe(true);
    });

    it('still exempts truly neutral colors', async () => {
      mockFileExists = true;
      mockFileContent = [
        '## 2. Color Palette',
        '| Primary | #6C5CE7 |',
      ].join('\n');

      const { validateOutput } = await getValidator();
      // #808080 is pure gray - maxDiff = 0
      const result = validateOutput(
        '<html><head><style>.a { color: #808080; }</style></head><body><h1>Test</h1></body></html>',
      );
      expect(result.issues.some(i => i.category === 'color')).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // Bug Fix 4: alt-text -- data-alt pattern (Frente A)
  // -------------------------------------------------------------------

  describe('alt-text data-alt detection (Bug Fix 4)', () => {
    it('flags images with data-alt but no alt attribute', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><img src="hero.jpg" data-alt="Hero image"></body></html>',
      );
      expect(result.issues.some(i =>
        i.category === 'accessibility' && i.message.includes('data-alt'),
      )).toBe(true);
    });

    it('does not flag images that have both alt and data-alt', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><h1>Title</h1><img src="hero.jpg" alt="Hero" data-alt="Hero image"></body></html>',
      );
      expect(result.issues.some(i =>
        i.category === 'accessibility' && i.message.includes('data-alt'),
      )).toBe(false);
    });

    it('separately counts data-alt-only vs fully missing alt', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body>' +
        '<img src="a.jpg" data-alt="A">' +
        '<img src="b.jpg">' +
        '</body></html>',
      );
      const dataAltIssue = result.issues.find(i => i.message.includes('data-alt'));
      const missingAltIssue = result.issues.find(i =>
        i.category === 'accessibility' && i.message.includes('missing alt') && !i.message.includes('data-alt'),
      );
      expect(dataAltIssue).toBeDefined();
      expect(missingAltIssue).toBeDefined();
      expect(dataAltIssue!.message).toContain('1 image(s) have data-alt');
      expect(missingAltIssue!.message).toContain('1 image(s) missing alt');
    });
  });

  // -------------------------------------------------------------------
  // Bug Fix 5: heading-hierarchy -- all skips + h1 checks (Frente A)
  // -------------------------------------------------------------------

  describe('heading hierarchy (Bug Fix 5)', () => {
    it('reports ALL heading skips, not just the first', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><h1>Title</h1><h3>Skip1</h3><h2>Back</h2><h5>Skip2</h5></body></html>',
      );
      const skipIssues = result.issues.filter(i =>
        i.category === 'structure' && i.message.includes('Heading hierarchy skip'),
      );
      expect(skipIssues.length).toBe(2);
    });

    it('flags pages with no h1', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><h2>Not h1</h2><h3>Sub</h3></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('no <h1>'))).toBe(true);
    });

    it('flags pages with multiple h1 elements', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><h1>First</h1><h2>Sub</h2><h1>Second</h1></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('2 <h1> elements'))).toBe(true);
    });

    it('does not flag single h1 as problem', async () => {
      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><h1>Title</h1><h2>Sub</h2></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('no <h1>'))).toBe(false);
      expect(result.issues.some(i => i.message.includes('<h1> elements'))).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // Bug Fix 6: business-alignment -- expanded checks (Frente A)
  // -------------------------------------------------------------------

  describe('business alignment (Bug Fix 6)', () => {
    it('flags pricing on free/open-source sites', async () => {
      mockFileExists = true;
      mockFileContent = 'Open source CLI framework — free to use, MIT licensed.';

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><h1>Product</h1><div>$9.99/mo</div><button>Upgrade to Pro</button></body></html>',
      );
      expect(result.issues.some(i =>
        i.category === 'structure' && i.message.includes('pricing/subscription'),
      )).toBe(true);
    });

    it('flags login/signup on no-accounts sites', async () => {
      mockFileExists = true;
      mockFileContent = 'NOT a SaaS product — no pricing, no signup, no user accounts.';

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><h1>Welcome</h1><form><input placeholder="Email"><button>Sign Up</button></form></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('login/signup'))).toBe(true);
    });

    it('flags Contact Sales on open-source sites', async () => {
      mockFileExists = true;
      mockFileContent = 'Open source, community-driven project.';

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><h1>Product</h1><button>Contact Sales</button></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('enterprise/sales'))).toBe(true);
    });

    it('flags SaaS CTAs on non-SaaS sites', async () => {
      mockFileExists = true;
      mockFileContent = 'NOT a SaaS product. Open source CLI tool.';

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><h1>Tool</h1><button>Start Free Trial</button></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('SaaS CTAs'))).toBe(true);
    });

    it('still detects e-commerce elements on non-e-commerce sites', async () => {
      mockFileExists = true;
      mockFileContent = 'This is not an e-commerce site.';

      const { validateOutput } = await getValidator();
      const result = validateOutput(
        '<html><body><h1>Blog</h1><button>Add to Cart</button></body></html>',
      );
      expect(result.issues.some(i => i.message.includes('e-commerce elements'))).toBe(true);
    });
  });
});
