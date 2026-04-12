import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CONFIG_FILE = '.guardrc.json';

export interface StitchConfig {
  apiKey?: string;
  projectId?: string;
  projectName?: string;
  defaultModel: 'GEMINI_3_PRO' | 'GEMINI_2_5_FLASH';
  framework?: 'static' | 'astro' | 'nextjs';
  screens: Array<{
    id: string;
    name: string;
    route?: string;
    lastSynced?: string;
  }>;
  quota: {
    flashUsed: number;
    proUsed: number;
    resetDate: string; // ISO date of next monthly reset
  };
  lastSync?: string;
  lastResearch?: string;
}

const DEFAULT_CONFIG: StitchConfig = {
  defaultModel: 'GEMINI_2_5_FLASH',
  screens: [],
  quota: {
    flashUsed: 0,
    proUsed: 0,
    resetDate: getNextResetDate(),
  },
};

function getNextResetDate(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString().split('T')[0];
}

export function getConfigPath(): string {
  return join(process.cwd(), CONFIG_FILE);
}

export function configExists(): boolean {
  return existsSync(getConfigPath());
}

export function getConfig(): StitchConfig {
  const path = getConfigPath();
  if (!existsSync(path)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = readFileSync(path, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown error';
    console.error(`[dg] Warning: Failed to parse ${CONFIG_FILE}: ${msg}. Using defaults.`);
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: StitchConfig): void {
  const path = getConfigPath();
  writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
}

export function updateConfig(updates: Partial<StitchConfig>): StitchConfig {
  const config = { ...getConfig(), ...updates };
  saveConfig(config);
  return config;
}

export function incrementQuota(model: 'GEMINI_3_PRO' | 'GEMINI_2_5_FLASH'): StitchConfig {
  const config = getConfig();

  // Check if quota needs reset
  const now = new Date().toISOString().split('T')[0];
  if (now >= config.quota.resetDate) {
    config.quota.flashUsed = 0;
    config.quota.proUsed = 0;
    config.quota.resetDate = getNextResetDate();
  }

  if (model === 'GEMINI_2_5_FLASH') {
    config.quota.flashUsed++;
  } else {
    config.quota.proUsed++;
  }

  saveConfig(config);
  return config;
}
