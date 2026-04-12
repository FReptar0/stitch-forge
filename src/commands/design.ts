import { writeFileSync, existsSync } from 'node:fs';
import { log } from '../utils/logger.js';
import { generateDesignMdTemplate, type DesignBrief } from '../templates/design-md.js';

export async function runDesign(briefText: string, opts?: { force?: boolean }): Promise<void> {
  if (existsSync('DESIGN.md') && !opts?.force) {
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

  if (!briefText.trim()) {
    log.error('Provide a brand brief. Example:');
    log.info('  dg design "Acme Corp, SaaS platform, startups, modern minimal"');
    process.exit(1);
  }

  // Parse brief text into structured brief
  // This is a minimal parser — Claude Code slash command provides richer input
  const parts = briefText.split(',').map(s => s.trim());
  const brief: DesignBrief = {
    companyName: parts[0] || 'Company',
    industry: parts[1] || 'Technology',
    targetAudience: parts[2] || 'Professionals',
    aesthetic: parts[3] || 'modern clean',
  };

  log.step(1, 2, `Generating DESIGN.md for ${brief.companyName}...`);
  const content = generateDesignMdTemplate(brief);

  log.step(2, 2, 'Writing DESIGN.md...');
  writeFileSync('DESIGN.md', content);

  log.success(`DESIGN.md created for ${brief.companyName}`);
  log.info('Review and fill in placeholder sections (marked with <!-- -->)');
  log.info('Then import into Stitch project for consistent generation.');
}
