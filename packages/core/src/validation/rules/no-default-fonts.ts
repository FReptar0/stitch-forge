import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/** Common AI default fonts to flag */
const DEFAULT_FONTS = [
  'Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato',
  'Montserrat', 'Nunito', 'Raleway',
];

/** System font stacks that shouldn't be sole font-family */
const SYSTEM_ONLY_FONTS = ['system-ui', '-apple-system', 'BlinkMacSystemFont'];

/**
 * Check if a font is intentionally specified in DESIGN.md Section 3 (Typography).
 * Only considers fonts listed as Heading, Body, or Mono fonts -- NOT fonts
 * mentioned in "Don't" lists or other contexts.
 */
function isIntentionalFont(fontName: string, designMdContent?: string): boolean {
  if (!designMdContent) return false;

  const declared = getDeclaredFonts(designMdContent);
  return declared.some(d => d.name.toLowerCase() === fontName.toLowerCase());
}

interface DeclaredFont {
  role: string;   // e.g. "Heading", "Body", "Mono"
  name: string;   // e.g. "Space Grotesk", "DM Sans"
}

/**
 * Extract font declarations from DESIGN.md Section 3.
 */
function getDeclaredFonts(designMdContent: string): DeclaredFont[] {
  const section3Match = designMdContent.match(/##\s*3\..*?Typography[\s\S]*?(?=##\s*\d+\.|$)/i);
  if (!section3Match) return [];
  const section3 = section3Match[0];

  const fonts: DeclaredFont[] = [];
  const declRegex = /\*\*(Heading|Body|Mono|Display|Caption|Code)\*\*\s*:\s*["']?([^,"'\n]+)["']?/gi;
  let match;
  while ((match = declRegex.exec(section3)) !== null) {
    fonts.push({ role: match[1], name: match[2].trim() });
  }
  return fonts;
}

/**
 * Get the DESIGN.md-specified font for a given role, for better error messages.
 */
function getSpecifiedFontMessage(fontName: string, designMdContent?: string): string {
  if (!designMdContent) return `Detected "${fontName}" font — common AI default. Specify a custom typeface for brand identity.`;

  const declared = getDeclaredFonts(designMdContent);
  if (declared.length === 0) return `Detected "${fontName}" font — common AI default. Specify a custom typeface for brand identity.`;

  // Find the best matching role for the font usage context
  const bodyFont = declared.find(d => /body/i.test(d.role));
  const headingFont = declared.find(d => /heading|display/i.test(d.role));
  const primary = bodyFont || headingFont || declared[0];

  return `Detected "${fontName}" font — DESIGN.md specifies "${primary.name}" (${primary.role}), not "${fontName}".`;
}

/**
 * Flags Inter, Poppins, and other common AI-default fonts.
 * Bug Fix (Frente A): expanded font list, Google Fonts link detection,
 * system-ui sole font-family detection, Section 3 parsing for intentional fonts.
 */
export const noDefaultFonts: LintRule = {
  id: 'no-default-fonts',
  name: 'No Default Fonts',
  description: 'Flags common AI-default fonts (Inter, Poppins, Roboto, etc.) unless explicitly specified in DESIGN.md.',
  severity: 'warning',
  category: 'slop',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles, allClasses, designMdContent, $ } = context;

    // 1a. Check each default font in CSS font-family declarations
    for (const font of DEFAULT_FONTS) {
      const escapedFont = font.replace(/\s+/g, '\\s+');
      const fontRegex = new RegExp(`font-family[^;]*\\b${escapedFont}\\b`, 'i');
      if (fontRegex.test(allStyles) && !isIntentionalFont(font, designMdContent)) {
        issues.push({
          type: 'warning',
          category: 'slop',
          message: getSpecifiedFontMessage(font, designMdContent),
        });
      }
    }

    // 1b. Check Google Fonts <link> tags for flagged fonts
    const linkHrefs = $('link[href*="fonts.googleapis.com"]').map((_i, el) => $(el).attr('href') || '').get();
    for (const href of linkHrefs) {
      for (const font of DEFAULT_FONTS) {
        const encodedFont = font.replace(/\s+/g, '+');
        if (href.includes(encodedFont) && !isIntentionalFont(font, designMdContent)) {
          issues.push({
            type: 'warning',
            category: 'slop',
            message: `Google Fonts link loads "${font}" — ${designMdContent ? getSpecifiedFontMessage(font, designMdContent).replace(/^Detected "[^"]+" font — /, '') : 'common AI default. Specify a custom typeface for brand identity.'}`,
          });
        }
      }
    }

    // 1c. Check for system-ui/-apple-system/BlinkMacSystemFont as sole font-family
    const fontFamilyDecls = allStyles.match(/font-family\s*:\s*([^;}"]+)/gi) || [];
    for (const decl of fontFamilyDecls) {
      const value = decl.replace(/font-family\s*:\s*/i, '').trim();
      const fonts = value.split(',').map(f => f.trim().replace(/['"]/g, ''));
      // If ONLY system fonts (no named font after them)
      const namedFonts = fonts.filter(f =>
        !SYSTEM_ONLY_FONTS.includes(f) && f !== 'sans-serif' && f !== 'serif' && f !== 'monospace',
      );
      if (namedFonts.length === 0 && fonts.length > 0) {
        const hasSystemFont = fonts.some(f => SYSTEM_ONLY_FONTS.includes(f));
        const isSansSerifAlone = fonts.length === 1 && fonts[0] === 'sans-serif';
        if (hasSystemFont) {
          issues.push({
            type: 'warning',
            category: 'slop',
            message: `Font-family uses only system fonts (${fonts.join(', ')}). Specify a custom typeface for brand identity.`,
          });
        } else if (isSansSerifAlone) {
          issues.push({
            type: 'warning',
            category: 'slop',
            message: 'Font-family is bare "sans-serif" — specify a named font for brand consistency.',
          });
        }
      }
    }

    // 1d. Check Tailwind font classes (font-sans resolves to Inter/system-ui)
    if (/\bfont-sans\b/.test(allClasses) && !isIntentionalFont('Inter', designMdContent)) {
      issues.push({
        type: 'info',
        category: 'slop',
        message: 'Tailwind "font-sans" class detected — resolves to system sans-serif. Consider specifying a custom font.',
      });
    }

    return issues;
  },
};
