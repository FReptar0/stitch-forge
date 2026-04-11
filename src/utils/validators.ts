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

  // Reject empty or whitespace-only prompts
  if (!prompt.trim()) {
    errors.push('Prompt is empty. Describe the screen you want to generate.');
    return { valid: false, errors };
  }

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
    /\b(create|build|generate|make|design)\s+.*(,\s*\w+\s+page\s*){2,}/i,
    /\b(landing|home|pricing|about|contact|dashboard|login|signup)\s+page\b.*\b(landing|home|pricing|about|contact|dashboard|login|signup)\s+page\b/is,
    /\bmultiple\s+(pages?|screens?)\b/i,
    /\b(two|three|four|five|2|3|4|5)\s+(pages?|screens?)\b/i,
    /\bpage\s+for\s+\w+\b.*\band\b.*\bpage\s+for\s+\w+\b/is,
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

  // Detect vague refinements — use word-level scoring instead of exact match
  if (isVaguePrompt(prompt.trim())) {
    errors.push(
      'Prompt is too vague. Be specific about what to change. For example:\n' +
      '  Instead of "make it better" try:\n' +
      '  "On the hero section, increase the heading size to 4rem and change the CTA button color to #F5A623"'
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Detect vague prompts using word-level analysis instead of fragile regex.
 * A prompt is vague if it's short AND contains only vague verbs/adjectives
 * without any concrete UI terms (hex values, measurements, component names).
 */
function isVaguePrompt(prompt: string): boolean {
  // Short prompts with vague intent
  const words = prompt.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  if (words.length > 20) return false; // Long prompts are likely specific enough

  const vagueVerbs = ['make', 'get', 'fix', 'improve', 'enhance', 'update', 'change', 'tweak', 'do'];
  const vagueAdj = ['better', 'nicer', 'good', 'pretty', 'nice', 'cool', 'bad', 'ugly', 'wrong', 'off', 'weird', 'professional', 'appealing'];
  const vagueObjects = ['it', 'this', 'that', 'the design', 'the page', 'the layout', 'the look'];
  const fillerWords = ['just', 'please', 'can', 'you', 'a', 'bit', 'more', 'something', 'about', 'looks', 'look'];

  // Concrete signals that indicate specificity
  const hasHexColor = /#[0-9a-f]{3,6}/i.test(prompt);
  const hasMeasurement = /\d+\s*(px|rem|em|%|vh|vw)\b/.test(prompt);
  const hasComponent = /\b(hero|header|footer|nav|sidebar|card|button|input|form|grid|section|modal|carousel|accordion|tab|table|banner|cta)\b/i.test(prompt);
  const hasSpecificAction = /\b(color|font|size|width|height|padding|margin|spacing|border|radius|shadow|background|align|position)\b/i.test(prompt);

  if (hasHexColor || hasMeasurement || hasComponent || hasSpecificAction) return false;

  const hasVagueVerb = words.some(w => vagueVerbs.includes(w));
  const hasVagueAdj = words.some(w => vagueAdj.includes(w));
  const meaningfulWords = words.filter(w => !fillerWords.includes(w) && w.length > 1);

  // If the meaningful content is just a vague verb + vague adjective/object, it's vague
  if (meaningfulWords.length <= 6 && hasVagueVerb && hasVagueAdj) return true;
  if (meaningfulWords.length <= 4 && hasVagueVerb) return true;
  // Complaints without direction: "it looks bad", "this is ugly"
  if (meaningfulWords.length <= 3 && hasVagueAdj) return true;

  return false;
}

// Validate quota
export function validateQuota(used: number, limit: number): { allowed: boolean; remaining: number } {
  const remaining = limit - used;
  return { allowed: remaining > 0, remaining };
}

export type DesignMd = z.infer<typeof DesignMdSchema>;
