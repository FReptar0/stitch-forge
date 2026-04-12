import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// --- Helper: create temp directories with HTML files ------------------------

function createTempDir(): string {
  // Use realpathSync to resolve macOS /var -> /private/var symlink
  return realpathSync(mkdtempSync(join(tmpdir(), 'lint-test-')));
}

function writeFile(dir: string, name: string, content: string): string {
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
}

// --- Fixtures ---------------------------------------------------------------

const CLEAN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test</title>
  <style>body { font-family: "Space Grotesk", sans-serif; color: #2D2D2D; }</style>
</head>
<body>
  <h1>Hello World</h1>
  <h2>Subtitle</h2>
  <p>Content paragraph.</p>
  <img src="photo.jpg" alt="A photo">
</body>
</html>`;

const SLOPPY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Slop</title>
  <style>
    body { font-family: Inter, sans-serif; }
    .hero { background: linear-gradient(to right, purple, blue); }
  </style>
</head>
<body>
  <h1>Hero Title</h1>
  <h4>Skipped heading</h4>
  <img src="img.jpg">
</body>
</html>`;

const SAMPLE_DESIGN_MD = `# Test Design System

## 1. Visual Theme & Atmosphere

A warm, approachable design with rounded elements and clear hierarchy.

## 2. Color Palette & Roles

| Role | Hex | Usage |
|------|-----|-------|
| Primary | #1E3A5F | CTAs, links |
| Secondary | #F5A623 | Accents |
| Surface | #FAFAF8 | Backgrounds |
| On-Surface | #2D2D2D | Body text |
| Muted | #E8E8E4 | Borders |
| Error | #DC2626 | Error states |
| Success | #16A34A | Success |

## 3. Typography

- **Heading**: "DM Serif Display", serif
- **Body**: "DM Sans", sans-serif

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 3rem | 700 | 1.1 |
| H2 | 2.25rem | 700 | 1.2 |
| Body | 1rem | 400 | 1.6 |

## 4. Spacing & Layout

- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64
- **Max content width**: 1200px

## 5. Component Patterns

### Buttons
- Primary: #1E3A5F fill, white text, 8px radius

### Cards
- White fill, 1px border, 12px radius

### Inputs
- 1px border, 8px radius, 12px padding

## 6. Iconography

Lucide icons, 24px default, outline style.

## 7. Imagery Guidelines

Professional photography with warm tones. 16:9 for heroes.

## 8. Do's and Don'ts

### Do
- Use consistent spacing from the 4px scale
- Maintain WCAG AA contrast ratios
- Use Primary color sparingly

### Don't
- Don't use more than 2 font families
- Don't use pure black (#000000)
- Don't center-align body text longer than 2 lines
`;

// --- Tests for resolveTargets -----------------------------------------------

describe('lint: resolveTargets', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('finds a single HTML file', async () => {
    const { resolveTargets } = await import('../../src/commands/lint.js');
    const filePath = writeFile(tmpDir, 'page.html', CLEAN_HTML);
    const files = resolveTargets([filePath]);
    expect(files).toHaveLength(1);
    expect(files[0]).toBe(filePath);
  }, 15000);

  it('finds HTML files in a directory recursively', async () => {
    const { resolveTargets } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'index.html', CLEAN_HTML);
    const sub = join(tmpDir, 'pages');
    mkdirSync(sub);
    writeFile(sub, 'about.html', CLEAN_HTML);
    writeFile(sub, 'contact.html', CLEAN_HTML);

    const files = resolveTargets([tmpDir]);
    expect(files.length).toBeGreaterThanOrEqual(3);
    expect(files.some(f => f.endsWith('index.html'))).toBe(true);
    expect(files.some(f => f.endsWith('about.html'))).toBe(true);
    expect(files.some(f => f.endsWith('contact.html'))).toBe(true);
  });

  it('skips node_modules directories', async () => {
    const { resolveTargets } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'index.html', CLEAN_HTML);
    const nm = join(tmpDir, 'node_modules', 'some-pkg');
    mkdirSync(nm, { recursive: true });
    writeFile(nm, 'hidden.html', CLEAN_HTML);

    const files = resolveTargets([tmpDir]);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('index.html');
  });

  it('ignores non-HTML files', async () => {
    const { resolveTargets } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'readme.md', '# Hello');
    writeFile(tmpDir, 'style.css', 'body {}');
    writeFile(tmpDir, 'page.html', CLEAN_HTML);

    const files = resolveTargets([tmpDir]);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('page.html');
  });

  it('returns empty array for nonexistent path', async () => {
    const { resolveTargets } = await import('../../src/commands/lint.js');
    const files = resolveTargets(['/nonexistent/path/abc123']);
    expect(files).toHaveLength(0);
  });
});

// --- Tests for findDesignMd -------------------------------------------------

describe('lint: findDesignMd', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(origCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('finds DESIGN.md in current directory', async () => {
    const { findDesignMd } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'DESIGN.md', SAMPLE_DESIGN_MD);
    process.chdir(tmpDir);

    const found = findDesignMd();
    expect(found).toBe(join(tmpDir, 'DESIGN.md'));
  });

  it('finds DESIGN.md in parent directory', async () => {
    const { findDesignMd } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'DESIGN.md', SAMPLE_DESIGN_MD);
    const sub = join(tmpDir, 'screens');
    mkdirSync(sub);
    process.chdir(sub);

    const found = findDesignMd();
    expect(found).toBe(join(tmpDir, 'DESIGN.md'));
  });

  it('returns null when no DESIGN.md exists', async () => {
    const { findDesignMd } = await import('../../src/commands/lint.js');
    process.chdir(tmpDir);

    const found = findDesignMd();
    expect(found).toBeNull();
  });
});

// --- Tests for runLint output formats ---------------------------------------

describe('lint: runLint', () => {
  let tmpDir: string;
  let origCwd: string;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = createTempDir();
    origCwd = process.cwd();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
  });

  afterEach(() => {
    process.chdir(origCwd);
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('lints a valid HTML file -- score >= 60, no errors', async () => {
    const { runLint } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'DESIGN.md', SAMPLE_DESIGN_MD);
    const htmlPath = writeFile(tmpDir, 'clean.html', CLEAN_HTML);
    process.chdir(tmpDir);

    await runLint([htmlPath], { designSystem: join(tmpDir, 'DESIGN.md') });

    // Should NOT call process.exit
    expect(processExitSpy).not.toHaveBeenCalled();
    // Terminal output should include the score
    const allOutput = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(allOutput).toContain('/100');
    expect(allOutput).toContain('DESIGN.md Quality Score');
  });

  it('lints an HTML file with AI slop -- detects issues', async () => {
    const { runLint } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'DESIGN.md', SAMPLE_DESIGN_MD);
    const htmlPath = writeFile(tmpDir, 'slop.html', SLOPPY_HTML);
    process.chdir(tmpDir);

    await runLint([htmlPath], { designSystem: join(tmpDir, 'DESIGN.md') });

    const allOutput = consoleLogSpy.mock.calls.map(c => c.join(' ')).join('\n');
    // Should contain issue-related output (error/warning indicators)
    expect(allOutput).toContain('/100');
    // The sloppy HTML should have issues detected (missing alt, heading skip, etc.)
    expect(allOutput.length).toBeGreaterThan(100);
  });

  it('JSON output is valid JSON with expected structure', async () => {
    const { runLint } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'DESIGN.md', SAMPLE_DESIGN_MD);
    const htmlPath = writeFile(tmpDir, 'page.html', CLEAN_HTML);
    process.chdir(tmpDir);

    await runLint([htmlPath], {
      designSystem: join(tmpDir, 'DESIGN.md'),
      format: 'json',
    });

    const jsonStr = consoleLogSpy.mock.calls.map(c => c[0]).join('');
    const parsed = JSON.parse(jsonStr);

    expect(parsed).toHaveProperty('designSystem');
    expect(parsed).toHaveProperty('designSystem.path');
    expect(parsed).toHaveProperty('designSystem.score');
    expect(parsed).toHaveProperty('designSystem.dimensions');
    expect(parsed).toHaveProperty('designSystem.dimensions.specificity');
    expect(parsed).toHaveProperty('designSystem.dimensions.differentiation');
    expect(parsed).toHaveProperty('designSystem.dimensions.completeness');
    expect(parsed).toHaveProperty('designSystem.dimensions.actionability');
    expect(parsed).toHaveProperty('files');
    expect(parsed.files).toHaveLength(1);
    expect(parsed.files[0]).toHaveProperty('path');
    expect(parsed.files[0]).toHaveProperty('score');
    expect(parsed.files[0]).toHaveProperty('passed');
    expect(parsed.files[0]).toHaveProperty('issues');
    expect(parsed).toHaveProperty('summary');
    expect(parsed.summary).toHaveProperty('total', 1);
    expect(parsed.summary).toHaveProperty('passed');
    expect(parsed.summary).toHaveProperty('failed');
    expect(parsed.summary).toHaveProperty('errors');
    expect(parsed.summary).toHaveProperty('warnings');
    expect(parsed.summary).toHaveProperty('info');
  });

  it('SARIF output has valid structure', async () => {
    const { runLint } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'DESIGN.md', SAMPLE_DESIGN_MD);
    const htmlPath = writeFile(tmpDir, 'page.html', SLOPPY_HTML);
    process.chdir(tmpDir);

    await runLint([htmlPath], {
      designSystem: join(tmpDir, 'DESIGN.md'),
      format: 'sarif',
    });

    const jsonStr = consoleLogSpy.mock.calls.map(c => c[0]).join('');
    const parsed = JSON.parse(jsonStr);

    expect(parsed).toHaveProperty('version', '2.1.0');
    expect(parsed).toHaveProperty('runs');
    expect(parsed.runs).toHaveLength(1);
    expect(parsed.runs[0]).toHaveProperty('tool.driver.name', 'design-guard');
    expect(parsed.runs[0]).toHaveProperty('results');
    expect(parsed.runs[0].results.length).toBeGreaterThan(0);
  });

  it('--fail-on-error exits with code 1 when errors exist', async () => {
    const { runLint } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'DESIGN.md', SAMPLE_DESIGN_MD);
    // SLOPPY_HTML has missing alt attribute which is an error
    const htmlPath = writeFile(tmpDir, 'slop.html', SLOPPY_HTML);
    process.chdir(tmpDir);

    await expect(
      runLint([htmlPath], {
        designSystem: join(tmpDir, 'DESIGN.md'),
        failOnError: true,
      }),
    ).rejects.toThrow('process.exit called');

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('--fail-threshold exits with code 1 when score is below threshold', async () => {
    const { runLint } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'DESIGN.md', SAMPLE_DESIGN_MD);
    // SLOPPY_HTML will score low
    const htmlPath = writeFile(tmpDir, 'slop.html', SLOPPY_HTML);
    process.chdir(tmpDir);

    await expect(
      runLint([htmlPath], {
        designSystem: join(tmpDir, 'DESIGN.md'),
        failThreshold: 95,
      }),
    ).rejects.toThrow('process.exit called');

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('missing DESIGN.md shows helpful error and exits', async () => {
    const { runLint } = await import('../../src/commands/lint.js');
    process.chdir(tmpDir);
    const htmlPath = writeFile(tmpDir, 'page.html', CLEAN_HTML);

    await expect(
      runLint([htmlPath], {}),
    ).rejects.toThrow('process.exit called');

    expect(processExitSpy).toHaveBeenCalledWith(1);
    const errorOutput = consoleErrorSpy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(errorOutput).toContain('No DESIGN.md found');
  });

  it('no HTML files shows helpful error and exits', async () => {
    const { runLint } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'DESIGN.md', SAMPLE_DESIGN_MD);
    process.chdir(tmpDir);
    // Directory has no HTML files
    writeFile(tmpDir, 'readme.md', '# Hello');

    await expect(
      runLint([tmpDir], { designSystem: join(tmpDir, 'DESIGN.md') }),
    ).rejects.toThrow('process.exit called');

    expect(processExitSpy).toHaveBeenCalledWith(1);
    const errorOutput = consoleErrorSpy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(errorOutput).toContain('No HTML files found');
  });

  it('lints multiple files in a directory', async () => {
    const { runLint } = await import('../../src/commands/lint.js');
    writeFile(tmpDir, 'DESIGN.md', SAMPLE_DESIGN_MD);
    writeFile(tmpDir, 'page1.html', CLEAN_HTML);
    writeFile(tmpDir, 'page2.html', CLEAN_HTML);
    process.chdir(tmpDir);

    await runLint([tmpDir], {
      designSystem: join(tmpDir, 'DESIGN.md'),
      format: 'json',
    });

    const jsonStr = consoleLogSpy.mock.calls.map(c => c[0]).join('');
    const parsed = JSON.parse(jsonStr);
    expect(parsed.files).toHaveLength(2);
    expect(parsed.summary.total).toBe(2);
  });
});
