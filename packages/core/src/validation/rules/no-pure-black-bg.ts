import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Flags pure #000000 backgrounds.
 *
 * Anti-slop-design.md: "Pure Black Backgrounds"
 * Harsh, unnatural contrast. Use tinted blacks instead.
 */
export const noPureBlackBg: LintRule = {
  id: 'no-pure-black-bg',
  name: 'No Pure Black Backgrounds',
  description: 'Flags #000000/black backgrounds — use tinted blacks instead.',
  severity: 'warning',
  category: 'color',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles, allClasses, html } = context;

    let found = false;

    // Check CSS: background: #000, background-color: #000000, background: black
    if (/background(-color)?\s*:\s*(#000(000)?|black)\b/i.test(allStyles)) {
      found = true;
    }

    // Check Tailwind classes: bg-black, bg-[#000], bg-[#000000]
    if (/\bbg-black\b|\bbg-\[#000(000)?\]/.test(allClasses)) {
      found = true;
    }

    // Check inline Tailwind config in <script> or <style> for "#000000" as a color value
    const configMatch = html.match(/<script[^>]*>[\s\S]*?tailwind[\s\S]*?<\/script>/gi);
    if (configMatch) {
      for (const block of configMatch) {
        if (/"#000(000)?"|'#000(000)?'/.test(block)) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      issues.push({
        type: 'warning',
        category: 'color',
        message: 'Pure black (#000000) background detected — harsh contrast. Tint toward brand hue: #0F0F1A (navy), #1A1A2E (purple), #0D1117 (GitHub-style).',
      });
    }

    return issues;
  },
};
