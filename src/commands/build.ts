import { log } from '../utils/logger.js';
import { getConfig } from '../utils/config.js';
import { StitchMcpClient } from '../mcp/client.js';

interface BuildOptions {
  project?: string;
  auto?: boolean;
}

export async function runBuild(opts: BuildOptions): Promise<void> {
  const config = getConfig();
  const projectId = opts.project || config.projectId;

  if (!projectId) {
    log.error('No project ID. Use --project <id> or run `forge init` first.');
    process.exit(1);
  }

  const client = new StitchMcpClient();

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
  }));

  if (!opts.auto) {
    // TODO: Interactive route mapping via TUI
    log.info('Auto-mapping screens to routes (use --auto or TUI for manual mapping)');
  }

  log.step(2, 3, `Building site with ${routes.length} routes...`);
  const result = await client.buildSite(projectId, routes);

  log.step(3, 3, 'Site generated.');

  log.success('Site built successfully!');
  log.info('');
  log.info('Your site is ready in the dist/ folder with these pages:');
  for (const page of result.pages) {
    log.info(`  ${page.route}`);
  }
  log.info('');
  log.info('To preview: open any .html file in dist/ in your browser.');
  log.info('To deploy:  upload the dist/ folder to any static hosting (Netlify, Vercel, GitHub Pages).');
}

function inferRoute(name: string, index: number): string {
  const normalized = name.toLowerCase().replace(/\s+/g, '-');
  if (index === 0 || /home|landing|hero|main/i.test(name)) return '/';
  return `/${normalized}`;
}
