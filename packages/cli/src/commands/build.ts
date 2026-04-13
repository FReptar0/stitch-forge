import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateOutput } from '@design-guard/core';
import { log } from '../utils/logger.js';
import { getConfig } from '../utils/config.js';
import { StitchMcpClient } from '../mcp/client.js';
import { getAdapter } from '../adapters/index.js';
import { AstroAdapter } from '../adapters/astro.js';
import type { Framework, ScreenData } from '../adapters/types.js';

const VALID_FRAMEWORKS: Framework[] = ['static', 'astro', 'nextjs'];

interface BuildOptions {
  project?: string;
  auto?: boolean;
  framework?: string;
}

export async function runBuild(opts: BuildOptions): Promise<void> {
  const config = getConfig();
  const projectId = opts.project || config.projectId;

  if (!projectId) {
    log.error('No project ID. Use --project <id> or run `dg init` first.');
    process.exit(1);
  }

  // Resolve framework: CLI flag > config > default
  const framework = (opts.framework || config.framework || 'static') as Framework;

  if (!VALID_FRAMEWORKS.includes(framework)) {
    log.error(`Unknown framework "${framework}". Valid options: ${VALID_FRAMEWORKS.join(', ')}`);
    process.exit(1);
  }

  let client: StitchMcpClient;
  try {
    client = new StitchMcpClient();
  } catch (err) {
    log.error(err instanceof Error ? err.message : 'Failed to initialize Stitch client.');
    process.exit(1);
  }

  log.step(1, 4, 'Fetching screens...');
  const screens = await client.listScreens(projectId);

  if (screens.length === 0) {
    log.error('No screens in project. Run `dg generate` first.');
    process.exit(1);
  }

  // ── Pre-build quality gate ───────────────────────────────────────
  log.step(2, 4, 'Running pre-build quality gate...');
  const gateResults = runPreBuildGate();
  if (gateResults.blocked) {
    log.gate(false, `Quality gate: ${gateResults.failCount} screen(s) FAILED (score < 50)`);
    for (const f of gateResults.entries.filter(e => e.status === 'FAIL')) {
      log.blocker(`${f.name}: lint ${f.lintScore}/100 — needs refinement`);
    }
    log.hint('Fix failing screens with /dg-generate, then /dg-evaluate to verify.');

    if (!opts.auto) {
      // In non-auto mode, surface the issue but allow the CLI to proceed
      // (the skill layer asks the user; the CLI just warns)
      log.warn('Proceeding with build despite quality gate failures.');
    }
  } else {
    const warnCount = gateResults.entries.filter(e => e.status === 'WARN').length;
    if (warnCount > 0) {
      log.gate(true, `Quality gate: passed with ${warnCount} warning(s)`);
    } else {
      log.gate(true, 'Quality gate: all screens passing');
    }
  }

  // Build route mapping
  const routes = screens.map((screen, i) => ({
    screenId: screen.id,
    route: opts.auto ? inferRoute(screen.name, i) : screen.name,
    name: screen.name,
  }));

  if (!opts.auto) {
    log.info('Auto-mapping screens to routes (use --auto or TUI for manual mapping)');
  }

  log.info(`Using framework: ${framework}`);

  if (framework === 'astro') {
    // Astro path: delegate to Stitch MCP build_site
    log.step(3, 4, `Building Astro site with ${routes.length} routes...`);
    const adapter = new AstroAdapter(client);
    const result = await adapter.build({
      projectId,
      outputDir: 'dist',
      screens: routes.map((r) => ({
        screenId: r.screenId,
        route: r.route,
        name: r.name,
        html: '', // Astro adapter uses MCP buildSite, doesn't need HTML
      })),
    });

    log.step(4, 4, 'Site generated.');
    log.success('Site built successfully!');
    for (const instruction of result.instructions) {
      log.info(instruction);
    }
  } else {
    // Static / Next.js path: fetch HTML per screen, delegate to adapter
    log.step(3, 4, `Fetching screen code for ${routes.length} screens...`);
    const screenData: ScreenData[] = [];
    for (const route of routes) {
      const html = await client.getScreenCode(projectId, route.screenId);
      screenData.push({
        screenId: route.screenId,
        route: route.route,
        name: route.name,
        html,
      });
    }

    const adapter = getAdapter(framework);
    log.step(4, 4, `Building ${framework} site...`);
    const result = await adapter.build({
      projectId,
      outputDir: 'dist',
      screens: screenData,
    });

    log.success('Site built successfully!');
    log.info('');
    log.info(`Generated ${result.files.length} files.`);
    for (const instruction of result.instructions) {
      log.info(instruction);
    }
  }
}

function inferRoute(name: string, index: number): string {
  const normalized = name.toLowerCase().replace(/\s+/g, '-');
  if (index === 0 || /home|landing|hero|main/i.test(name)) return '/';
  return `/${normalized}`;
}

// ── Pre-build quality gate ─────────────────────────────────────────

interface GateEntry {
  name: string;
  lintScore: number;
  evalScore: number | null;
  status: 'PASS' | 'WARN' | 'FAIL';
}

interface GateResult {
  entries: GateEntry[];
  blocked: boolean;
  failCount: number;
}

function runPreBuildGate(): GateResult {
  const screensDir = join(process.cwd(), 'screens');
  const evalsDir = join(process.cwd(), 'evaluations');

  const entries: GateEntry[] = [];

  if (!existsSync(screensDir)) {
    return { entries, blocked: false, failCount: 0 };
  }

  const htmlFiles = readdirSync(screensDir).filter(f => f.endsWith('.html'));

  for (const file of htmlFiles) {
    const name = file.replace('.html', '');
    const htmlPath = join(screensDir, file);

    // Run lint via validateOutput
    let lintScore = 100;
    try {
      const html = readFileSync(htmlPath, 'utf-8');
      const result = validateOutput(html);
      lintScore = result.score;
    } catch {
      lintScore = 0;
    }

    // Check for evaluation score
    let evalScore: number | null = null;
    const evalPath = join(evalsDir, `${name}.eval.md`);
    if (existsSync(evalPath)) {
      try {
        const evalContent = readFileSync(evalPath, 'utf-8');
        const match = evalContent.match(/\*\*Overall:\s*(\d+)\/100/);
        if (match) {
          evalScore = parseInt(match[1], 10);
        }
      } catch {
        // skip
      }
    }

    // Determine status
    let status: GateEntry['status'] = 'PASS';
    if (lintScore < 50 || (evalScore !== null && evalScore < 40)) {
      status = 'FAIL';
    } else if (lintScore < 70 || (evalScore !== null && evalScore < 70)) {
      status = 'WARN';
    }

    entries.push({ name, lintScore, evalScore, status });
  }

  const failCount = entries.filter(e => e.status === 'FAIL').length;
  return { entries, blocked: failCount > 0, failCount };
}
