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
    log.error('No project ID. Use --project <id> or run `forge init` first.');
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

  log.step(1, 3, 'Fetching screens...');
  const screens = await client.listScreens(projectId);

  if (screens.length === 0) {
    log.error('No screens in project. Run `forge generate` first.');
    process.exit(1);
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
    log.step(2, 3, `Building Astro site with ${routes.length} routes...`);
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

    log.step(3, 3, 'Site generated.');
    log.success('Site built successfully!');
    for (const instruction of result.instructions) {
      log.info(instruction);
    }
  } else {
    // Static / Next.js path: fetch HTML per screen, delegate to adapter
    log.step(2, 3, `Fetching screen code for ${routes.length} screens...`);
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
    log.step(3, 3, `Building ${framework} site...`);
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
