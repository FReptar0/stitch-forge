/**
 * Design Quality Validator for DESIGN.md files.
 *
 * Scores a DESIGN.md across four dimensions — specificity, differentiation,
 * completeness, and actionability — and surfaces concrete issues.
 */

import type {
  BusinessResearchResult,
  CompetitorAnalysis,
  DesignQualityIssue,
  DesignQualityScore,
} from '../research/types.js';

// ─── Hex distance utility ──────────────────────────────────────────

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

/**
 * Euclidean distance between two hex colors in RGB space.
 * Threshold for "too similar": distance < 50.
 */
export function hexDistance(a: string, b: string): number {
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// ─── Section extraction helpers ────────────────────────────────────

function extractSection(markdown: string, sectionNumber: number): string {
  const pattern = new RegExp(
    `## ${sectionNumber}\\..*?\n([\\s\\S]*?)(?=## \\d+\\.|$)`,
  );
  const match = markdown.match(pattern);
  return match ? match[1].trim() : '';
}

function extractDosSection(markdown: string): string {
  const match = markdown.match(/### Do\b\n([\s\S]*?)(?=### Don|$)/);
  return match ? match[1].trim() : '';
}

function extractDontsSection(markdown: string): string {
  const match = markdown.match(/### Don'?t\b\n([\s\S]*?)(?=##|$)/);
  return match ? match[1].trim() : '';
}

function extractColorHexes(markdown: string): string[] {
  const section = extractSection(markdown, 2);
  const hexPattern = /#[0-9A-Fa-f]{6}/g;
  return [...(section.match(hexPattern) || [])];
}

function countColorTableRows(markdown: string): number {
  const section = extractSection(markdown, 2);
  const lines = section.split('\n');
  let count = 0;
  for (const line of lines) {
    // Count table rows with hex values, skip header and separator
    if (line.includes('|') && /#[0-9A-Fa-f]{6}/.test(line)) {
      count++;
    }
  }
  return count;
}

function countListItems(text: string): number {
  const items = text.split('\n').filter((l) => /^- /.test(l.trim()));
  return items.length;
}

// ─── Sub-scorers ───────────────────────────────────────────────────

/**
 * Scores how specific and concrete the DESIGN.md is (0-25).
 * Penalizes placeholders, generic adjectives, missing hex values, etc.
 */
export function scoreSpecificity(markdown: string): number {
  let score = 25;
  const issues: string[] = [];

  // -5 for each <!-- --> placeholder
  const placeholders = (markdown.match(/<!--[\s\S]*?-->/g) || []).length;
  score -= placeholders * 5;

  // -3 for generic words used in isolation (not as part of specific rules)
  const genericWords = ['modern', 'clean', 'professional', 'nice', 'beautiful'];
  for (const word of genericWords) {
    // Match word in isolation (not within a quoted string or compound rule)
    const regex = new RegExp(`(?<![\\w"'])\\b${word}\\b(?![\\w"'])`, 'gi');
    const matches = markdown.match(regex) || [];
    // Only penalize if the word appears standalone-ish (not in a longer rule)
    for (const _match of matches) {
      // Check context: find the line containing this match
      const lines = markdown.split('\n');
      for (const line of lines) {
        if (regex.test(line)) {
          // If line is short (< 40 chars) and mostly just the generic word, penalize
          const trimmed = line.replace(/^[-#|*\s]+/, '').trim();
          if (trimmed.length < 40 || trimmed.toLowerCase() === word) {
            score -= 3;
            break;
          }
        }
      }
    }
  }

  // -2 if no hex color values found in color table
  const hexes = extractColorHexes(markdown);
  if (hexes.length === 0) {
    score -= 2;
  }

  // -2 if typography section has no quoted font names
  const typoSection = extractSection(markdown, 3);
  if (!/"[^"]+"/.test(typoSection)) {
    score -= 2;
  }

  // -2 for each section with no content, -1 for sections under 20 characters
  for (let i = 1; i <= 8; i++) {
    const section = extractSection(markdown, i);
    if (section.length === 0) {
      score -= 2;
    } else if (section.length < 20) {
      score -= 1;
    }
  }

  return Math.max(0, score);
}

/**
 * Scores how differentiated the design is from competitors (0-25).
 * Without competitor data, caps at 15 (cannot assess differentiation).
 */
export function scoreDifferentiation(
  markdown: string,
  competitors?: CompetitorAnalysis[],
): number {
  const hasCompetitors = competitors && competitors.length > 0;
  let score = hasCompetitors ? 25 : 15;

  if (!hasCompetitors) return score;

  // Extract primary color from markdown (try section 2 first, then full markdown)
  const colorSection = extractSection(markdown, 2);
  const searchText = colorSection || markdown;
  const primaryLine = searchText
    .split('\n')
    .find((l) => /primary/i.test(l) && /#[0-9A-Fa-f]{6}/.test(l));
  const primaryHexMatch = primaryLine?.match(/#[0-9A-Fa-f]{6}/);
  const primaryHex = primaryHexMatch ? primaryHexMatch[0] : null;

  if (primaryHex) {
    for (const comp of competitors) {
      const compDominant = comp.palette.dominantHex;
      if (!compDominant) continue;

      // -8 for exact match
      if (primaryHex.toLowerCase() === compDominant.toLowerCase()) {
        score -= 8;
        break;
      }

      // -4 if within distance 30
      const dist = hexDistance(primaryHex, compDominant);
      if (dist < 30) {
        score -= 4;
        break;
      }

      // Also check within distance 50 for a lesser penalty
      if (dist < 50) {
        score -= 2;
        break;
      }
    }
  }

  // -5 if heading font matches any competitor's heading font
  const typoSection = extractSection(markdown, 3) || markdown;
  for (const comp of competitors) {
    if (comp.typography.headingFont) {
      if (typoSection.includes(comp.typography.headingFont)) {
        score -= 5;
        break;
      }
    }
  }

  // -3 if "Don't" section doesn't mention any competitor differentiation rule
  const dontsSection = extractDontsSection(markdown) || markdown;
  const hasCompetitorMention = competitors.some(
    (c) =>
      dontsSection.toLowerCase().includes(c.name.toLowerCase()) ||
      (c.typography.headingFont &&
        dontsSection.includes(c.typography.headingFont)),
  );
  if (!hasCompetitorMention) {
    score -= 3;
  }

  return Math.max(0, score);
}

/**
 * Scores structural completeness of the DESIGN.md (0-25).
 * Checks for all 8 sections, color count, component patterns, do/don't counts.
 */
export function scoreCompleteness(markdown: string): number {
  let score = 25;

  // Check for all 8 section headers
  for (let i = 1; i <= 8; i++) {
    const pattern = new RegExp(`## ${i}\\.`);
    if (!pattern.test(markdown)) {
      score -= 4;
    }
  }

  // Check color table has >= 5 rows with hex values
  const colorRows = countColorTableRows(markdown);
  if (colorRows < 5) {
    score -= 3;
  }

  // Check >= 3 component patterns (subsections under section 5)
  const compSection = extractSection(markdown, 5);
  const componentHeaders = (compSection.match(/### /g) || []).length;
  if (componentHeaders < 3) {
    score -= 3;
  }

  // Check Do's has >= 3 items
  const dosSection = extractDosSection(markdown);
  const dosCount = countListItems(dosSection);
  if (dosCount < 3) {
    score -= 3;
  }

  // Check Don'ts has >= 3 items
  const dontsSection = extractDontsSection(markdown);
  const dontsCount = countListItems(dontsSection);
  if (dontsCount < 3) {
    score -= 3;
  }

  return Math.max(0, score);
}

/**
 * Scores how actionable and implementation-ready the rules are (0-25).
 * Penalizes vague language, color words without hex, non-numeric sizes.
 */
export function scoreActionability(markdown: string): number {
  let score = 25;

  const dosSection = extractDosSection(markdown);
  const dontsSection = extractDontsSection(markdown);
  const rulesText = `${dosSection}\n${dontsSection}`;

  // -3 for each "should" or "consider" in Do's/Don'ts
  const vagueMatches = rulesText.match(/\b(should|consider)\b/gi) || [];
  score -= vagueMatches.length * 3;

  // -2 for each rule that is too short to be actionable (< 15 chars)
  const ruleLines = rulesText.split('\n').filter((l) => /^- /.test(l.trim()));
  for (const rule of ruleLines) {
    const content = rule.replace(/^-\s*/, '').trim();
    if (content.length > 0 && content.length < 15) {
      score -= 2;
    }
  }

  // -2 for each color described with words instead of hex
  const colorSection = extractSection(markdown, 2);
  const colorWordPatterns = [
    /\b(trustworthy|calming|vibrant|warm|cool)\s+(blue|red|green|yellow|orange|purple|pink|teal)\b/gi,
  ];
  for (const pattern of colorWordPatterns) {
    const matches = colorSection.match(pattern) || [];
    score -= matches.length * 2;
  }

  // -2 for each font size not in px/rem in typography section
  const typoSection = extractSection(markdown, 3);
  const sizeEntries = typoSection.match(
    /\|\s*\w+\s*\|\s*([^|]+)\s*\|/g,
  ) || [];
  for (const entry of sizeEntries) {
    // Skip header row
    if (/Size/i.test(entry)) continue;
    if (!/\d+(\.\d+)?(px|rem)/.test(entry)) {
      score -= 2;
    }
  }

  // -2 if spacing section has no numeric values
  const spacingSection = extractSection(markdown, 4);
  if (!/\d+/.test(spacingSection)) {
    score -= 2;
  }

  // -1 for each "e.g." or "for example" in rules
  const exampleMatches =
    rulesText.match(/\b(e\.g\.|for example)\b/gi) || [];
  score -= exampleMatches.length;

  return Math.max(0, score);
}

// ─── Cultural alignment ────────────────────────────────────────────

/**
 * Checks for cultural alignment issues in the DESIGN.md.
 */
export function checkCulturalAlignment(
  markdown: string,
  locale?: string,
  audience?: string,
): DesignQualityIssue[] {
  const issues: DesignQualityIssue[] = [];
  const context = `${locale || ''} ${audience || ''}`.toLowerCase();

  if (/\bes\b|mexic|latino|latina|español/.test(context)) {
    // Check for Spanish copy guidance
    const dosSection = extractDosSection(markdown);
    const dontsSection = extractDontsSection(markdown);
    const allRules = `${dosSection}\n${dontsSection}`.toLowerCase();

    if (
      !allRules.includes('spanish') &&
      !allRules.includes('español') &&
      !allRules.includes('spanish-language')
    ) {
      issues.push({
        section: "Do's and Don'ts",
        severity: 'warning',
        message:
          'No Spanish copy guidance found for Spanish-locale audience — add rules for natural Spanish copy',
      });
    }

    // Check imagery for American/European references
    const imagerySection = extractSection(markdown, 7).toLowerCase();
    if (
      imagerySection.includes('american') ||
      imagerySection.includes('european')
    ) {
      issues.push({
        section: 'Imagery Guidelines',
        severity: 'info',
        message:
          'Imagery section references "American" or "European" stock — consider local imagery for this audience',
      });
    }
  }

  return issues;
}

// ─── Orchestrator ──────────────────────────────────────────────────

/**
 * Orchestrates all sub-scorers and returns a complete quality score.
 */
export function scoreDesignMd(
  markdown: string,
  research?: BusinessResearchResult,
): DesignQualityScore {
  const specificity = scoreSpecificity(markdown);
  const differentiation = scoreDifferentiation(
    markdown,
    research?.competitors,
  );
  const completeness = scoreCompleteness(markdown);
  const actionability = scoreActionability(markdown);
  const total = specificity + differentiation + completeness + actionability;

  const issues: DesignQualityIssue[] = [];

  // Collect issues from specificity
  const placeholders = (markdown.match(/<!--[\s\S]*?-->/g) || []).length;
  if (placeholders > 0) {
    issues.push({
      section: 'General',
      severity: 'error',
      message: `Contains ${placeholders} placeholder comment(s) — replace with real content`,
    });
  }

  // Check for vague language in rules
  const dosSection = extractDosSection(markdown);
  const dontsSection = extractDontsSection(markdown);
  const rulesText = `${dosSection}\n${dontsSection}`;
  if (/\b(should|consider)\b/i.test(rulesText)) {
    issues.push({
      section: "Do's and Don'ts",
      severity: 'warning',
      message: 'Contains "should" or "consider" — make rules definitive',
    });
  }

  // Check for missing sections
  for (let i = 1; i <= 8; i++) {
    const section = extractSection(markdown, i);
    if (section.length < 20) {
      const sectionNames: Record<number, string> = {
        1: 'Visual Theme & Atmosphere',
        2: 'Color Palette & Roles',
        3: 'Typography',
        4: 'Spacing & Layout',
        5: 'Component Patterns',
        6: 'Iconography',
        7: 'Imagery Guidelines',
        8: "Do's and Don'ts",
      };
      issues.push({
        section: sectionNames[i] || `Section ${i}`,
        severity: 'warning',
        message: `Section has very little content (${section.length} chars)`,
      });
    }
  }

  // Check competitor differentiation status
  if (!research?.competitors || research.competitors.length === 0) {
    issues.push({
      section: 'Differentiation',
      severity: 'info',
      message:
        'No competitor data available for differentiation scoring',
    });
  }

  // Cultural alignment issues
  if (research) {
    const culturalIssues = checkCulturalAlignment(
      markdown,
      research.brief.locale,
      research.brief.targetAudience,
    );
    issues.push(...culturalIssues);
  }

  return {
    specificity,
    differentiation,
    completeness,
    actionability,
    total,
    issues,
  };
}

// ─── Report formatter ──────────────────────────────────────────────

/**
 * Formats a DesignQualityScore into a human-readable report.
 */
export function formatDesignQualityReport(
  score: DesignQualityScore,
): string {
  const lines: string[] = [];

  lines.push(`Design Quality: ${score.total}/100`);
  lines.push('');
  lines.push(`  Specificity:      ${String(score.specificity).padStart(2)}/25`);
  lines.push(
    `  Differentiation:  ${String(score.differentiation).padStart(2)}/25`,
  );
  lines.push(`  Completeness:     ${String(score.completeness).padStart(2)}/25`);
  lines.push(
    `  Actionability:    ${String(score.actionability).padStart(2)}/25`,
  );

  if (score.issues.length > 0) {
    lines.push('');
    lines.push('Issues:');
    for (const issue of score.issues) {
      const icon =
        issue.severity === 'error'
          ? '[!]'
          : issue.severity === 'warning'
            ? '[!]'
            : '[i]';
      lines.push(`  ${icon} Section "${issue.section}": ${issue.message}`);
    }
  }

  return lines.join('\n');
}
