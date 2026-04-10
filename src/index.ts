#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('forge')
  .description('Stitch Forge — CLI framework for automating web design with Google Stitch')
  .version('0.1.0');

program
  .command('init')
  .description('Setup project: authenticate and create .forgerc.json')
  .action(async () => {
    const { runInit } = await import('./commands/init.js');
    await runInit();
  });

program
  .command('design')
  .description('Generate a DESIGN.md from a brand brief')
  .argument('[brief...]', 'Brand brief description')
  .action(async (brief: string[]) => {
    const { runDesign } = await import('./commands/design.js');
    await runDesign(brief.join(' '));
  });

program
  .command('generate')
  .description('Generate a screen in Stitch from a description')
  .argument('<description...>', 'Screen description')
  .option('-m, --model <model>', 'Model to use (flash|pro)', 'flash')
  .option('-p, --project <id>', 'Stitch project ID')
  .action(async (description: string[], opts) => {
    const { runGenerate } = await import('./commands/generate.js');
    await runGenerate(description.join(' '), opts);
  });

program
  .command('build')
  .description('Build a deployable site from Stitch screens')
  .option('-p, --project <id>', 'Stitch project ID')
  .option('--auto', 'Auto-map screen names to routes')
  .option('-f, --framework <type>', 'Output framework: static, astro, nextjs')
  .action(async (opts) => {
    const { runBuild } = await import('./commands/build.js');
    await runBuild(opts);
  });

program
  .command('sync')
  .description('Sync local files with Stitch project')
  .argument('[projectId]', 'Stitch project ID')
  .action(async (projectId?: string) => {
    const { runSync } = await import('./commands/sync.js');
    await runSync(projectId);
  });

program
  .command('research')
  .description('Check for Stitch updates and refresh knowledge base')
  .option('-t, --topic <topic>', 'Specific topic to research')
  .action(async (opts) => {
    const { runResearch } = await import('./commands/research.js');
    await runResearch(opts.topic);
  });

program
  .command('tui')
  .description('Launch interactive terminal UI')
  .action(async () => {
    const { renderApp } = await import('./tui/App.js');
    renderApp();
  });

program
  .command('workflow')
  .description('Show guided workflow steps for common design tasks')
  .argument('[type]', 'Workflow type: redesign or new-app')
  .action(async (type?: string) => {
    const { runWorkflow } = await import('./commands/workflow.js');
    await runWorkflow(type);
  });

program
  .command('quota')
  .description('Show current generation quota usage')
  .action(async () => {
    const { formatQuotaDisplay } = await import('./utils/quota.js');
    console.log(formatQuotaDisplay());
  });

program.parse();
