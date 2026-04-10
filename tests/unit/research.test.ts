import { describe, it, expect } from 'vitest';
import { diffAgainstKnownState } from '../../src/research/differ.js';
import type { CrawlResult } from '../../src/research/crawler.js';

const baseKnownState = {
  models: [{ id: 'GEMINI_3_PRO' }, { id: 'GEMINI_2_5_FLASH' }],
  promptMaxChars: 5000,
};

function makeCrawl(content: string): CrawlResult[] {
  return [{ source: 'test', url: 'https://test.com', content, fetchedAt: new Date().toISOString() }];
}

describe('diffAgainstKnownState', () => {
  it('detects no changes when content matches known state', () => {
    const result = diffAgainstKnownState(
      makeCrawl('Stitch uses Gemini 2.5 Flash for fast generation.'),
      baseKnownState,
    );
    expect(result.hasChanges).toBe(false);
  });

  it('detects new model mention', () => {
    const result = diffAgainstKnownState(
      makeCrawl('Now powered by Gemini 4 for even better results.'),
      baseKnownState,
    );
    expect(result.hasChanges).toBe(true);
    expect(result.changes[0].category).toBe('models');
  });

  it('detects deprecation notices', () => {
    const result = diffAgainstKnownState(
      makeCrawl('The canvas export feature has been deprecated.'),
      baseKnownState,
    );
    expect(result.hasChanges).toBe(true);
    expect(result.changes[0].severity).toBe('breaking');
  });

  it('detects quota changes', () => {
    const result = diffAgainstKnownState(
      makeCrawl('Users now get 500 generations per month.'),
      baseKnownState,
    );
    expect(result.hasChanges).toBe(true);
    expect(result.changes[0].category).toBe('limits');
  });
});
