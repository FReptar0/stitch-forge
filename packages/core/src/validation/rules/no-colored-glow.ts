import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Flags colored (non-black/white) box-shadow glow on 3+ elements.
 *
 * Anti-slop-design.md: "Dark-Glow Box Shadows on Everything"
 * "Colored glow on every card and button is an instant AI tell."
 */
export const noColoredGlow: LintRule = {
  id: 'no-colored-glow',
  name: 'No Colored Glow Shadows',
  description: 'Flags colored box-shadow glow (non-gray) on 3+ elements.',
  severity: 'warning',
  category: 'slop',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles, $ } = context;

    let glowCount = 0;

    // Check CSS box-shadow declarations for colored glow
    // Colored glow: box-shadow with rgba where R,G,B are not all equal (not grayscale)
    // and alpha >= 0.3
    const shadowRegex = /box-shadow\s*:\s*([^;}"]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = shadowRegex.exec(allStyles)) !== null) {
      const value = match[1];
      // Check for colored rgba (R !== G or G !== B, meaning not grayscale)
      const rgbaMatch = value.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
      if (rgbaMatch) {
        const [, r, g, b, a] = rgbaMatch;
        const isGrayscale = r === g && g === b;
        const alpha = parseFloat(a);
        if (!isGrayscale && alpha >= 0.3) {
          glowCount++;
        }
      }
    }

    // Check inline styles on elements
    $('[style*="box-shadow"]').each((_i, el) => {
      const style = $(el).attr('style') || '';
      const rgbaMatch = style.match(/box-shadow[^;]*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
      if (rgbaMatch) {
        const [, r, g, b, a] = rgbaMatch;
        const isGrayscale = r === g && g === b;
        const alpha = parseFloat(a);
        if (!isGrayscale && alpha >= 0.3) {
          glowCount++;
        }
      }
    });

    // Check Tailwind shadow classes with color
    const colorShadowElements = $('[class*="shadow-"]');
    colorShadowElements.each((_i, el) => {
      const cls = $(el).attr('class') || '';
      // Tailwind colored shadows: shadow-blue-500/50, shadow-purple-400, etc.
      if (/\bshadow-(?!sm|md|lg|xl|2xl|none|inner)\w+-\d+/.test(cls)) {
        glowCount++;
      }
    });

    if (glowCount >= 3) {
      issues.push({
        type: 'warning',
        category: 'slop',
        message: `${glowCount} elements have colored glow box-shadows — "the default look of AI-generated UIs." Reserve colored glow for ONE primary CTA. Use neutral shadows for everything else.`,
      });
    }

    return issues;
  },
};
