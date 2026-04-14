import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Flags 5+ distinct rgba opacity values used as the color system.
 *
 * Anti-slop-design.md: "Opacity-as-Palette"
 * "Lazy substitute for intentional color choices. Define explicit surface/shade variants."
 */
export const noOpacityPalette: LintRule = {
  id: 'no-opacity-palette',
  name: 'No Opacity-as-Palette',
  description: 'Flags 5+ distinct rgba() alpha values used as a color system substitute.',
  severity: 'warning',
  category: 'color',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles } = context;

    // Match rgba() with black or white base: rgba(0,0,0,x) or rgba(255,255,255,x)
    const rgbaRegex = /rgba\(\s*(0|255)\s*,\s*(0|255)\s*,\s*(0|255)\s*,\s*([\d.]+)\s*\)/g;
    const alphaValues = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = rgbaRegex.exec(allStyles)) !== null) {
      const r = match[1], g = match[2], b = match[3], a = match[4];
      // Only count black (0,0,0) or white (255,255,255) bases
      if ((r === '0' && g === '0' && b === '0') || (r === '255' && g === '255' && b === '255')) {
        alphaValues.add(`${r},${g},${b},${a}`);
      }
    }

    if (alphaValues.size >= 5) {
      issues.push({
        type: 'warning',
        category: 'color',
        message: `${alphaValues.size} distinct rgba() opacity values used as a color system — lazy palette. Define explicit surface variants (--surface-1, --surface-2, --surface-3) from the DESIGN.md palette.`,
      });
    }

    return issues;
  },
};
