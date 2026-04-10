import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { log } from '../utils/logger.js';
import { validatePrompt } from '../utils/validators.js';
import { canGenerate, getQuotaStatus } from '../utils/quota.js';
import { incrementQuota } from '../utils/config.js';
import { buildInitialPrompt, type ScreenSpec } from '../templates/prompts.js';
import { StitchMcpClient } from '../mcp/client.js';

interface GenerateOptions {
  model: string;
  project?: string;
  preview?: boolean;
}

export async function runGenerate(description: string, opts: GenerateOptions): Promise<void> {
  const model = opts.model === 'pro' ? 'GEMINI_3_PRO' as const : 'GEMINI_2_5_FLASH' as const;

  // Check quota
  if (!canGenerate(model)) {
    const status = getQuotaStatus();
    log.error(`No ${model} generations remaining. Resets ${status.resetDate}.`);
    process.exit(1);
  }

  // Check for DESIGN.md
  const hasDesignMd = existsSync('DESIGN.md');
  if (!hasDesignMd) {
    log.warn('No DESIGN.md found. Screens may be inconsistent. Run `forge design` first.');
  }

  // Build prompt
  // For CLI usage, the description IS the prompt
  // For Claude Code slash command, a structured ScreenSpec is built
  const prompt = description;

  // Validate
  const validation = validatePrompt(prompt);
  if (!validation.valid) {
    for (const error of validation.errors) {
      log.error(error);
    }
    process.exit(1);
  }

  // Get project ID
  const client = new StitchMcpClient();
  let projectId = opts.project;

  if (!projectId) {
    log.info('No project ID specified. Listing projects...');
    const projects = await client.listProjects();
    if (projects.length === 0) {
      log.error('No Stitch projects found. Create one at stitch.withgoogle.com first.');
      process.exit(1);
    }
    // Use first project as default
    // TODO: Interactive selection via TUI
    projectId = projects[0].id;
    log.info(`Using project: ${projects[0].name} (${projectId})`);
  }

  // Generate
  log.step(1, 3, `Sending prompt to Stitch (${model})...`);
  const result = await client.generateScreen(projectId, prompt, model);

  log.step(2, 3, 'Retrieving screen code...');
  const html = await client.getScreenCode(projectId, result.screenId);

  log.step(3, 3, 'Saving...');
  if (!existsSync('screens')) mkdirSync('screens');
  const filename = `screens/${result.name || result.screenId}.html`;
  writeFileSync(filename, html);

  // Update quota
  incrementQuota(model);
  const status = getQuotaStatus();

  log.success(`Screen saved: ${filename}`);
  log.quota(model, model === 'GEMINI_2_5_FLASH' ? status.flash.used : status.pro.used,
    model === 'GEMINI_2_5_FLASH' ? status.flash.limit : status.pro.limit);

  if (opts.preview) {
    const { openInBrowser } = await import('../utils/preview.js');
    await openInBrowser(filename);
    log.info('Preview opened in browser.');
  }
}
