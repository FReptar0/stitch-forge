import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { BusinessResearchResult, SiteAnalysis } from './types.js';

const CACHE_DIR = '.dg-research';
const CACHE_TTL_DAYS = 7;

function ensureCacheDir(): string {
  const dir = join(process.cwd(), CACHE_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function hashKey(key: string): string {
  return createHash('md5').update(key).digest('hex').slice(0, 12);
}

export function isCacheValid(cachedAt: string, ttlDays = CACHE_TTL_DAYS): boolean {
  const cached = new Date(cachedAt).getTime();
  const now = Date.now();
  return (now - cached) < ttlDays * 24 * 60 * 60 * 1000;
}

export function cacheResearch(companyName: string, result: BusinessResearchResult): void {
  const dir = ensureCacheDir();
  writeFileSync(join(dir, 'latest.json'), JSON.stringify(result, null, 2) + '\n');
  writeFileSync(join(dir, `${hashKey(companyName)}.json`), JSON.stringify(result, null, 2) + '\n');
}

export function getCachedResearch(companyName: string): BusinessResearchResult | null {
  const dir = join(process.cwd(), CACHE_DIR);
  const file = join(dir, `${hashKey(companyName)}.json`);
  if (!existsSync(file)) return null;
  try {
    const data = JSON.parse(readFileSync(file, 'utf-8')) as BusinessResearchResult;
    if (isCacheValid(data.researchedAt)) return data;
    return null;
  } catch { return null; }
}

export function cacheSiteAnalysis(url: string, analysis: SiteAnalysis): void {
  const dir = ensureCacheDir();
  const sitesDir = join(dir, 'sites');
  if (!existsSync(sitesDir)) mkdirSync(sitesDir, { recursive: true });
  writeFileSync(join(sitesDir, `${hashKey(url)}.json`), JSON.stringify(analysis, null, 2) + '\n');
}

export function getCachedSiteAnalysis(url: string): SiteAnalysis | null {
  const dir = join(process.cwd(), CACHE_DIR, 'sites');
  const file = join(dir, `${hashKey(url)}.json`);
  if (!existsSync(file)) return null;
  try {
    const data = JSON.parse(readFileSync(file, 'utf-8')) as SiteAnalysis;
    if (isCacheValid(data.fetchedAt)) return data;
    return null;
  } catch { return null; }
}
