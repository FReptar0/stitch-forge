import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Flags thick colored left borders on cards/content blocks.
 *
 * Anti-slop-design.md: "Side-Tab Accent Borders"
 * "The most recognizable tell of AI-generated UIs" (Impeccable).
 */
export const noSideTabBorders: LintRule = {
  id: 'no-side-tab-borders',
  name: 'No Side-Tab Accent Borders',
  description: 'Flags thick colored left borders on cards — a top AI fingerprint.',
  severity: 'warning',
  category: 'slop',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $, allStyles, allClasses } = context;

    let sideTabCount = 0;

    // Check 1: Tailwind border-l-* classes (border-l-2, border-l-4, etc.)
    const borderLElements = $('[class*="border-l-"]');
    borderLElements.each((_i, el) => {
      const cls = $(el).attr('class') || '';
      // Match border-l-2, border-l-4, border-l-8 (thick left borders)
      if (/\bborder-l-[2-8]\b/.test(cls)) {
        sideTabCount++;
      }
    });

    // Check 2: CSS border-left in style blocks
    const borderLeftMatches = allStyles.match(/border-left\s*:\s*[3-8]px\s+solid/g);
    if (borderLeftMatches) {
      sideTabCount += borderLeftMatches.length;
    }

    // Check 3: Inline styles with border-left
    $('[style*="border-left"]').each((_i, el) => {
      const style = $(el).attr('style') || '';
      if (/border-left\s*:\s*[3-8]px\s+solid/i.test(style)) {
        sideTabCount++;
      }
    });

    if (sideTabCount >= 3) {
      issues.push({
        type: 'warning',
        category: 'slop',
        message: `${sideTabCount} elements have thick colored left borders (side-tab accent) — the most recognizable AI tell. Use background tint, top border, or size variation instead.`,
      });
    }

    return issues;
  },
};
