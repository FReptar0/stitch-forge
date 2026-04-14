import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/** Generic CTA phrases that tell the user nothing about the action */
const GENERIC_CTAS = [
  'get started',
  'learn more',
  'sign up',
  'try now',
  'start free trial',
  'request demo',
  'request a demo',
  'contact us',
  'buy now',
  'subscribe',
  'start now',
  'try it free',
  'join now',
  'explore',
  'discover more',
];

/**
 * Flags buttons with generic CTA text like "Get Started" or "Learn More".
 *
 * Content-authenticity.md: "Uniform CTA Language"
 * "Every CTA button must describe its specific action."
 */
export const noGenericCta: LintRule = {
  id: 'no-generic-cta',
  name: 'No Generic CTAs',
  description: 'Flags buttons with generic text ("Get Started", "Learn More") that describe no specific action.',
  severity: 'info',
  category: 'content',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    const genericFound: string[] = [];

    $('a, button, [role="button"]').each((_i, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (!text) return;
      for (const generic of GENERIC_CTAS) {
        if (text === generic) {
          genericFound.push($(el).text().trim());
          break;
        }
      }
    });

    if (genericFound.length >= 2) {
      const examples = genericFound.slice(0, 3).map(t => `"${t}"`).join(', ');
      issues.push({
        type: 'info',
        category: 'content',
        message: `${genericFound.length} generic CTAs found (${examples}). CTAs should describe specific actions: "Install via npm", "View Source on GitHub", "Read the Docs".`,
      });
    }

    return issues;
  },
};
