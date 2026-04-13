import { load } from 'cheerio';
import { existsSync, readFileSync } from 'node:fs';
import { getAllRules } from './rules/index.js';
import type { LintContext, LintRule } from './rules/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IssueCategory = 'color' | 'typography' | 'layout' | 'content' | 'structure' | 'slop' | 'accessibility';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: IssueCategory;
  message: string;
}

export interface CategoryScore {
  score: number;
  issues: number;
  maxPossible: number;
}

export interface ScoringBreakdown {
  typography: CategoryScore;
  color: CategoryScore;
  layout: CategoryScore;
  content: CategoryScore;
  structure: CategoryScore;
  slop: CategoryScore;
  accessibility: CategoryScore;
}

export interface OutputValidationResult {
  /** Overall quality score 0-100 */
  score: number;
  /** All detected issues */
  issues: ValidationIssue[];
  /** Whether the output passes the quality threshold (score >= 70) */
  passed: boolean;
  /** 0-100 confidence -- how much of the page we actually checked */
  confidence: number;
  /** Per-category score breakdown */
  breakdown: ScoringBreakdown;
}

// ---------------------------------------------------------------------------
// Scoring engine (Frente C: error=-20, warn=-10, info=-5, threshold=70)
// ---------------------------------------------------------------------------

const DEDUCTION: Record<ValidationIssue['type'], number> = {
  error: 20,
  warning: 10,
  info: 5,
};

const PASS_THRESHOLD = 70;

const ALL_CATEGORIES: IssueCategory[] = [
  'typography', 'color', 'layout', 'content', 'structure', 'slop', 'accessibility',
];

function computeBreakdown(
  issues: ValidationIssue[],
  rulesRanByCategory: Map<IssueCategory, number>,
): ScoringBreakdown {
  const breakdown = {} as ScoringBreakdown;

  for (const cat of ALL_CATEGORIES) {
    const catIssues = issues.filter(i => i.category === cat);
    const maxPossible = rulesRanByCategory.get(cat) ?? 0;
    const deductions = catIssues.reduce((sum, i) => sum + DEDUCTION[i.type], 0);
    const rawScore = maxPossible > 0 ? Math.max(0, 100 - deductions) : 100;

    breakdown[cat] = {
      score: rawScore,
      issues: catIssues.length,
      maxPossible,
    };
  }

  return breakdown;
}

function computeWeightedScore(
  breakdown: ScoringBreakdown,
  rulesRanByCategory: Map<IssueCategory, number>,
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const cat of ALL_CATEGORIES) {
    const weight = rulesRanByCategory.get(cat) ?? 0;
    if (weight > 0) {
      totalWeight += weight;
      weightedSum += breakdown[cat].score * weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate generated HTML against design system and quality rules.
 *
 * Uses the modular rule registry -- each check is an independent LintRule.
 * Returns an enhanced result with per-category breakdown and confidence metric.
 *
 * Scoring: error=-20, warning=-10, info=-5, threshold=70 (Frente C calibration).
 */
export function validateOutput(html: string, designMdPath?: string): OutputValidationResult {
  const $ = load(html);

  // Build shared context once for all rules
  const allStyles =
    $('style').text() +
    $('[style]')
      .map((_i, el) => $(el).attr('style'))
      .get()
      .join(' ');
  const allClasses = $('[class]')
    .map((_i, el) => $(el).attr('class'))
    .get()
    .join(' ');

  // Load DESIGN.md content
  const resolvedPath = designMdPath ?? 'DESIGN.md';
  const designMdContent = existsSync(resolvedPath) ? readFileSync(resolvedPath, 'utf-8') : undefined;

  const context: LintContext = {
    html,
    allStyles,
    allClasses,
    $,
    designMdContent,
  };

  // Run all applicable rules and track which ones ran
  const allRules = getAllRules();
  const allIssues: ValidationIssue[] = [];
  const rulesRanByCategory = new Map<IssueCategory, number>();
  const totalRulesAvailable = allRules.length;
  let rulesChecked = 0;

  for (const rule of allRules) {
    // Skip rules that require DESIGN.md when it is not available
    if (rule.requiresDesign && !designMdContent) {
      continue;
    }

    rulesChecked++;
    const cat = rule.category as IssueCategory;
    const count = rulesRanByCategory.get(cat) ?? 0;
    rulesRanByCategory.set(cat, count + 1);

    const ruleIssues = rule.check(context);
    allIssues.push(...ruleIssues);
  }

  // Calculate confidence: what fraction of rules could actually run
  const confidence = totalRulesAvailable > 0
    ? Math.round((rulesChecked / totalRulesAvailable) * 100)
    : 0;

  const breakdown = computeBreakdown(allIssues, rulesRanByCategory);

  // Calculate overall score as weighted average of category scores.
  // Each category is weighted by the number of rules that ran in it,
  // so categories with more rules have more influence on the final score.
  // This prevents the floor effect where many small issues across
  // categories would compound into 0/100 despite reasonable per-category scores.
  const score = computeWeightedScore(breakdown, rulesRanByCategory);

  return {
    score,
    issues: allIssues,
    passed: score >= PASS_THRESHOLD,
    confidence,
    breakdown,
  };
}

// ---------------------------------------------------------------------------
// Report formatter
// ---------------------------------------------------------------------------

/**
 * Format validation results for display.
 */
export function formatValidationReport(result: OutputValidationResult): string {
  const lines: string[] = [];

  const passLabel = result.passed ? 'PASS' : 'NEEDS REVIEW';
  lines.push(`Quality Score: ${result.score}/100 (${passLabel}) [confidence: ${result.confidence}%]`);
  lines.push('');

  // Category breakdown
  lines.push('Category Breakdown:');
  for (const cat of ALL_CATEGORIES) {
    const b = result.breakdown[cat];
    if (b.maxPossible > 0) {
      lines.push(`  ${cat.padEnd(14)} ${b.score}/100  (${b.issues} issue${b.issues !== 1 ? 's' : ''}, ${b.maxPossible} rule${b.maxPossible !== 1 ? 's' : ''} checked)`);
    } else {
      lines.push(`  ${cat.padEnd(14)} --  (no rules ran)`);
    }
  }
  lines.push('');

  if (result.issues.length === 0) {
    lines.push('No issues detected.');
    return lines.join('\n');
  }

  const errors = result.issues.filter(i => i.type === 'error');
  const warnings = result.issues.filter(i => i.type === 'warning');
  const infos = result.issues.filter(i => i.type === 'info');

  if (errors.length > 0) {
    lines.push('Errors:');
    errors.forEach(e => lines.push(`  [x] ${e.message}`));
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push('Warnings:');
    warnings.forEach(w => lines.push(`  [!] ${w.message}`));
    lines.push('');
  }

  if (infos.length > 0) {
    lines.push('Info:');
    infos.forEach(i => lines.push(`  [i] ${i.message}`));
  }

  return lines.join('\n');
}
