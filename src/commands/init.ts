import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { log } from '../utils/logger.js';
import { saveConfig, getConfigPath, type StitchConfig } from '../utils/config.js';

export async function runInit(): Promise<void> {
  log.info('Initializing Design Guard project...');
  log.info('');

  // Step 1: API Key
  const apiKey = process.env.STITCH_API_KEY;
  if (apiKey) {
    log.success('API key found in environment.');

    // Validate API key with a test call
    try {
      const response = await fetch('https://stitch.googleapis.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({ method: 'tools/call', params: { name: 'list_projects', arguments: {} } }),
      });
      if (response.ok) {
        log.success('API key verified — connection to Stitch works!');
      } else {
        log.warn('API key set but connection test failed. It may still work with MCP proxy.');
      }
    } catch {
      log.warn('Could not reach Stitch API directly. This is fine if using MCP proxy.');
    }
  } else {
    log.warn('No API key found. You need one to generate screens.');
    log.info('');
    log.info('How to get your API key:');
    log.info('  1. Go to stitch.withgoogle.com');
    log.info('  2. Open Settings (gear icon)');
    log.info('  3. Copy your API Key');
    log.info('  4. Add it to your .env file: STITCH_API_KEY=your-key-here');
    log.info('');
  }

  // Step 2: Create config
  if (existsSync(getConfigPath())) {
    log.warn('.guardrc.json already exists. Keeping current config.');
  } else {
    const config: StitchConfig = {
      apiKey: apiKey || undefined,
      defaultModel: 'GEMINI_2_5_FLASH',
      framework: 'static',
      screens: [],
      quota: {
        flashUsed: 0,
        proUsed: 0,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          .toISOString().split('T')[0],
      },
    };
    saveConfig(config);
    log.success('Created .guardrc.json');
    log.info('Default build framework: static (change with --framework or in .guardrc.json)');
  }

  // Step 3: Create .env if missing
  if (!existsSync('.env') && !apiKey) {
    writeFileSync('.env', 'STITCH_API_KEY=\nGOOGLE_CLOUD_PROJECT=\n');
    log.success('Created .env — add your API key there.');
  }

  // Step 4: Create screens directory
  if (!existsSync('screens')) {
    mkdirSync('screens');
    log.success('Created screens/ directory');
  }

  // Step 5: Create .mcp.json for Claude Code if missing
  if (!existsSync('.mcp.json')) {
    const mcpConfig = {
      mcpServers: {
        stitch: {
          command: 'npx',
          args: ['@_davideast/stitch-mcp', 'proxy'],
          env: { STITCH_API_KEY: '${STITCH_API_KEY}' },
        },
      },
    };
    writeFileSync('.mcp.json', JSON.stringify(mcpConfig, null, 2) + '\n');
    log.success('Created .mcp.json for Claude Code integration.');
  }

  // Next steps
  log.info('');
  log.success('Project initialized!');
  log.info('');
  log.info('Next steps:');
  log.info('  1. dg design "Company, Industry, Audience, Style"  — Create your design system');
  log.info('  2. dg generate "A landing page for..."              — Generate a screen');
  log.info('  3. dg build --auto                                  — Build your site');
  log.info('');
  log.info('Or run `dg workflow` to see guided step-by-step workflows.');
  log.info('Or run `dg tui` for the interactive terminal interface.');
}
