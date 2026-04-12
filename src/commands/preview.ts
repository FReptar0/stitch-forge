import { log } from '../utils/logger.js';
import { openInBrowser, listScreenFiles, resolveScreenPath, openAllScreens } from '../utils/preview.js';

interface PreviewOptions {
  all?: boolean;
}

export async function runPreview(screenName?: string, opts: PreviewOptions = {}): Promise<void> {
  if (opts.all) {
    const files = listScreenFiles();
    if (files.length === 0) {
      log.error('No screens found in screens/. Run `dg generate` first.');
      process.exit(1);
    }
    await openAllScreens();
    log.success(`Opened ${files.length} screens in browser.`);
    return;
  }

  if (screenName) {
    const path = resolveScreenPath(screenName);
    if (!path) {
      log.error(`Screen not found: ${screenName}`);
      const available = listScreenFiles();
      if (available.length > 0) {
        log.info('Available screens:');
        available.forEach(s => log.info(`  ${s}`));
      }
      process.exit(1);
    }
    await openInBrowser(path);
    log.success(`Opened ${screenName} in browser.`);
    return;
  }

  // No arguments: list and let user pick
  const files = listScreenFiles();
  if (files.length === 0) {
    log.error('No screens found in screens/. Run `dg generate` first.');
    process.exit(1);
  }

  log.info('Available screens:');
  files.forEach((s, i) => log.info(`  ${i + 1}. ${s}`));
  log.info('');
  log.info('Usage: dg preview <screen-name>');
  log.info('       dg preview --all');
}
