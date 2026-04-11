import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Change } from './differ.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWN_STATE_PATH = join(__dirname, 'known-state.json');

export function getKnownState(): Record<string, unknown> {
  const raw = readFileSync(KNOWN_STATE_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function updateKnownState(changes: Change[]): void {
  const state = getKnownState();
  state.lastUpdated = new Date().toISOString();

  if (!Array.isArray(state.detectedChanges)) {
    state.detectedChanges = [];
  }

  const existing = state.detectedChanges as Array<Record<string, unknown> & { category?: string; description?: string }>;

  for (const change of changes) {
    const isDuplicate = existing.some(
      e => e.category === change.category && e.description === change.description
    );
    if (!isDuplicate) {
      existing.push({
        date: new Date().toISOString(),
        ...change,
      });
    }
  }

  // Keep only the last 50 changes
  if (existing.length > 50) {
    state.detectedChanges = existing.slice(-50);
  }

  writeFileSync(KNOWN_STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

export function getLastUpdated(): Date {
  const state = getKnownState();
  return new Date(state.lastUpdated as string);
}

export function isStale(thresholdDays = 30): boolean {
  const lastUpdated = getLastUpdated();
  const now = new Date();
  const diffMs = now.getTime() - lastUpdated.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}
