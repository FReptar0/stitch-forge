import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { configExists, getConfig } from './config.js';
import { getQuotaStatus } from './quota.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HintLevel = 'blocker' | 'warning' | 'ok' | 'info';

export interface Hint {
  level: HintLevel;
  message: string;
  /** Suggested skill to run next */
  action?: string;
}

export interface AdvisorReport {
  hints: Hint[];
  /** Single best next action, if any */
  suggestedNext?: string;
}

// ---------------------------------------------------------------------------
// State readers
// ---------------------------------------------------------------------------

function designMdExists(): boolean {
  return existsSync(join(process.cwd(), 'DESIGN.md'));
}

/**
 * Check whether business research has been completed.
 * Returns true only if `.dg-research/` exists AND contains at least one JSON file.
 */
export function researchExists(): boolean {
  const dir = join(process.cwd(), '.dg-research');
  if (!existsSync(dir)) return false;
  return readdirSync(dir).some(f => f.endsWith('.json'));
}

function getScreenFiles(): string[] {
  const dir = join(process.cwd(), 'screens');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.html'));
}

interface EvalScore {
  screen: string;
  score: number;
}

function getEvaluationScores(): EvalScore[] {
  const dir = join(process.cwd(), 'evaluations');
  if (!existsSync(dir)) return [];

  const scores: EvalScore[] = [];
  for (const file of readdirSync(dir).filter(f => f.endsWith('.eval.md'))) {
    try {
      const content = readFileSync(join(dir, file), 'utf-8');
      const match = content.match(/\*\*Overall:\s*(\d+)\/100/);
      if (match) {
        scores.push({
          screen: file.replace('.eval.md', ''),
          score: parseInt(match[1], 10),
        });
      }
    } catch {
      // skip unreadable files
    }
  }
  return scores;
}

function getScreensWithoutEvals(screens: string[], evals: EvalScore[]): string[] {
  const evaluated = new Set(evals.map(e => e.screen));
  return screens
    .map(f => f.replace('.html', ''))
    .filter(name => !evaluated.has(name));
}

// ---------------------------------------------------------------------------
// Hint generation
// ---------------------------------------------------------------------------

export function getAdvisorReport(): AdvisorReport {
  const hints: Hint[] = [];

  // 1. Config check
  const hasConfig = configExists();
  if (!hasConfig) {
    hints.push({
      level: 'info',
      message: 'No .guardrc.json found — run /dg-generate to create a project',
      action: '/dg-generate',
    });
  }

  // 2. DESIGN.md check (research-aware)
  const hasDesign = designMdExists();
  const hasResearch = researchExists();

  if (!hasDesign && !hasResearch) {
    hints.push({
      level: 'blocker',
      message: 'No business research found. Run /dg-discover to research the business before designing.',
      action: '/dg-discover',
    });
  } else if (!hasDesign && hasResearch) {
    hints.push({
      level: 'blocker',
      message: 'DESIGN.md missing. Research exists — run /dg-design to generate from existing research.',
      action: '/dg-design',
    });
  } else {
    hints.push({ level: 'ok', message: 'DESIGN.md present' });
  }

  // 3. Screen inventory
  const screens = getScreenFiles();
  if (screens.length === 0) {
    hints.push({
      level: 'info',
      message: 'No screens generated yet',
      action: '/dg-generate',
    });
  } else {
    hints.push({
      level: 'ok',
      message: `${screens.length} screen${screens.length !== 1 ? 's' : ''} generated`,
    });
  }

  // 4. Evaluation coverage
  const evals = getEvaluationScores();
  const unevaluated = getScreensWithoutEvals(screens, evals);

  if (screens.length > 0 && unevaluated.length > 0) {
    hints.push({
      level: 'warning',
      message: `${unevaluated.length} screen${unevaluated.length !== 1 ? 's' : ''} not evaluated — run /dg-evaluate before building`,
      action: `/dg-evaluate screens/${unevaluated[0]}.html`,
    });
  }

  // 5. Low-scoring screens
  const failing = evals.filter(e => e.score < 50);
  const marginal = evals.filter(e => e.score >= 50 && e.score < 70);

  for (const f of failing) {
    hints.push({
      level: 'warning',
      message: `Screen "${f.screen}" scored ${f.score}/100 — needs refinement before build`,
      action: `/dg-generate`,
    });
  }
  for (const m of marginal) {
    hints.push({
      level: 'info',
      message: `Screen "${m.screen}" scored ${m.score}/100 — consider refinement`,
    });
  }

  // 6. Quota status
  if (hasConfig) {
    const quota = getQuotaStatus();
    const flashPct = Math.round((quota.flash.used / quota.flash.limit) * 100);
    const proPct = Math.round((quota.pro.used / quota.pro.limit) * 100);

    if (quota.flash.remaining <= 0 || quota.pro.remaining <= 0) {
      const exhausted = quota.flash.remaining <= 0 ? 'Flash' : 'Pro';
      hints.push({
        level: 'blocker',
        message: `${exhausted} quota exhausted — resets ${quota.resetDate}`,
      });
    } else if (quota.warning) {
      hints.push({ level: 'warning', message: quota.warning });
    }

    hints.push({
      level: 'info',
      message: `Quota: Flash ${quota.flash.used}/${quota.flash.limit} (${flashPct}%), Pro ${quota.pro.used}/${quota.pro.limit} (${proPct}%)`,
    });
  }

  // 7. Build readiness
  if (screens.length > 0 && failing.length === 0 && unevaluated.length === 0) {
    hints.push({
      level: 'ok',
      message: 'All screens evaluated and passing — ready to build',
      action: '/dg-build',
    });
  }

  // Determine suggested next action (first blocker > first warning > first info with action)
  const suggestedNext =
    hints.find(h => h.level === 'blocker' && h.action)?.action ??
    hints.find(h => h.level === 'warning' && h.action)?.action ??
    hints.find(h => h.level === 'info' && h.action)?.action;

  return { hints, suggestedNext };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const LEVEL_FORMAT: Record<HintLevel, (msg: string) => string> = {
  blocker: (msg) => `${chalk.red('■')} ${chalk.red(msg)}`,
  warning: (msg) => `${chalk.yellow('⚠')} ${chalk.yellow(msg)}`,
  ok: (msg) => `${chalk.green('●')} ${msg}`,
  info: (msg) => `${chalk.blue('●')} ${chalk.dim(msg)}`,
};

export function formatAdvisorLines(report: AdvisorReport): string[] {
  const lines: string[] = [];

  for (const hint of report.hints) {
    lines.push(LEVEL_FORMAT[hint.level](hint.message));
  }

  if (report.suggestedNext) {
    lines.push('');
    lines.push(`${chalk.bold('Suggested next:')} ${chalk.cyan(report.suggestedNext)}`);
  }

  return lines;
}
