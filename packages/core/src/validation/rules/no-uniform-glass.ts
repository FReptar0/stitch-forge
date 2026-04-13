import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Flags uniform glassmorphism applied to 5+ elements.
 *
 * Anti-slop-design.md: "Uniform Glassmorphism on All Cards"
 * One glass treatment everywhere kills the premium feel.
 * Limit glass to 2-3 featured elements.
 */
export const noUniformGlass: LintRule = {
  id: 'no-uniform-glass',
  name: 'No Uniform Glassmorphism',
  description: 'Flags identical backdrop-filter/glass treatment on 5+ elements.',
  severity: 'warning',
  category: 'slop',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $, allStyles, allClasses } = context;

    // Check 1: backdrop-filter in CSS applied broadly
    const backdropMatches = allStyles.match(/backdrop-filter\s*:\s*blur\([^)]+\)/g);
    if (backdropMatches && backdropMatches.length >= 5) {
      issues.push({
        type: 'warning',
        category: 'slop',
        message: `Uniform glassmorphism: ${backdropMatches.length} elements use identical backdrop-filter. Limit glass to 2-3 featured elements.`,
      });
      return issues;
    }

    // Check 2: Tailwind glass-related classes repeated on many elements
    const glassElements = $('[class*="backdrop-blur"], [class*="glass"], [class*="bg-white/"], [class*="bg-black/"]');
    if (glassElements.length >= 5) {
      // Verify they use similar class patterns (not just coincidental matches)
      const classPatterns = new Set<string>();
      glassElements.each((_i, el) => {
        const cls = $(el).attr('class') || '';
        const glassClasses = cls.split(/\s+/).filter(c =>
          c.includes('backdrop-blur') || c.includes('glass') ||
          /^bg-(white|black)\/\d/.test(c),
        ).sort().join(' ');
        if (glassClasses) classPatterns.add(glassClasses);
      });

      // If most elements share the same glass pattern, it's uniform
      if (classPatterns.size <= 2 && glassElements.length >= 5) {
        issues.push({
          type: 'warning',
          category: 'slop',
          message: `Uniform glassmorphism: ${glassElements.length} elements share the same glass treatment. Use glass on 2-3 featured elements, solid backgrounds for the rest.`,
        });
      }
    }

    // Check 3: Shared glass CSS class used on many elements
    const classNames = allClasses.split(/\s+/);
    const glassCandidates = classNames.filter(c =>
      /glass|frosted|blur/i.test(c),
    );
    if (glassCandidates.length > 0) {
      const classCount = new Map<string, number>();
      for (const c of glassCandidates) {
        classCount.set(c, (classCount.get(c) || 0) + 1);
      }
      for (const [cls, count] of classCount) {
        if (count >= 5) {
          issues.push({
            type: 'warning',
            category: 'slop',
            message: `Class "${cls}" applied to ${count} elements — uniform glass treatment is an AI tell. Vary treatments across elements.`,
          });
          break;
        }
      }
    }

    return issues;
  },
};
