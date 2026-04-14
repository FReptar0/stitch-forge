import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/** Generic font families that don't count as distinct named fonts */
const GENERIC_FAMILIES = new Set([
  'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', '-apple-system', 'blinkmacsystemfont', 'ui-sans-serif',
  'ui-serif', 'ui-monospace', 'ui-rounded',
]);

/**
 * Flags pages that use only a single font-family.
 *
 * Anti-slop-design.md: "Single Font for Everything"
 * "Minimum 2 font families. Use a monospace third font for code/technical terms."
 */
export const noSingleFont: LintRule = {
  id: 'no-single-font',
  name: 'No Single Font',
  description: 'Flags pages with only 1 font-family — minimum 2 needed for typographic hierarchy.',
  severity: 'warning',
  category: 'typography',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles, allClasses } = context;

    const namedFonts = new Set<string>();

    // Extract font-family values from CSS
    const fontFamilyRegex = /font-family\s*:\s*([^;}"]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = fontFamilyRegex.exec(allStyles)) !== null) {
      const fonts = match[1].split(',').map(f => f.trim().replace(/['"]/g, '').toLowerCase());
      for (const font of fonts) {
        if (font && !GENERIC_FAMILIES.has(font)) {
          namedFonts.add(font);
        }
      }
    }

    // Check Tailwind font classes — each counts as a distinct family type
    const hasFontSans = /\bfont-sans\b/.test(allClasses);
    const hasFontSerif = /\bfont-serif\b/.test(allClasses);
    const hasFontMono = /\bfont-mono\b/.test(allClasses);
    const twFontTypes = [hasFontSans, hasFontSerif, hasFontMono].filter(Boolean).length;

    // Total distinct font families: named CSS fonts + Tailwind font type classes
    const totalDistinct = Math.max(namedFonts.size, twFontTypes);

    if (totalDistinct === 1) {
      issues.push({
        type: 'warning',
        category: 'typography',
        message: 'Only 1 font-family detected — no typographic hierarchy. Pair a display/serif heading font with a humanist sans body font. Minimum 2 families.',
      });
    }

    return issues;
  },
};
