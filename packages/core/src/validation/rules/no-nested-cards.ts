import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Flags card elements nested inside other card elements.
 *
 * Anti-slop-design.md: "Nested Cards"
 * "Visual noise and excessive depth. Use single-level containment only."
 */
export const noNestedCards: LintRule = {
  id: 'no-nested-cards',
  name: 'No Nested Cards',
  description: 'Flags card-like containers nested inside other card-like containers.',
  severity: 'warning',
  category: 'layout',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    // Find elements that look like cards: class contains "card", or has
    // both border-radius and either box-shadow or border styling
    const cardSelector = [
      '[class*="card"]',
      '[class*="Card"]',
    ].join(', ');

    const cardElements = $(cardSelector);
    let nestedCount = 0;

    cardElements.each((_i, el) => {
      // Check if any ancestor is also a card
      const parent = $(el).parent().closest(cardSelector);
      if (parent.length > 0) {
        nestedCount++;
      }
    });

    // Also check inline styles for nested bordered+rounded containers
    $('[style*="border-radius"]').each((_i, el) => {
      const style = $(el).attr('style') || '';
      const hasShadowOrBorder = /box-shadow|border:\s*\d/.test(style);
      if (!hasShadowOrBorder) return;

      const parentWithStyle = $(el).parent().closest('[style*="border-radius"]');
      if (parentWithStyle.length > 0) {
        const parentStyle = parentWithStyle.attr('style') || '';
        if (/box-shadow|border:\s*\d/.test(parentStyle)) {
          nestedCount++;
        }
      }
    });

    if (nestedCount > 0) {
      issues.push({
        type: 'warning',
        category: 'layout',
        message: `${nestedCount} nested card${nestedCount > 1 ? 's' : ''} detected — visual noise from excessive depth. Use single-level containment; separate nested content with spacing or background tint.`,
      });
    }

    return issues;
  },
};
