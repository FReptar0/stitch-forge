import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { getForgeSignature, type Framework, type FrameworkAdapter, type BuildContext, type BuildResult } from './types.js';

export class StaticAdapter implements FrameworkAdapter {
  readonly name: Framework = 'static';

  async build(context: BuildContext): Promise<BuildResult> {
    const { outputDir, screens } = context;
    const files: string[] = [];

    // Build navigation HTML
    const navHtml = this.buildNav(screens);

    for (const screen of screens) {
      const $ = cheerio.load(screen.html);

      // Inject navigation at top of <body>
      $('body').prepend(navHtml);

      // Determine file path
      const filePath = this.routeToFilePath(outputDir, screen.route);
      const dir = filePath.substring(0, filePath.lastIndexOf('/'));
      mkdirSync(dir, { recursive: true });
      writeFileSync(filePath, getForgeSignature() + $.html());
      files.push(filePath);
    }

    return {
      files,
      instructions: ['Open dist/index.html in your browser'],
    };
  }

  private buildNav(screens: { route: string; name: string }[]): string {
    const links = screens
      .map((s) => `<a href="${s.route === '/' ? '/index.html' : s.route + '/index.html'}" style="margin-right:1rem;">${s.name}</a>`)
      .join('\n    ');
    return `<nav data-forge-nav style="padding:0.5rem 1rem;background:#f0f0f0;border-bottom:1px solid #ddd;display:flex;gap:0.5rem;">\n    ${links}\n  </nav>`;
  }

  private routeToFilePath(outputDir: string, route: string): string {
    if (route === '/') {
      return join(outputDir, 'index.html');
    }
    // Strip leading slash, create directory structure
    const cleanRoute = route.replace(/^\//, '');
    return join(outputDir, cleanRoute, 'index.html');
  }
}
