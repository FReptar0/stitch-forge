import type { CrawlResult } from './crawler.js';

export interface DiffResult {
  hasChanges: boolean;
  changes: Change[];
}

export interface Change {
  category: 'models' | 'tools' | 'exports' | 'features' | 'limits' | 'other';
  description: string;
  severity: 'info' | 'warning' | 'breaking';
  source: string;
}

/**
 * Compare crawled content against known state to detect changes.
 * Uses keyword matching — not perfect, but catches major changes.
 * 
 * For Claude Code usage, the /research slash command uses web search
 * instead of crawling, which is more reliable.
 */
export function diffAgainstKnownState(
  crawlResults: CrawlResult[],
  knownState: Record<string, unknown>,
): DiffResult {
  const changes: Change[] = [];
  const allContent = crawlResults.map(r => r.content).join(' ').toLowerCase();

  // Check for new model mentions
  const modelPatterns = [
    { pattern: /gemini\s*4/i, desc: 'New Gemini 4 model detected' },
    { pattern: /gemini\s*3\.5/i, desc: 'New Gemini 3.5 model detected' },
  ];
  for (const { pattern, desc } of modelPatterns) {
    if (pattern.test(allContent)) {
      changes.push({ category: 'models', description: desc, severity: 'warning', source: 'docs' });
    }
  }

  // Check for new export options
  const exportPatterns = [
    { pattern: /export.*figma/i, exists: true },
    { pattern: /export.*react/i, desc: 'React export option detected' },
    { pattern: /export.*flutter/i, desc: 'Flutter export option detected' },
  ];
  for (const { pattern, desc } of exportPatterns) {
    if (desc && pattern.test(allContent)) {
      changes.push({ category: 'exports', description: desc, severity: 'info', source: 'docs' });
    }
  }

  // Check for quota changes
  if (/quota|limit|generation/i.test(allContent)) {
    const quotaMatch = allContent.match(/(\d+)\s*generation/i);
    if (quotaMatch) {
      const mentioned = parseInt(quotaMatch[1]);
      if (mentioned !== 350 && mentioned !== 50) {
        changes.push({
          category: 'limits',
          description: `Possible quota change detected: ${mentioned} generations mentioned`,
          severity: 'warning',
          source: 'docs',
        });
      }
    }
  }

  // Check for deprecated features
  if (/deprecat|removed|no longer/i.test(allContent)) {
    changes.push({
      category: 'features',
      description: 'Possible deprecation notice detected — review manually',
      severity: 'breaking',
      source: 'docs',
    });
  }

  return { hasChanges: changes.length > 0, changes };
}
