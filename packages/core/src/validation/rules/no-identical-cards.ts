import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Flags 3+ sibling elements with identical structure (same tag sequence).
 *
 * Anti-slop-design.md: "Three Identical Cards in a Row"
 * "The default AI homepage layout."
 */
export const noIdenticalCards: LintRule = {
  id: 'no-identical-cards',
  name: 'No Three Identical Cards',
  description: 'Flags 3+ sibling elements with identical child structure.',
  severity: 'warning',
  category: 'layout',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    // Look at common grid/flex containers
    const containers = $('[class*="grid"], [class*="flex"], [class*="columns"]');

    containers.each((_i, container) => {
      const children = $(container).children();
      if (children.length < 3) return;

      // Build a structural fingerprint for each child:
      // tag sequence of immediate children + grandchildren
      const fingerprints: string[] = [];
      children.each((_j, child) => {
        const tags: string[] = [];
        $(child).children().each((_k, grandchild) => {
          tags.push(grandchild.tagName?.toLowerCase() || '');
        });
        fingerprints.push(tags.join(','));
      });

      // Count how many children share the same fingerprint
      const counts = new Map<string, number>();
      for (const fp of fingerprints) {
        if (fp.length > 0) {
          counts.set(fp, (counts.get(fp) || 0) + 1);
        }
      }

      for (const [fp, count] of counts) {
        // Only flag if 3+ identical AND the structure has at least 2 child elements
        // (to avoid flagging simple lists of paragraphs)
        const tagCount = fp.split(',').length;
        if (count >= 3 && tagCount >= 2) {
          issues.push({
            type: 'warning',
            category: 'layout',
            message: `${count} identical card structures (${fp}) in a grid/flex container — the default AI layout. Vary card sizes, internal structure, or visual treatment.`,
          });
          return; // One issue per page is enough
        }
      }
    });

    return issues;
  },
};
