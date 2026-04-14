import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/** Convert a CSS font-size value to pixels (assumes 16px base). */
function toPx(value: string): number | null {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  if (value.endsWith('rem') || value.endsWith('em')) return num * 16;
  if (value.endsWith('px')) return num;
  return null;
}

/**
 * Flags font sizes within 1.25x ratio between consecutive heading levels.
 *
 * Anti-slop-design.md: "Flat Type Hierarchy"
 * "Use a clear modular scale (1.333x or 1.5x ratio). H1 should be at least 2.5x body size."
 */
export const noFlatHierarchy: LintRule = {
  id: 'no-flat-hierarchy',
  name: 'No Flat Type Hierarchy',
  description: 'Flags heading font sizes too close together (ratio < 1.3x between levels).',
  severity: 'info',
  category: 'typography',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles } = context;

    // Extract font-size for h1-h6 from CSS rules
    const headingSizes = new Map<number, number>();
    for (let level = 1; level <= 6; level++) {
      const regex = new RegExp(`h${level}\\s*\\{[^}]*font-size\\s*:\\s*([^;}]+)`, 'i');
      const match = allStyles.match(regex);
      if (match) {
        const px = toPx(match[1].trim());
        if (px !== null) headingSizes.set(level, px);
      }
    }

    // Need at least 2 heading levels to compare
    const levels = [...headingSizes.keys()].sort((a, b) => a - b);
    if (levels.length < 2) return issues;

    for (let i = 0; i < levels.length - 1; i++) {
      const higher = headingSizes.get(levels[i])!;     // e.g. h1 (larger)
      const lower = headingSizes.get(levels[i + 1])!;  // e.g. h2 (smaller)
      if (lower > 0) {
        const ratio = higher / lower;
        if (ratio > 0 && ratio < 1.3) {
          issues.push({
            type: 'info',
            category: 'typography',
            message: `h${levels[i]} (${higher}px) to h${levels[i + 1]} (${lower}px) ratio is ${ratio.toFixed(2)}x — too flat. Use a 1.333x+ modular scale for clear visual distinction.`,
          });
        }
      }
    }

    return issues;
  },
};
