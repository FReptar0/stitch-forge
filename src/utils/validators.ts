import { z } from 'zod';

// Hex color validation
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a 6-digit hex color');

// DESIGN.md color role schema
export const ColorRoleSchema = z.object({
  name: z.string().min(1),
  hex: hexColor,
  usage: z.string().min(1),
});

// DESIGN.md validation schema
export const DesignMdSchema = z.object({
  visualTheme: z.string().min(20, 'Visual theme must be at least 20 characters'),
  colorPalette: z.array(ColorRoleSchema).min(5, 'Need at least 5 color roles'),
  typography: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
    sizes: z.record(z.string()),
  }),
  spacing: z.object({
    baseUnit: z.string().regex(/^\d+(px|rem)$/, 'Must be px or rem value'),
    scale: z.array(z.string()).min(3),
  }),
  componentPatterns: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).min(3, 'Need at least 3 component patterns'),
  iconography: z.string().min(10),
  imagery: z.string().min(10),
  dos: z.array(z.string()).min(3, 'Need at least 3 Do rules'),
  donts: z.array(z.string()).min(3, 'Need at least 3 Don\'t rules'),
});

// Prompt validation
export const PROMPT_MAX_CHARS = 5000;

export function validatePrompt(prompt: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (prompt.length > PROMPT_MAX_CHARS) {
    errors.push(
      `Prompt is ${prompt.length} chars, max is ${PROMPT_MAX_CHARS}. ` +
      `Try splitting into an initial prompt (describe the page) and refinement prompts (adjust specific sections).`
    );
  }

  // Detect multiple screens
  const multiScreenPatterns = [
    /\band\s+a\s+\w+\s+page\b/i,
    /\bpage\s*1\b.*\bpage\s*2\b/is,
    /\bfirst screen\b.*\bsecond screen\b/is,
  ];
  for (const pattern of multiScreenPatterns) {
    if (pattern.test(prompt)) {
      errors.push(
        'Detected multiple screens in one prompt. Generate one screen at a time — ' +
        'run `forge generate` once per page for best results.'
      );
      break;
    }
  }

  // Detect vague refinements
  const vaguePatterns = [
    /^make it better$/i,
    /^improve it$/i,
    /^make it look nice$/i,
    /^fix it$/i,
  ];
  for (const pattern of vaguePatterns) {
    if (pattern.test(prompt.trim())) {
      errors.push(
        'Prompt is too vague. Be specific about what to change. For example:\n' +
        '  Instead of "make it better" try:\n' +
        '  "On the hero section, increase the heading size to 4rem and change the CTA button color to #F5A623"'
      );
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

// Validate quota
export function validateQuota(used: number, limit: number): { allowed: boolean; remaining: number } {
  const remaining = limit - used;
  return { allowed: remaining > 0, remaining };
}

export type DesignMd = z.infer<typeof DesignMdSchema>;
