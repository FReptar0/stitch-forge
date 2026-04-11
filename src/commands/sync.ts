import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { log } from '../utils/logger.js';
import { getConfig, updateConfig } from '../utils/config.js';
import { StitchMcpClient } from '../mcp/client.js';

export async function runSync(projectId?: string): Promise<void> {
  const config = getConfig();
  const id = projectId || config.projectId;
  let client: StitchMcpClient;
  try {
    client = new StitchMcpClient();
  } catch (err) {
    log.error(err instanceof Error ? err.message : 'Failed to initialize Stitch client.');
    process.exit(1);
  }

  if (!id) {
    log.info('No project ID. Listing available projects...');
    const projects = await client.listProjects();
    if (projects.length === 0) {
      log.error('No projects found.');
      process.exit(1);
    }
    for (const p of projects) {
      log.info(`  ${p.id} — ${p.name}`);
    }
    log.info('Run: forge sync <project-id>');
    return;
  }

  if (!existsSync('screens')) mkdirSync('screens');

  log.step(1, 2, 'Fetching screens...');
  const screens = await client.listScreens(id);

  log.step(2, 2, `Downloading ${screens.length} screens...`);
  const screenRecords = [];

  for (const screen of screens) {
    const html = await client.getScreenCode(id, screen.id);
    const filename = `screens/${screen.name || screen.id}.html`;
    writeFileSync(filename, html);
    log.info(`  ${filename}`);

    screenRecords.push({
      id: screen.id,
      name: screen.name,
      lastSynced: new Date().toISOString(),
    });
  }

  updateConfig({
    projectId: id,
    screens: screenRecords,
    lastSync: new Date().toISOString(),
  });

  log.success(`Synced ${screens.length} screens from project.`);
}
