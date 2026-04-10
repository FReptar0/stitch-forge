import { log } from '../utils/logger.js';
import { crawlSources } from '../research/crawler.js';
import { diffAgainstKnownState } from '../research/differ.js';
import { getKnownState, updateKnownState, isStale, getLastUpdated } from '../research/updater.js';

export async function runResearch(topic?: string): Promise<void> {
  const lastUpdated = getLastUpdated();
  log.info(`Knowledge base last updated: ${lastUpdated.toISOString().split('T')[0]}`);

  if (isStale()) {
    log.warn('Knowledge base is over 30 days old. Running full update...');
  }

  log.step(1, 3, 'Crawling Stitch documentation sources...');
  const crawlResults = await crawlSources();

  const successCount = crawlResults.filter(r => !r.content.startsWith('[')).length;
  const failCount = crawlResults.length - successCount;
  log.info(`  Fetched ${successCount} sources${failCount > 0 ? `, ${failCount} failed` : ''}`);

  log.step(2, 3, 'Comparing against known state...');
  const knownState = getKnownState();
  const diff = diffAgainstKnownState(crawlResults, knownState);

  if (!diff.hasChanges) {
    log.success('No changes detected. Knowledge base is current.');
    return;
  }

  log.step(3, 3, `Found ${diff.changes.length} change(s). Updating...`);

  for (const change of diff.changes) {
    const icon = change.severity === 'breaking' ? '🔴' : change.severity === 'warning' ? '🟡' : '🟢';
    log.info(`  ${icon} [${change.category}] ${change.description}`);
  }

  updateKnownState(diff.changes);

  log.success(`Knowledge base updated. ${diff.changes.length} change(s) recorded.`);

  const breaking = diff.changes.filter(c => c.severity === 'breaking');
  if (breaking.length > 0) {
    log.warn('BREAKING CHANGES detected. Review and update framework accordingly:');
    for (const b of breaking) {
      log.warn(`  → ${b.description}`);
    }
  }
}
