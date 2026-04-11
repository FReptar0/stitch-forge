import { getConfig } from './config.js';

export interface QuotaStatus {
  flash: { used: number; limit: number; remaining: number };
  pro: { used: number; limit: number; remaining: number };
  resetDate: string;
  warning?: string;
}

const LIMITS: Record<string, number> = {
  GEMINI_2_5_FLASH: 350,
  GEMINI_3_PRO: 200,
  GEMINI_3_FLASH: 350,
  GEMINI_3_1_PRO: 200,
};

export function getQuotaStatus(): QuotaStatus {
  const config = getConfig();
  const flashRemaining = LIMITS.GEMINI_2_5_FLASH - config.quota.flashUsed;
  const proRemaining = LIMITS.GEMINI_3_PRO - config.quota.proUsed;

  const status: QuotaStatus = {
    flash: { used: config.quota.flashUsed, limit: LIMITS.GEMINI_2_5_FLASH, remaining: flashRemaining },
    pro: { used: config.quota.proUsed, limit: LIMITS.GEMINI_3_PRO, remaining: proRemaining },
    resetDate: config.quota.resetDate,
  };

  if (flashRemaining <= 10 || proRemaining <= 10) {
    status.warning = `Low quota: Flash ${flashRemaining} remaining, Pro ${proRemaining} remaining. Resets ${config.quota.resetDate}.`;
  }

  return status;
}

export function canGenerate(model: 'GEMINI_3_PRO' | 'GEMINI_2_5_FLASH'): boolean {
  const status = getQuotaStatus();
  return model === 'GEMINI_2_5_FLASH'
    ? status.flash.remaining > 0
    : status.pro.remaining > 0;
}

export function formatQuotaBar(used: number, limit: number, width = 20): string {
  const filled = Math.round((used / limit) * width);
  const empty = width - filled;
  return `[${'='.repeat(filled)}${'-'.repeat(empty)}] ${used}/${limit}`;
}

export function formatQuotaDisplay(): string {
  const status = getQuotaStatus();
  const lines: string[] = [];

  lines.push(`Flash (fast)  ${formatQuotaBar(status.flash.used, status.flash.limit)}`);
  lines.push(`  ${status.flash.remaining} generations remaining this month`);
  lines.push('');
  lines.push(`Pro (quality) ${formatQuotaBar(status.pro.used, status.pro.limit)}`);
  lines.push(`  ${status.pro.remaining} generations remaining this month`);
  lines.push('');
  lines.push(`Resets: ${status.resetDate}`);

  if (status.warning) {
    lines.push('');
    lines.push(`Warning: ${status.warning}`);
  }

  return lines.join('\n');
}
