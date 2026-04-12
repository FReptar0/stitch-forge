import { log } from '../utils/logger.js';
import { getWorkflow, type WorkflowStep } from '../templates/workflows.js';

export async function runWorkflow(type?: string): Promise<void> {
  if (!type || !['redesign', 'new-app'].includes(type)) {
    log.info('Available workflows:');
    log.info('');
    log.info('  redesign   — Redesign an existing site with a fresh design system');
    log.info('               Start from DESIGN.md, then generate screens one by one.');
    log.info('');
    log.info('  new-app    — Build a new app from scratch');
    log.info('               Start with brainstorming, then refine and build.');
    log.info('');
    log.info('Usage: dg workflow <redesign|new-app>');
    return;
  }

  const steps = getWorkflow(type as 'redesign' | 'new-app');
  const title = type === 'redesign' ? 'Website Redesign' : 'New App from Scratch';

  log.info(`Workflow: ${title}`);
  log.info('');
  log.info('Follow these steps in order:');
  log.info('');

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const num = `${i + 1}`.padStart(2);
    const isManual = step.command === 'manual';
    const tag = isManual ? ' (manual step)' : '';
    const cmd = isManual ? '' : `  Command: ${step.command}`;

    log.info(`  ${num}. ${step.description}${tag}`);
    if (cmd) log.info(`      ${cmd}`);
    if (step.dependsOn) {
      log.info(`      (after: ${step.dependsOn})`);
    }
    log.info('');
  }

  log.info('Tip: Use the TUI (`dg tui`) for a guided interactive experience.');
}
