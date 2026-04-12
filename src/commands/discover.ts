import { writeFileSync, existsSync } from 'node:fs';
import { log } from '../utils/logger.js';
import { researchBusiness } from '../research/business-researcher.js';
import { synthesizeDesign } from '../research/design-synthesizer.js';
import { cacheResearch } from '../research/research-cache.js';
import { formatDesignQualityReport } from '../utils/design-validator.js';
import type { BusinessBrief } from '../research/types.js';

interface DiscoverOptions {
  force?: boolean;
  url?: string;
  competitors?: string;
  locale?: string;
  noResearch?: boolean;
}

export async function runDiscover(briefText: string, opts: DiscoverOptions): Promise<void> {
  if (!briefText.trim()) {
    log.error('Provide a business brief. Example:');
    log.info('  dg discover "Tiendas 3B, hard-discount retail, Mexican families, confident warm" --url https://tiendas3b.com');
    process.exit(1);
  }

  // Check existing DESIGN.md
  if (existsSync('DESIGN.md') && !opts.force) {
    const rl = await import('node:readline');
    const iface = rl.createInterface({ input: process.stdin, output: process.stderr });
    const answer = await new Promise<string>(resolve => {
      iface.question('DESIGN.md already exists. Overwrite? (y/N) ', resolve);
    });
    iface.close();
    if (answer.toLowerCase() !== 'y') {
      log.info('Skipped. Use --force to overwrite without asking.');
      return;
    }
  }

  // Parse brief
  const parts = briefText.split(',').map(s => s.trim());
  const brief: BusinessBrief = {
    companyName: parts[0] || 'Company',
    industry: parts[1] || 'Technology',
    targetAudience: parts[2] || 'Professionals',
    aesthetic: parts[3] || 'modern confident',
    websiteUrl: opts.url,
    competitorUrls: opts.competitors?.split(',').map(s => s.trim()),
    locale: opts.locale,
  };

  if (opts.noResearch) {
    // Fall back to static template
    log.info('Research disabled. Using industry presets...');
    const { generateDesignMdTemplate } = await import('../templates/design-md.js');
    const content = generateDesignMdTemplate(brief);
    writeFileSync('DESIGN.md', content);
    log.success(`DESIGN.md created for ${brief.companyName} (preset mode)`);
    return;
  }

  // Research phase
  log.step(1, 4, `Researching ${brief.companyName}...`);
  const research = await researchBusiness(brief);

  log.info(`  Research confidence: ${research.confidence}%`);
  if (research.currentSite) {
    log.info(`  Current site analyzed: ${research.currentSite.url}`);
    log.info(`  Colors found: ${research.currentSite.palette.colors.length}`);
    log.info(`  Fonts found: ${research.currentSite.typography.fonts.join(', ') || 'none detected'}`);
  }
  if (research.competitors.length > 0) {
    log.info(`  Competitors analyzed: ${research.competitors.map(c => c.name).join(', ')}`);
  }
  if (research.fallbacksUsed.length > 0) {
    log.warn(`  Fallbacks used: ${research.fallbacksUsed.join(', ')}`);
  }

  // Synthesis phase
  log.step(2, 4, 'Synthesizing design system...');
  const design = synthesizeDesign(research);

  // Quality check
  log.step(3, 4, 'Validating quality...');
  log.info('');
  log.info(formatDesignQualityReport(design.qualityScore));
  log.info('');
  log.info(`  Token estimate: ${design.tokenEstimate} (limit: 3000)`);
  log.info(`  Data sources: ${design.sources.join(', ')}`);

  // Write
  log.step(4, 4, 'Writing DESIGN.md...');
  writeFileSync('DESIGN.md', design.markdown);

  // Cache research
  try {
    cacheResearch(brief.companyName, research);
    log.info('  Research cached to .dg-research/');
  } catch { /* cache failure is not critical */ }

  log.success(`DESIGN.md created for ${brief.companyName}`);
  log.info(`  Quality: ${design.qualityScore.total}/100`);

  if (design.qualityScore.total < 60) {
    log.warn('Quality is below 60. Consider providing a website URL (--url) or competitor URLs (--competitors) for better results.');
  }

  log.info('');
  log.info('Next steps:');
  log.info('  1. Review DESIGN.md and adjust colors/fonts if needed');
  log.info('  2. Run `dg generate` to create your first screen');
  log.info('  3. Or use `/dg-generate` in Claude Code');
}
