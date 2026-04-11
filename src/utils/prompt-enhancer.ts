import { existsSync, readFileSync } from 'node:fs';

export interface EnhancementResult {
  original: string;
  enhanced: string;
  suggestions: string[];
  slopRiskScore: number;
}

/**
 * Enhance a user prompt before sending to Stitch.
 * Adds design context, replaces generic terms, and scores slop risk.
 */
export function enhancePrompt(prompt: string): EnhancementResult {
  const suggestions: string[] = [];
  let enhanced = prompt;

  // 1. Add DESIGN.md reference if available
  if (existsSync('DESIGN.md')) {
    if (!enhanced.toLowerCase().includes('design system') && !enhanced.toLowerCase().includes('design.md')) {
      enhanced = `Following the imported design system, ${enhanced}`;
      suggestions.push('Added DESIGN.md reference for visual consistency.');
    }
  }

  // 2. Calculate slop risk score
  const slopRiskScore = calculateSlopRisk(prompt);

  // 3. Suggest replacements for generic terms
  const genericReplacements: Array<[RegExp, string, string]> = [
    [/\bmodern\b/i, 'contemporary with sharp geometric accents', 'Replace "modern" with specific visual direction'],
    [/\bclean\b/i, 'minimal with generous whitespace', 'Replace "clean" with concrete layout description'],
    [/\bprofessional\b/i, 'corporate with structured grid layout', 'Replace "professional" with specific aesthetic'],
    [/\bnice\b/i, 'polished with intentional typography', 'Replace "nice" with visual specifics'],
    [/\bbeautiful\b/i, 'visually striking with bold color contrast', 'Replace "beautiful" with design attributes'],
  ];

  for (const [pattern, _replacement, suggestion] of genericReplacements) {
    if (pattern.test(prompt)) {
      suggestions.push(suggestion);
    }
  }

  // 4. Check for missing specifics
  if (!/\d+/.test(prompt)) {
    suggestions.push('Add specific numbers (e.g., "3 pricing tiers", "4 testimonials") for better results.');
  }

  if (!/\b(grid|bento|card|layout|sticky|floating|sidebar|split|asymmetric)\b/i.test(prompt)) {
    suggestions.push('Add UI layout terms (e.g., "bento grid", "split layout", "sticky header") for structural clarity.');
  }

  if (!/\b(section|hero|header|footer|nav|cta|testimonial|feature|pricing)\b/i.test(prompt)) {
    suggestions.push('Describe specific sections for more targeted generation.');
  }

  return { original: prompt, enhanced, suggestions, slopRiskScore };
}

/**
 * Calculate AI slop risk score (0-10).
 * Higher score = more likely to get generic AI output.
 */
export function calculateSlopRisk(prompt: string): number {
  let score = 0;

  // No layout specifics
  if (!/\b(grid|bento|card|layout|sticky|floating|sidebar|split|asymmetric|column|row)\b/i.test(prompt)) {
    score += 2;
  }

  // No specific numbers
  if (!/\b\d+\b/.test(prompt)) {
    score += 2;
  }

  // No UI/UX vocabulary
  if (!/\b(section|hero|header|footer|nav|cta|testimonial|feature|pricing|carousel|accordion|tab|modal)\b/i.test(prompt)) {
    score += 2;
  }

  // No design system reference
  if (!/\b(design system|design.md|palette|typography|font)\b/i.test(prompt)) {
    score += 1;
  }

  // Uses generic adjectives
  const genericCount = (prompt.match(/\b(modern|clean|professional|nice|beautiful|sleek|elegant|stunning)\b/gi) || []).length;
  score += Math.min(genericCount, 3);

  return Math.min(score, 10);
}

/**
 * Get human-readable risk level from score.
 */
export function getSlopRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score <= 3) return 'low';
  if (score <= 6) return 'medium';
  return 'high';
}
