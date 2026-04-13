import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Flags pages where all buttons look the same (no visual hierarchy).
 *
 * Anti-slop-design.md: "Every Button Is Primary"
 * Use 1 primary (filled), 1-2 secondary (outlined/muted), rest ghost.
 */
export const noAllButtonsPrimary: LintRule = {
  id: 'no-all-buttons-primary',
  name: 'No All Buttons Primary',
  description: 'Flags pages where all buttons share the same visual style.',
  severity: 'warning',
  category: 'slop',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    const buttons = $('button, a[class*="btn"], a[class*="button"], [role="button"]');
    if (buttons.length < 3) return issues;

    // Extract visual style fingerprint for each button
    const styleFingerprints = new Set<string>();
    buttons.each((_i, el) => {
      const cls = $(el).attr('class') || '';
      const style = $(el).attr('style') || '';

      // Extract key visual indicators
      const indicators: string[] = [];

      // Background color classes
      const bgMatch = cls.match(/\bbg-\w+[-/]?\w*/);
      if (bgMatch) indicators.push(bgMatch[0]);

      // Border classes
      if (/\bborder\b/.test(cls) && !/\bborder-0\b/.test(cls)) {
        indicators.push('bordered');
      }

      // Ghost/outline patterns
      if (/\b(ghost|outline|text-only|link)\b/i.test(cls)) {
        indicators.push('ghost');
      }

      // Inline background-color
      const bgColorMatch = style.match(/background-color\s*:\s*([^;]+)/);
      if (bgColorMatch) indicators.push(bgColorMatch[1].trim());

      // Transparent/none background
      if (/bg-transparent|bg-none/.test(cls) || /background\s*:\s*(transparent|none)/i.test(style)) {
        indicators.push('transparent');
      }

      styleFingerprints.add(indicators.sort().join('|') || 'default');
    });

    // If all buttons resolve to the same fingerprint, there's no hierarchy
    if (styleFingerprints.size === 1 && buttons.length >= 3) {
      issues.push({
        type: 'warning',
        category: 'slop',
        message: `All ${buttons.length} buttons share the same style — no visual hierarchy. Use 1 primary (filled), 1-2 secondary (outlined), and ghost for the rest.`,
      });
    }

    return issues;
  },
};
