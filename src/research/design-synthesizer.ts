/**
 * Design Synthesizer — transforms BusinessResearchResult into a tailored DESIGN.md.
 *
 * Uses real brand data (colors, fonts, competitor analysis) when available,
 * falling back to the static template generator for low-confidence research.
 */

import type {
  BusinessModelContext,
  BusinessResearchResult,
  CompetitorAnalysis,
  SynthesizedDesign,
} from './types.js';
import {
  generateDesignMdTemplate,
  matchIndustry,
  matchAesthetic,
  generateImageryGuidelines,
  generateDosAndDonts,
  type DesignBrief,
} from '../templates/design-md.js';
import { scoreDesignMd } from '../utils/design-validator.js';

// ─── Color naming utility ──────────────────────────────────────────

function parseHexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return [h * 360, s * 100, l * 100];
}

function getHueCategory(hue: number): string {
  if (hue < 15 || hue >= 345) return 'Red';
  if (hue < 40) return 'Orange';
  if (hue < 70) return 'Yellow';
  if (hue < 150) return 'Green';
  if (hue < 190) return 'Teal';
  if (hue < 270) return 'Blue';
  if (hue < 310) return 'Purple';
  if (hue < 345) return 'Rose';
  return 'Red';
}

function getToneWord(saturation: number, lightness: number): string {
  if (lightness < 25) return 'Deep';
  if (lightness > 80) return 'Light';
  if (saturation > 70) return 'Vivid';
  if (saturation < 20) return 'Muted';
  if (lightness < 40) return 'Dark';
  return 'Rich';
}

/**
 * Generates a descriptive name for a hex color given a context word.
 * E.g. nameColor('#DC0C0C', 'Storefront') -> "Storefront Red"
 */
export function nameColor(hex: string, context: string): string {
  const [r, g, b] = parseHexToRgb(hex);
  const [hue, saturation, lightness] = rgbToHsl(r, g, b);

  // Very low saturation = grayscale
  if (saturation < 10) {
    if (lightness < 20) return `${context} Black`;
    if (lightness > 90) return `${context} White`;
    return `${context} Gray`;
  }

  const hueCategory = getHueCategory(hue);

  // Refine common hue+tone combos
  if (hueCategory === 'Blue' && lightness < 30) return `${context} Navy`;
  if (hueCategory === 'Green' && saturation < 40) return `${context} Sage`;
  if (hueCategory === 'Red' && lightness < 35) return `${context} Crimson`;
  if (hueCategory === 'Orange' && lightness > 60) return `${context} Amber`;

  return `${context} ${hueCategory}`;
}

// ─── Hex distance utility ──────────────────────────────────────────

function hexDistance(a: string, b: string): number {
  const [r1, g1, b1] = parseHexToRgb(a);
  const [r2, g2, b2] = parseHexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function shiftHue(hex: string, degrees: number): string {
  const [r, g, b] = parseHexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const newH = (h + degrees + 360) % 360;
  return hslToHex(newH, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// ─── Curated font lists ────────────────────────────────────────────

const SERIF_HEADINGS = [
  'DM Serif Display',
  'Instrument Serif',
  'Playfair Display',
  'Lora',
  'Merriweather',
];

const SANS_HEADINGS = [
  'Space Grotesk',
  'Outfit',
  'Sora',
  'DM Sans',
  'Manrope',
  'General Sans',
];

const BODY_FONTS = [
  'Libre Franklin',
  'Source Sans 3',
  'Nunito Sans',
  'Instrument Sans',
  'Work Sans',
];

// ─── Palette synthesizer ───────────────────────────────────────────

interface SynthesizedPaletteEntry {
  name: string;
  hex: string;
  rationale?: string;
}

interface SynthesizedPalette {
  primary: SynthesizedPaletteEntry & { rationale: string };
  secondary: SynthesizedPaletteEntry & { rationale: string };
  accent?: SynthesizedPaletteEntry & { rationale: string };
  surface: SynthesizedPaletteEntry;
  onSurface: SynthesizedPaletteEntry;
  muted: SynthesizedPaletteEntry;
}

export function synthesizePalette(
  research: BusinessResearchResult,
): SynthesizedPalette {
  const aesthetic = matchAesthetic(research.brief.aesthetic);
  let primaryHex: string;
  let primaryName: string;
  let primaryRationale: string;
  let secondaryHex: string;
  let secondaryName: string;
  let secondaryRationale: string;
  let accentHex: string | undefined;
  let accentName: string | undefined;
  let accentRationale: string | undefined;

  const hasSitePalette =
    research.currentSite?.palette &&
    research.currentSite.palette.colors.length > 0;

  if (hasSitePalette) {
    // Priority 1: Use real brand colors from current site
    const site = research.currentSite!;
    const dominant =
      site.palette.dominantHex || site.palette.colors[0]!.hex;
    primaryHex = dominant;
    primaryName = nameColor(dominant, 'Brand');
    primaryRationale = `Extracted from existing site ${site.url} — maintains brand continuity`;

    if (site.palette.accentHex) {
      secondaryHex = site.palette.accentHex;
      secondaryName = nameColor(site.palette.accentHex, 'Accent');
      secondaryRationale = `Accent color from existing site — preserves established visual hierarchy`;
    } else if (site.palette.colors.length > 1) {
      const second = site.palette.colors[1]!;
      secondaryHex = second.hex;
      secondaryName = nameColor(second.hex, 'Supporting');
      secondaryRationale = `Secondary color from existing site palette`;
    } else {
      const industryPalette = matchIndustry(research.brief.industry);
      secondaryHex = industryPalette.secondary.hex;
      secondaryName = industryPalette.secondary.name;
      secondaryRationale = `Industry-standard secondary for ${research.brief.industry}`;
    }

    // Check if primary is too similar to competitors
    if (research.competitors.length > 0) {
      for (const comp of research.competitors) {
        if (
          comp.palette.dominantHex &&
          hexDistance(primaryHex, comp.palette.dominantHex) < 50
        ) {
          // Shift hue to differentiate
          primaryHex = shiftHue(primaryHex, 30);
          primaryName = nameColor(primaryHex, 'Distinct');
          primaryRationale += ` (hue shifted +30deg to differentiate from ${comp.name})`;
          break;
        }
      }
    }
  } else if (research.competitors.length > 0) {
    // Priority 2: Use industry palette but differentiate from competitors
    const industryPalette = matchIndustry(research.brief.industry);
    primaryHex = industryPalette.primary.hex;
    primaryName = industryPalette.primary.name;
    primaryRationale = `Industry palette for ${research.brief.industry}`;

    // Check for competitor collision
    for (const comp of research.competitors) {
      if (
        comp.palette.dominantHex &&
        hexDistance(primaryHex, comp.palette.dominantHex) < 50
      ) {
        primaryHex = shiftHue(primaryHex, 30);
        primaryName = nameColor(primaryHex, 'Distinct');
        primaryRationale = `Industry palette shifted to differentiate from ${comp.name}`;
        break;
      }
    }

    secondaryHex = industryPalette.secondary.hex;
    secondaryName = industryPalette.secondary.name;
    secondaryRationale = `Industry-standard secondary for ${research.brief.industry}`;

    if (industryPalette.accent) {
      accentHex = industryPalette.accent.hex;
      accentName = industryPalette.accent.name;
      accentRationale = `Industry accent for ${research.brief.industry}`;
    }
  } else {
    // Priority 3: Pure industry palette fallback
    const industryPalette = matchIndustry(research.brief.industry);
    primaryHex = industryPalette.primary.hex;
    primaryName = industryPalette.primary.name;
    primaryRationale = `Industry palette for ${research.brief.industry} (no site or competitor data available)`;

    secondaryHex = industryPalette.secondary.hex;
    secondaryName = industryPalette.secondary.name;
    secondaryRationale = `Industry-standard secondary for ${research.brief.industry}`;

    if (industryPalette.accent) {
      accentHex = industryPalette.accent.hex;
      accentName = industryPalette.accent.name;
      accentRationale = `Industry accent for ${research.brief.industry}`;
    }
  }

  const result: SynthesizedPalette = {
    primary: { name: primaryName, hex: primaryHex, rationale: primaryRationale },
    secondary: {
      name: secondaryName,
      hex: secondaryHex,
      rationale: secondaryRationale,
    },
    surface: { name: aesthetic.surface.name, hex: aesthetic.surface.hex },
    onSurface: { name: aesthetic.onSurface.name, hex: aesthetic.onSurface.hex },
    muted: { name: aesthetic.muted.name, hex: aesthetic.muted.hex },
  };

  if (accentHex && accentName && accentRationale) {
    result.accent = {
      name: accentName,
      hex: accentHex,
      rationale: accentRationale,
    };
  }

  return result;
}

// ─── Typography synthesizer ────────────────────────────────────────

interface SynthesizedTypography {
  heading: string;
  body: string;
  mono: string;
  rationale: string;
}

export function synthesizeTypography(
  research: BusinessResearchResult,
): SynthesizedTypography {
  const aesthetic = matchAesthetic(research.brief.aesthetic);

  // Priority 1: Keep existing brand fonts
  if (research.currentSite?.typography?.fonts?.length) {
    const site = research.currentSite;
    const heading = site.typography.headingFont || site.typography.fonts[0]!;
    const body =
      site.typography.bodyFont ||
      (site.typography.fonts.length > 1
        ? site.typography.fonts[1]!
        : BODY_FONTS[0]!);

    return {
      heading,
      body,
      mono: aesthetic.monoFont.replace(/"/g, '').split(',')[0]!.trim(),
      rationale: `Fonts from existing site ${site.url} preserved for brand consistency`,
    };
  }

  // Priority 2: Differentiate from competitors
  if (research.competitors.length > 0) {
    const competitorHeadingFonts = new Set<string>();
    const competitorBodyFonts = new Set<string>();

    for (const comp of research.competitors) {
      if (comp.typography.headingFont) {
        competitorHeadingFonts.add(comp.typography.headingFont);
      }
      if (comp.typography.bodyFont) {
        competitorBodyFonts.add(comp.typography.bodyFont);
      }
      for (const font of comp.typography.fonts) {
        competitorHeadingFonts.add(font);
        competitorBodyFonts.add(font);
      }
    }

    // Determine aesthetic heading category preference
    const aestheticHeading = aesthetic.headingFont;
    const preferSerif = /serif/i.test(aestheticHeading) && !/sans/i.test(aestheticHeading);
    const headingPool = preferSerif ? SERIF_HEADINGS : SANS_HEADINGS;

    // Find a heading font not used by competitors
    let heading =
      headingPool.find((f) => !competitorHeadingFonts.has(f)) ||
      headingPool[0]!;

    // Find a body font not used by competitors
    let body =
      BODY_FONTS.find((f) => !competitorBodyFonts.has(f)) || BODY_FONTS[0]!;

    const competitorNames = research.competitors
      .map((c) => c.name)
      .join(', ');

    return {
      heading,
      body,
      mono: aesthetic.monoFont.replace(/"/g, '').split(',')[0]!.trim(),
      rationale: `Chosen to differentiate from competitors (${competitorNames})`,
    };
  }

  // Priority 3: Aesthetic fallback
  return {
    heading: aesthetic.headingFont.replace(/"/g, '').split(',')[0]!.trim(),
    body: aesthetic.bodyFont.replace(/"/g, '').split(',')[0]!.trim(),
    mono: aesthetic.monoFont.replace(/"/g, '').split(',')[0]!.trim(),
    rationale: `Based on ${research.brief.aesthetic} aesthetic defaults`,
  };
}

// ─── Imagery synthesizer ──────────────────────────────────────────

export function synthesizeImagery(
  research: BusinessResearchResult,
): string {
  const lines: string[] = [];

  // Base imagery from template system
  const baseImagery = generateImageryGuidelines(
    research.brief.industry,
    research.brief.targetAudience,
  );
  lines.push(baseImagery);

  // Cultural considerations from audience insights
  if (research.audienceInsights.culturalConsiderations.length > 0) {
    lines.push('');
    lines.push(
      `Cultural notes: ${research.audienceInsights.culturalConsiderations.join('. ')}.`,
    );
  }

  // Market position adjustments
  if (research.marketPosition.pricePoint === 'budget') {
    lines.push('');
    lines.push(
      'Emphasize value: show real products with visible pricing, authentic shopping environments, and approachable settings.',
    );
  } else if (
    research.marketPosition.pricePoint === 'premium' ||
    research.marketPosition.pricePoint === 'luxury'
  ) {
    lines.push('');
    lines.push(
      'Emphasize quality: editorial-grade photography with minimal backgrounds, studio lighting, and careful composition.',
    );
  }

  // Photo format specs (always include)
  lines.push('');
  lines.push(
    'Standard formats: 16:9 hero banners, 4:3 feature cards, 1:1 product/team thumbnails.',
  );

  // Avoid line
  const avoidItems: string[] = [
    'generic stock photos with artificial smiles',
    'over-processed HDR imagery',
  ];
  if (
    research.marketPosition.pricePoint === 'budget' ||
    research.marketPosition.pricePoint === 'mid-range'
  ) {
    avoidItems.push('luxury lifestyle imagery that contradicts value positioning');
  }
  if (
    research.audienceInsights.culturalConsiderations.some((c) =>
      /mexic|latin|español/i.test(c),
    )
  ) {
    avoidItems.push('American/European stock photography for Latin audiences');
  }
  lines.push('');
  lines.push(`Avoid: ${avoidItems.join('; ')}.`);

  return lines.join('\n');
}

// ─── Do's and Don'ts synthesizer ───────────────────────────────────

export function synthesizeDosAndDonts(
  research: BusinessResearchResult,
): { dos: string[]; donts: string[] } {
  // Start with base anti-slop rules
  const base = generateDosAndDonts(
    research.brief.industry,
    research.brief.targetAudience,
  );
  const dos = [...base.dos];
  const donts = [...base.donts];

  // Add competitor-derived rules
  for (const comp of research.competitors) {
    if (comp.palette.dominantHex) {
      donts.push(
        `Don't use ${comp.palette.dominantHex} as primary color — it's ${comp.name}'s brand color`,
      );
    }
    if (comp.typography.headingFont) {
      donts.push(
        `Don't use ${comp.typography.headingFont} for headings — already associated with ${comp.name}`,
      );
    }
  }

  // Cultural considerations
  for (const consideration of research.audienceInsights.culturalConsiderations) {
    dos.push(`Respect local context: ${consideration}`);
  }

  // Market position rules
  if (research.marketPosition.pricePoint === 'budget') {
    dos.push('Show prices prominently on every product card');
    donts.push(
      "Don't hide pricing behind navigation or interstitials",
    );
  }

  // Layout pattern rules from current site
  if (research.currentSite?.layoutPatterns) {
    const patterns = research.currentSite.layoutPatterns;
    if (patterns.includes('hero-banner')) {
      dos.push('Maintain the existing hero banner pattern for visual continuity');
    }
    if (patterns.includes('card-grid')) {
      dos.push('Keep the card grid layout for browsable content sections');
    }
  }

  // Business-model-aware rules
  const bm = research.businessModel;
  if (bm) {
    if (bm.type === 'physical-retail') {
      dos.push('Make store locator or "find nearest store" the primary CTA on every page');
      dos.push('Show weekly deals as a browsable flyer, not as a shopping interface');
      dos.push('Include store hours and location information prominently');
      dos.push('Feature the store count and geographic reach as social proof');
      donts.push("Don't add a shopping cart, checkout flow, or 'add to cart' buttons — this is not an e-commerce site");
      donts.push("Don't show product detail pages with purchase options");
      donts.push("Don't use e-commerce patterns (product grid with buy buttons, wishlists, user accounts)");
    }

    if (bm.type === 'e-commerce') {
      dos.push('Make product search and category navigation the primary interaction');
      dos.push('Show product images, prices, and add-to-cart buttons on product cards');
      dos.push('Include trust badges, shipping info, and return policy prominently');
      donts.push("Don't hide the shopping cart or make checkout multi-step without progress indicator");
    }

    if (bm.type === 'saas') {
      dos.push('Show the product in action with realistic screenshots or demo');
      dos.push('Make pricing and plan comparison easily accessible');
      dos.push('Include a prominent free trial or demo CTA above the fold');
      donts.push("Don't use generic feature lists without showing the actual product");
      donts.push("Don't hide pricing behind a 'contact sales' wall unless enterprise-only");
    }

    if (bm.type === 'service') {
      dos.push('Make booking or contact form the primary CTA');
      dos.push('Show team credentials, certifications, and client testimonials');
      donts.push("Don't hide contact information behind multiple clicks");
    }
  }

  // Deduplicate — normalize to catch near-duplicates
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
  const dedup = (arr: string[]): string[] => {
    const seen = new Set<string>();
    return arr.filter(item => {
      const key = normalize(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return { dos: dedup(dos), donts: dedup(donts) };
}

// ─── Markdown assembly ─────────────────────────────────────────────

function assembleDesignMd(
  research: BusinessResearchResult,
  palette: SynthesizedPalette,
  typography: SynthesizedTypography,
  imagery: string,
  dosAndDonts: { dos: string[]; donts: string[] },
): string {
  const { brief } = research;
  const aesthetic = matchAesthetic(brief.aesthetic);

  // Section 1: Visual Theme & Atmosphere
  const themeLines: string[] = [];
  themeLines.push(
    `${brief.aesthetic} design language for ${brief.companyName}, a ${brief.industry} brand serving ${brief.targetAudience}.`,
  );
  if (research.currentSite) {
    themeLines.push(
      'Building on the existing brand identity with refinements for modern web standards.',
    );
  }
  if (research.competitors.length > 0) {
    const compNames = research.competitors
      .map((c) => c.name)
      .join(', ');
    themeLines.push(
      `Differentiated from competitors like ${compNames} through unique typography and color palette choices.`,
    );
  }
  themeLines.push(
    `The visual identity balances a ${research.marketPosition.personality} personality with the practical needs of ${brief.targetAudience}.`,
  );

  // Add business model context when confidence is sufficient
  const bm = research.businessModel;
  if (bm && bm.confidence >= 40) {
    themeLines.push('');
    themeLines.push(`**Business Model**: ${bm.type.replace('-', ' ')} — ${bm.primaryRevenue}.`);
    themeLines.push(`**Website Purpose**: ${bm.websitePurpose}`);
    if (bm.primaryUserGoals.length > 0) {
      themeLines.push('**Primary User Goals**:');
      bm.primaryUserGoals.forEach((g, i) => themeLines.push(`${i + 1}. ${g}`));
    }
    if (bm.keyFeatures.length > 0) {
      themeLines.push(`**Key Page Elements**: ${bm.keyFeatures.join(', ')}.`);
    }
    if (bm.notFeatures.length > 0) {
      themeLines.push(`**Avoid on this site**: ${bm.notFeatures.join(', ')}.`);
    }
  }

  const themeText = themeLines.join('\n');

  // Section 2: Color table
  const accentRow = palette.accent
    ? `| Accent | ${palette.accent.name} | ${palette.accent.hex} | Tertiary highlights, category markers |\n`
    : '';

  // Section 5: Components
  const btnRadius = aesthetic.borderRadius.split(',')[0] || '6px';
  const cardRadius = aesthetic.borderRadius.split(',')[1]?.trim() || '8px';

  const md = `# ${brief.companyName} — Design System

## 1. Visual Theme & Atmosphere

${themeText}

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | ${palette.primary.name} | ${palette.primary.hex} | Main brand color, CTAs, key UI elements |
| Secondary | ${palette.secondary.name} | ${palette.secondary.hex} | Supporting elements, hover states, accents |
${accentRow}| Surface | ${palette.surface.name} | ${palette.surface.hex} | Background, cards |
| On-Surface | ${palette.onSurface.name} | ${palette.onSurface.hex} | Body text on surface |
| Error | Signal Red | #DC2626 | Error states, destructive actions |
| Success | Verified Green | #16A34A | Success states, confirmations |
| Muted | ${palette.muted.name} | ${palette.muted.hex} | Disabled states, section alternates |
| Border | Light Border | #E5E5E5 | Card borders, dividers, input outlines |

## 3. Typography

- **Heading**: "${typography.heading}", sans-serif
- **Body**: "${typography.body}", sans-serif
- **Mono**: "${typography.mono}", monospace

${typography.rationale}

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2.75rem | 700 | 1.15 |
| H2 | 2rem | 700 | 1.2 |
| H3 | 1.375rem | 600 | 1.3 |
| Body | 1rem | 400 | 1.6 |
| Small | 0.875rem | 400 | 1.5 |

## 4. Spacing & Layout

- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96
- **Max content width**: 1200px
- **Grid**: 12-column, 20px gutter
- **Breakpoints**: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- **Section vertical padding**: 64px desktop, 40px mobile

## 5. Component Patterns

### Buttons
- Primary: filled with Primary color, white text, ${btnRadius}, 14px 28px padding
- Secondary: outline with Primary border, Primary text
- Ghost: no background, Primary text, hover shows Muted background

### Cards
- Surface background, 1px Border color, ${cardRadius}, 20px padding
- Shadow: ${aesthetic.shadowStyle}
- Hover: slight elevation increase

### Inputs
- 1px Border color, ${btnRadius}, 12px 16px padding
- Focus: Primary border, subtle Primary ring
- Error: Error border, Error text below

## 6. Iconography

${aesthetic.iconStyle}

## 7. Imagery Guidelines

${imagery}

## 8. Do's and Don'ts

### Do
${dosAndDonts.dos.map((d) => `- ${d}`).join('\n')}

### Don't
${dosAndDonts.donts.map((d) => `- ${d}`).join('\n')}
`;

  return md;
}

// ─── Main synthesizer ──────────────────────────────────────────────

/**
 * Transforms a BusinessResearchResult into a full, scored DESIGN.md.
 *
 * Falls back to the static template generator when research confidence is < 30.
 */
const DEFAULT_BUSINESS_MODEL: BusinessModelContext = {
  type: 'other',
  primaryRevenue: 'Unknown',
  websitePurpose: 'Inform visitors about the organization.',
  primaryUserGoals: ['Learn about the organization'],
  keyFeatures: [],
  notFeatures: [],
  differentiators: [],
  confidence: 0,
};

export function synthesizeDesign(
  research: BusinessResearchResult,
): SynthesizedDesign {
  // Ensure businessModel is always present (fallback for legacy callers)
  if (!research.businessModel) {
    research = { ...research, businessModel: DEFAULT_BUSINESS_MODEL };
  }

  const sources: string[] = [];

  // Low confidence: fall back to static template
  if (research.confidence < 30) {
    const fallbackBrief: DesignBrief = {
      companyName: research.brief.companyName,
      industry: research.brief.industry,
      targetAudience: research.brief.targetAudience,
      aesthetic: research.brief.aesthetic,
    };
    const markdown = generateDesignMdTemplate(fallbackBrief);
    const tokenEstimate = Math.ceil(markdown.length / 4);
    const qualityScore = scoreDesignMd(markdown, research);

    // Apply fallback penalty: template-generated output is less specific
    // and not research-informed, cap specificity and differentiation
    qualityScore.specificity = Math.min(qualityScore.specificity, 15);
    qualityScore.differentiation = Math.min(qualityScore.differentiation, 10);
    qualityScore.total =
      qualityScore.specificity +
      qualityScore.differentiation +
      qualityScore.completeness +
      qualityScore.actionability;
    qualityScore.issues.push({
      section: 'General',
      severity: 'warning',
      message: 'Generated from static template due to low research confidence — not informed by real brand or competitor data',
    });

    sources.push('template_fallback');
    sources.push(...research.fallbacksUsed);

    return { markdown, tokenEstimate, qualityScore, sources };
  }

  // High confidence: synthesize from research data
  if (research.currentSite) {
    sources.push(`site:${research.currentSite.url}`);
  }
  for (const comp of research.competitors) {
    sources.push(`competitor:${comp.url}`);
  }
  if (sources.length === 0) {
    sources.push('industry_defaults');
  }
  sources.push(...research.fallbacksUsed);

  const palette = synthesizePalette(research);
  const typography = synthesizeTypography(research);
  const imagery = synthesizeImagery(research);
  const dosAndDonts = synthesizeDosAndDonts(research);

  const markdown = assembleDesignMd(
    research,
    palette,
    typography,
    imagery,
    dosAndDonts,
  );
  const tokenEstimate = Math.ceil(markdown.length / 4);
  const qualityScore = scoreDesignMd(markdown, research);

  return { markdown, tokenEstimate, qualityScore, sources };
}
