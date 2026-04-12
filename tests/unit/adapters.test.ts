import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BuildContext, ScreenData } from '../../src/adapters/types.js';

// Mock node:fs
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(false),
  };
});

// Load fixture HTML
const fixtureHtml = readFileSync(
  join(__dirname, '..', 'fixtures', 'screen-html.html'),
  'utf-8'
);

function makeScreens(): ScreenData[] {
  return [
    { screenId: 's1', route: '/', name: 'Homepage', html: fixtureHtml },
    { screenId: 's2', route: '/about', name: 'About', html: fixtureHtml },
    { screenId: 's3', route: '/pricing', name: 'Pricing', html: fixtureHtml },
  ];
}

function makeContext(outputDir = 'dist'): BuildContext {
  return {
    projectId: 'proj-123',
    outputDir,
    screens: makeScreens(),
  };
}

describe('StaticAdapter', () => {
  let writeFileSync: ReturnType<typeof vi.fn>;
  let mkdirSync: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const fs = await import('node:fs');
    writeFileSync = fs.writeFileSync as unknown as ReturnType<typeof vi.fn>;
    mkdirSync = fs.mkdirSync as unknown as ReturnType<typeof vi.fn>;
  });

  it('creates correct file paths for 3 routes', async () => {
    const { StaticAdapter } = await import('../../src/adapters/static.js');
    const adapter = new StaticAdapter();
    const result = await adapter.build(makeContext());

    expect(result.files).toHaveLength(3);
    expect(result.files[0]).toBe(join('dist', 'index.html'));
    expect(result.files[1]).toBe(join('dist', 'about', 'index.html'));
    expect(result.files[2]).toBe(join('dist', 'pricing', 'index.html'));
  });

  it('injects nav element into each page', async () => {
    const { StaticAdapter } = await import('../../src/adapters/static.js');
    const adapter = new StaticAdapter();
    await adapter.build(makeContext());

    // Check that writeFileSync was called 3 times
    expect(writeFileSync).toHaveBeenCalledTimes(3);

    // Each written file should contain the nav
    for (const call of writeFileSync.mock.calls) {
      const html = call[1] as string;
      expect(html).toContain('data-dg-nav');
      expect(html).toContain('Homepage');
      expect(html).toContain('About');
      expect(html).toContain('Pricing');
    }
  });

  it('returns correct BuildResult with instructions', async () => {
    const { StaticAdapter } = await import('../../src/adapters/static.js');
    const adapter = new StaticAdapter();
    const result = await adapter.build(makeContext());

    expect(result.instructions).toContain('Open dist/index.html in your browser');
    expect(result.files.length).toBeGreaterThan(0);
  });

  it('creates directories with recursive option', async () => {
    const { StaticAdapter } = await import('../../src/adapters/static.js');
    const adapter = new StaticAdapter();
    await adapter.build(makeContext());

    // mkdirSync should be called with { recursive: true }
    for (const call of mkdirSync.mock.calls) {
      expect(call[1]).toEqual({ recursive: true });
    }
  });
});

describe('NextjsAdapter', () => {
  let writeFileSync: ReturnType<typeof vi.fn>;
  let mkdirSync: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const fs = await import('node:fs');
    writeFileSync = fs.writeFileSync as unknown as ReturnType<typeof vi.fn>;
    mkdirSync = fs.mkdirSync as unknown as ReturnType<typeof vi.fn>;
  });

  it('creates correct file structure', async () => {
    const { NextjsAdapter } = await import('../../src/adapters/nextjs.js');
    const adapter = new NextjsAdapter();
    const result = await adapter.build(makeContext('out'));

    const filePaths = result.files;

    // Should contain package.json, next.config.js, tsconfig.json, layout, globals.css, and pages
    expect(filePaths).toContain(join('out', 'package.json'));
    expect(filePaths).toContain(join('out', 'next.config.js'));
    expect(filePaths).toContain(join('out', 'tsconfig.json'));
    expect(filePaths).toContain(join('out', 'app', 'layout.tsx'));
    expect(filePaths).toContain(join('out', 'app', 'globals.css'));
    expect(filePaths).toContain(join('out', 'app', 'page.tsx'));
    expect(filePaths).toContain(join('out', 'app', 'about', 'page.tsx'));
    expect(filePaths).toContain(join('out', 'app', 'pricing', 'page.tsx'));
  });

  it('extracts title for metadata export', async () => {
    const { NextjsAdapter } = await import('../../src/adapters/nextjs.js');
    const adapter = new NextjsAdapter();
    await adapter.build(makeContext('out'));

    // Find the homepage page.tsx write call
    const pageCall = writeFileSync.mock.calls.find(
      (call: unknown[]) => (call[0] as string) === join('out', 'app', 'page.tsx')
    );
    expect(pageCall).toBeDefined();

    const pageContent = pageCall![1] as string;
    // The fixture has title "Acme — Project Management"
    expect(pageContent).toContain('Acme');
    expect(pageContent).toContain('export const metadata');
  });

  it('creates package.json with next dependencies', async () => {
    const { NextjsAdapter } = await import('../../src/adapters/nextjs.js');
    const adapter = new NextjsAdapter();
    await adapter.build(makeContext('out'));

    const pkgCall = writeFileSync.mock.calls.find(
      (call: unknown[]) => (call[0] as string) === join('out', 'package.json')
    );
    expect(pkgCall).toBeDefined();

    const pkg = JSON.parse(pkgCall![1] as string);
    expect(pkg.dependencies).toHaveProperty('next');
    expect(pkg.dependencies).toHaveProperty('react');
    expect(pkg.dependencies).toHaveProperty('react-dom');
  });

  it('creates next.config.js with static export', async () => {
    const { NextjsAdapter } = await import('../../src/adapters/nextjs.js');
    const adapter = new NextjsAdapter();
    await adapter.build(makeContext('out'));

    const configCall = writeFileSync.mock.calls.find(
      (call: unknown[]) => (call[0] as string) === join('out', 'next.config.js')
    );
    expect(configCall).toBeDefined();
    expect(configCall![1] as string).toContain("output: 'export'");
  });

  it('returns correct BuildResult with instructions', async () => {
    const { NextjsAdapter } = await import('../../src/adapters/nextjs.js');
    const adapter = new NextjsAdapter();
    const result = await adapter.build(makeContext('out'));

    expect(result.instructions.length).toBeGreaterThan(0);
    expect(result.instructions[0]).toContain('npm install');
  });
});

describe('Framework resolution', () => {
  it('getAdapter returns StaticAdapter for static', async () => {
    const { getAdapter } = await import('../../src/adapters/index.js');
    const adapter = getAdapter('static');
    expect(adapter.name).toBe('static');
  });

  it('getAdapter returns NextjsAdapter for nextjs', async () => {
    const { getAdapter } = await import('../../src/adapters/index.js');
    const adapter = getAdapter('nextjs');
    expect(adapter.name).toBe('nextjs');
  });
});
