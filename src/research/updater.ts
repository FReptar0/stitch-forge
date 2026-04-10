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

  // Apply detected changes as notes
  if (!Array.isArray(state.detectedChanges)) {
    state.detectedChanges = [];
  }
  for (const change of changes) {
    (state.detectedChanges as unknown[]).push({
      date: new Date().toISOString(),
      ...change,
    });
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
