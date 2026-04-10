import { load } from 'cheerio';

export interface CrawlResult {
  source: string;
  url: string;
  content: string;
  fetchedAt: string;
}

const SOURCES = [
  {
    name: 'Stitch Docs',
    url: 'https://stitch.withgoogle.com/docs/',
  },
  {
    name: 'Google Blog - Stitch',
    url: 'https://blog.google/technology/ai/stitch-ai-ui-design/',
  },
];

/**
 * Fetch and extract text content from Stitch documentation sources.
 * Used by the research command to detect changes.
 */
export async function crawlSources(): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];

  for (const source of SOURCES) {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'StitchFramework/0.1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        results.push({
          source: source.name,
          url: source.url,
          content: `[FETCH_ERROR: ${response.status}]`,
          fetchedAt: new Date().toISOString(),
        });
        continue;
      }

      const html = await response.text();
      const $ = load(html);

      // Remove scripts, styles, nav, footer
      $('script, style, nav, footer, header').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim();

      results.push({
        source: source.name,
        url: source.url,
        content: text.slice(0, 10000), // Cap at 10k chars
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        source: source.name,
        url: source.url,
        content: `[ERROR: ${error instanceof Error ? error.message : 'unknown'}]`,
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}
