import { load } from 'cheerio';
import type {
  BusinessBrief,
  BusinessModelContext,
  SiteAnalysis,
  ExtractedPalette,
  ExtractedTypography,
  ExtractedColor,
  CompetitorAnalysis,
  AudienceInsight,
  MarketPosition,
  BusinessResearchResult,
} from './types.js';

// ─── Color Extraction ──────────────────────────────────────────────

const HEX_PATTERN = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

function normalizeHex(hex: string): string {
  const h = hex.toUpperCase();
  if (h.length === 4) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

function classifyContext(
  declaration: string,
): ExtractedColor['context'] {
  const lower = declaration.toLowerCase();
  if (/\bborder-color\b|\bborder\b/.test(lower)) return 'border';
  if (/\bbackground-color\b|\bbackground\b|\bbg\b/.test(lower)) return 'background';
  if (/\bcolor\b/.test(lower)) return 'text';
  return 'unknown';
}

/**
 * Extract color palette from HTML by parsing style blocks and inline styles.
 */
export function extractPalette(html: string): ExtractedPalette {
  const $ = load(html);
  const colorMap = new Map<string, { frequency: number; context: ExtractedColor['context'] }>();

  function recordColor(hex: string, context: ExtractedColor['context']): void {
    const normalized = normalizeHex(hex);
    const existing = colorMap.get(normalized);
    if (existing) {
      existing.frequency += 1;
      // Prefer more specific context over 'unknown'
      if (existing.context === 'unknown' && context !== 'unknown') {
        existing.context = context;
      }
    } else {
      colorMap.set(normalized, { frequency: 1, context });
    }
  }

  function extractFromCSS(css: string): void {
    // Match CSS custom properties: --var: #hex
    const customPropRegex = /--[\w-]+\s*:\s*(#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b)/g;
    let match: RegExpExecArray | null;
    while ((match = customPropRegex.exec(css)) !== null) {
      recordColor(match[1], 'unknown');
    }

    // Match property: value pairs containing hex colors
    const declRegex = /([\w-]+)\s*:\s*([^;}{]+)/g;
    while ((match = declRegex.exec(css)) !== null) {
      const property = match[1];
      const value = match[2];
      const hexMatches = value.match(HEX_PATTERN);
      if (hexMatches) {
        const ctx = classifyContext(property);
        for (const hex of hexMatches) {
          recordColor(hex, ctx);
        }
      }
    }
  }

  // Extract from <style> blocks
  $('style').each((_i, el) => {
    const css = $(el).text();
    extractFromCSS(css);
  });

  // Extract from inline style attributes
  $('[style]').each((_i, el) => {
    const style = $(el).attr('style') ?? '';
    extractFromCSS(style);
  });

  // Build sorted color list
  const colors: ExtractedColor[] = [];
  for (const [hex, data] of colorMap) {
    colors.push({ hex, frequency: data.frequency, context: data.context });
  }
  colors.sort((a, b) => b.frequency - a.frequency);

  // Filter out structural colors — grays, blacks, whites used for layout, not brand identity
  const isStructuralColor = (hex: string): boolean => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    // Any near-gray (R≈G≈B) is structural: text colors, borders, backgrounds
    if (maxDiff < 20) return true;
    // Pure white or near-white
    if (r > 240 && g > 240 && b > 240) return true;
    return false;
  };

  const brandColors = colors.filter(c => !isStructuralColor(c.hex));
  const brandBgColors = brandColors.filter(c => c.context === 'background');
  const brandAccentColors = brandColors.filter(c => c.context !== 'background');

  // Dominant = most frequent brand-colored background, or most frequent brand color overall
  const dominantHex = brandBgColors.length > 0
    ? brandBgColors[0].hex
    : brandColors.length > 0
      ? brandColors[0].hex
      : colors.length > 0 ? colors[0].hex : '';

  const accentHex = brandAccentColors.length > 0
    ? brandAccentColors.find(c => c.hex !== dominantHex)?.hex
    : brandColors.find(c => c.hex !== dominantHex)?.hex;

  return { colors, dominantHex, accentHex };
}

// ─── Typography Extraction ─────────────────────────────────────────

const GENERIC_FONTS = new Set([
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'inherit',
  'initial',
  'unset',
]);

// Icon fonts that should never be used as heading/body fonts
const ICON_FONTS = new Set([
  'dashicons',
  'material icons',
  'material symbols outlined',
  'material symbols rounded',
  'fontawesome',
  'font awesome',
  'fa',
  'glyphicons',
  'icomoon',
  'ionicons',
  'feather',
  'lucide',
  'phosphor',
  'heroicons',
  'bootstrap-icons',
]);

function cleanFontName(name: string): string {
  return name
    .replace(/['"]/g, '')
    .replace(/\+/g, ' ')
    .trim();
}

/**
 * Extract typography information from HTML.
 */
export function extractTypography(html: string): ExtractedTypography {
  const $ = load(html);
  const fontsSet = new Set<string>();
  let headingFont: string | undefined;
  let bodyFont: string | undefined;

  // Check for Google Fonts <link> tags
  $('link[href*="fonts.googleapis.com"]').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    // Match family=Font+Name patterns (CSS2 and legacy formats)
    const familyMatches = href.matchAll(/family=([^&:;]+)/g);
    for (const m of familyMatches) {
      // CSS2 format may have weight specs after colon
      const familyStr = m[1].split(':')[0];
      const cleaned = cleanFontName(familyStr);
      if (cleaned) fontsSet.add(cleaned);
    }
  });

  // Parse font-family from CSS
  const cssBlocks: Array<{ selector: string; body: string }> = [];

  function parseCSS(css: string): void {
    // Simple CSS rule parser: selector { body }
    const ruleRegex = /([^{}]+)\{([^}]+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = ruleRegex.exec(css)) !== null) {
      cssBlocks.push({ selector: match[1].trim(), body: match[2] });
    }
  }

  $('style').each((_i, el) => {
    parseCSS($(el).text());
  });

  for (const block of cssBlocks) {
    const fontFamilyMatch = block.body.match(/font-family\s*:\s*([^;]+)/);
    if (!fontFamilyMatch) continue;

    const families = fontFamilyMatch[1].split(',');
    for (const raw of families) {
      const cleaned = cleanFontName(raw);
      if (cleaned && !GENERIC_FONTS.has(cleaned.toLowerCase()) && !ICON_FONTS.has(cleaned.toLowerCase())) {
        fontsSet.add(cleaned);
      }
    }

    // Heuristic: heading vs body font
    const selector = block.selector.toLowerCase();
    const firstFont = families
      .map((f) => cleanFontName(f))
      .find((f) => f && !GENERIC_FONTS.has(f.toLowerCase()) && !ICON_FONTS.has(f.toLowerCase()));

    if (firstFont) {
      if (/\bh[1-3]\b/.test(selector) && !headingFont) {
        headingFont = firstFont;
      }
      if (/\bbody\b|\bp\b/.test(selector) && !bodyFont) {
        bodyFont = firstFont;
      }
    }
  }

  return {
    fonts: Array.from(fontsSet),
    headingFont,
    bodyFont,
  };
}

// ─── Layout Detection ──────────────────────────────────────────────

/**
 * Detect common layout patterns from HTML DOM structure.
 */
export function detectLayoutPatterns(html: string): string[] {
  const $ = load(html);
  const patterns: string[] = [];

  // Hero banner: first <section> or large div with background image/gradient + heading
  const firstSection = $('section').first();
  if (firstSection.length) {
    const style = (firstSection.attr('style') ?? '').toLowerCase();
    const cls = (firstSection.attr('class') ?? '').toLowerCase();
    const hasH1 = firstSection.find('h1').length > 0;
    const hasBg =
      style.includes('background-image') ||
      style.includes('background:') ||
      cls.includes('hero');
    if (hasH1 || hasBg) {
      patterns.push('hero-banner');
    }
  }

  // Sticky/fixed nav
  $('nav, header').each((_i, el) => {
    const style = ($(el).attr('style') ?? '').toLowerCase();
    const cls = ($(el).attr('class') ?? '').toLowerCase();
    if (
      style.includes('position: sticky') ||
      style.includes('position: fixed') ||
      style.includes('position:sticky') ||
      style.includes('position:fixed') ||
      cls.includes('sticky') ||
      cls.includes('fixed')
    ) {
      if (!patterns.includes('sticky-nav')) {
        patterns.push('sticky-nav');
      }
    }
  });

  // Card patterns: repeating child elements with image + text
  $('div, section, ul').each((_i, el) => {
    const children = $(el).children();
    if (children.length >= 3) {
      let cardLikeCount = 0;
      children.each((_j, child) => {
        const hasImage = $(child).find('img').length > 0;
        const hasText =
          $(child).find('p, span, h2, h3, h4').length > 0 ||
          $(child).text().trim().length > 0;
        if (hasImage && hasText) cardLikeCount++;
      });

      if (cardLikeCount >= 3 && !patterns.includes('card-grid')) {
        patterns.push('card-grid');
      }
    }
  });

  // Multi-column grid: 3+ sibling elements
  $('div, section').each((_i, el) => {
    const children = $(el).children();
    const style = ($(el).attr('style') ?? '').toLowerCase();
    const cls = ($(el).attr('class') ?? '').toLowerCase();
    const isGrid =
      style.includes('grid') ||
      style.includes('flex') ||
      cls.includes('grid') ||
      cls.includes('columns');

    if (children.length >= 3 && isGrid) {
      if (children.length === 3 && !patterns.includes('three-column-grid')) {
        patterns.push('three-column-grid');
      } else if (children.length > 3 && !patterns.includes('multi-column-grid')) {
        patterns.push('multi-column-grid');
      }
    }
  });

  // Full-width sections: checking for vw units or full-width classes
  $('section, div').each((_i, el) => {
    const style = ($(el).attr('style') ?? '').toLowerCase();
    const cls = ($(el).attr('class') ?? '').toLowerCase();
    if (
      style.includes('100vw') ||
      style.includes('width: 100%') ||
      style.includes('width:100%') ||
      cls.includes('full-width') ||
      cls.includes('container-fluid')
    ) {
      if (!patterns.includes('full-width-sections')) {
        patterns.push('full-width-sections');
      }
    }
  });

  return patterns;
}

// ─── Audience Insights ─────────────────────────────────────────────

interface IndustryProfile {
  keywords: RegExp;
  trustSignals: string[];
  accessibilityNeeds: string[];
  expectations: string[];
}

const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    keywords: /\b(retail|grocery|discount|store|tienda|supermercado|mart)\b/i,
    trustSignals: [
      'Visible pricing on every product',
      'Location finder',
      'Weekly deals prominently displayed',
      'Clean organized layout',
    ],
    accessibilityNeeds: [
      'High contrast text',
      'Large tap targets for mobile',
      'Simple navigation',
    ],
    expectations: [
      'Find nearest store',
      'See current deals',
      'Browse product categories',
      'Check prices quickly',
    ],
  },
  {
    keywords: /\b(fintech|banking|payments?|financial|finance|bank)\b/i,
    trustSignals: [
      'Security certifications visible',
      'Regulatory compliance badges',
      'Data encryption indicators',
    ],
    accessibilityNeeds: [
      'Screen reader support for financial data',
      'Color-blind safe charts',
    ],
    expectations: [
      'Clear pricing/fee structure',
      'API documentation',
      'Dashboard preview',
      'Customer support access',
    ],
  },
  {
    keywords: /\b(saas|software|technology|tech|platform|app|cloud)\b/i,
    trustSignals: [
      'Customer logos',
      'Usage metrics',
      'SOC2/ISO badges',
    ],
    accessibilityNeeds: [
      'Keyboard navigation',
      'Responsive design',
    ],
    expectations: [
      'Product demo/screenshots',
      'Pricing tiers',
      'Integration list',
      'Documentation link',
    ],
  },
  {
    keywords: /\b(healthcare|health|wellness|medical|clinic|hospital)\b/i,
    trustSignals: [
      'Provider credentials',
      'Patient testimonials',
      'HIPAA compliance',
    ],
    accessibilityNeeds: [
      'WCAG AA compliance',
      'Large readable text',
      'Clear form labels',
    ],
    expectations: [
      'Appointment booking',
      'Service listings',
      'Insurance information',
    ],
  },
  {
    keywords: /\b(education|school|university|learning|academy|course)\b/i,
    trustSignals: [
      'Accreditation badges',
      'Student outcomes',
      'Faculty credentials',
    ],
    accessibilityNeeds: [
      'Screen reader compatible',
      'Captioned media',
      'Dyslexia-friendly fonts',
    ],
    expectations: [
      'Course catalog',
      'Enrollment process',
      'Student portal access',
    ],
  },
];

interface LocaleProfile {
  keywords: RegExp;
  considerations: string[];
}

const LOCALE_PROFILES: LocaleProfile[] = [
  {
    keywords: /\b(es-mx|mexican|mexico|m[eé]xico)\b/i,
    considerations: [
      'Use Spanish copy naturally, not translated',
      'Reflect Mexican family values',
      'Avoid US-centric imagery',
      'Consider regional color meanings',
    ],
  },
  {
    keywords: /\b(es-|latin|latino|latina|latinx|hispano|hispanic)\b/i,
    considerations: [
      'Warm, family-oriented imagery',
      'Community-focused messaging',
    ],
  },
];

/**
 * Infer audience insights from industry and audience descriptions.
 * Knowledge-base lookup, not web search.
 */
export function inferAudienceInsights(
  industry: string,
  audience: string,
  locale?: string,
): AudienceInsight {
  const combined = `${industry} ${audience}`;
  const trustSignals: string[] = [];
  const accessibilityNeeds: string[] = [];
  const expectations: string[] = [];
  const culturalConsiderations: string[] = [];

  // Match industry profiles
  for (const profile of INDUSTRY_PROFILES) {
    if (profile.keywords.test(combined)) {
      for (const s of profile.trustSignals) {
        if (!trustSignals.includes(s)) trustSignals.push(s);
      }
      for (const a of profile.accessibilityNeeds) {
        if (!accessibilityNeeds.includes(a)) accessibilityNeeds.push(a);
      }
      for (const e of profile.expectations) {
        if (!expectations.includes(e)) expectations.push(e);
      }
    }
  }

  // Fallback if no industry matched
  if (trustSignals.length === 0) {
    trustSignals.push('Clear contact information', 'Professional design');
    accessibilityNeeds.push('Responsive design', 'Readable font sizes');
    expectations.push('Easy navigation', 'Clear value proposition');
  }

  // Locale/cultural considerations
  const localeStr = `${locale ?? ''} ${audience}`;
  for (const lp of LOCALE_PROFILES) {
    if (lp.keywords.test(localeStr)) {
      for (const c of lp.considerations) {
        if (!culturalConsiderations.includes(c)) culturalConsiderations.push(c);
      }
    }
  }

  return {
    trustSignals,
    accessibilityNeeds,
    culturalConsiderations,
    expectations,
  };
}

// ─── Market Position ───────────────────────────────────────────────

/**
 * Infer market position from the business brief text.
 */
export function inferMarketPosition(
  brief: BusinessBrief,
  _siteAnalysis?: SiteAnalysis,
): MarketPosition {
  const text =
    `${brief.industry} ${brief.targetAudience} ${brief.aesthetic} ${brief.companyName}`.toLowerCase();

  // Price point
  let pricePoint: MarketPosition['pricePoint'] = 'mid-range';
  if (/\b(luxury|haute|bespoke)\b/.test(text)) {
    pricePoint = 'luxury';
  } else if (/\b(premium|enterprise|exclusive)\b/.test(text)) {
    pricePoint = 'premium';
  } else if (/\b(discount|cheap|ahorro|barato|value|affordable|budget)\b/.test(text)) {
    pricePoint = 'budget';
  }

  // Reach
  let reach: MarketPosition['reach'] = 'national';
  if (/\b(neighborhood|barrio|local|community)\b/.test(text)) {
    reach = 'local';
  } else if (/\b(state|regional)\b/.test(text)) {
    reach = 'regional';
  } else if (/\b(global|international|worldwide)\b/.test(text)) {
    reach = 'global';
  } else if (/\b(national|nationwide|country-wide|pa[ií]s)\b/.test(text)) {
    reach = 'national';
  }

  // Personality
  let personality: MarketPosition['personality'] = 'modern';
  if (/\b(disruptive|revolutionary)\b/.test(text)) {
    personality = 'disruptive';
  } else if (/\b(innovative|cutting-edge|ai|tech-forward)\b/.test(text)) {
    personality = 'innovative';
  } else if (/\b(traditional|heritage|classic|established)\b/.test(text)) {
    personality = 'traditional';
  } else if (/\b(modern|contemporary)\b/.test(text)) {
    personality = 'modern';
  }

  return { pricePoint, reach, personality };
}

// ─── Business Model Inference ─────────────────────────────────────

// Signal patterns for detecting business model from site content
const PHYSICAL_RETAIL_SIGNALS = /\b(sucursal|tienda|ubicaci|locali|horario|store|location|find.?us|visit|nearest)\b/i;
const ECOMMERCE_SIGNALS = /\b(carrito|cart|checkout|comprar|buy|shop|add.?to.?cart|wishlist|order)\b/i;
const SAAS_SIGNALS = /\b(login|sign.?up|dashboard|api|pricing|plan|trial|demo|docs|documentation)\b/i;
const SERVICE_SIGNALS = /\b(contact|agendar|book|cita|appointment|schedule|consult|quote)\b/i;

/**
 * Infer what kind of business this is and what the website should (and should NOT) do.
 *
 * Uses a combination of site navigation signals, CTA text, layout patterns, and
 * industry keywords from the brief to determine the business model. This prevents
 * generating e-commerce pages for physical-only retailers, or store locators for SaaS products.
 */
export function inferBusinessModel(
  brief: BusinessBrief,
  siteAnalysis?: SiteAnalysis | null,
): BusinessModelContext {
  const hasSite = siteAnalysis != null;

  // Combine all text signals from the site
  const navText = hasSite ? siteAnalysis.navItems.join(' ') : '';
  const ctaText = hasSite ? siteAnalysis.ctaTexts.join(' ') : '';
  const allSiteText = `${navText} ${ctaText}`;

  // Step 1: Detect signals from site content
  const hasPhysicalRetailSignals = PHYSICAL_RETAIL_SIGNALS.test(allSiteText);
  const hasEcommerceSignals = ECOMMERCE_SIGNALS.test(allSiteText);
  const hasSaasSignals = SAAS_SIGNALS.test(allSiteText);
  const hasServiceSignals = SERVICE_SIGNALS.test(allSiteText);

  // Check layout patterns for additional hints
  const hasCardGridWithoutEcommerce = hasSite &&
    siteAnalysis.layoutPatterns.includes('card-grid') &&
    !hasEcommerceSignals;

  // Step 2: Detect from industry keywords in brief
  const industry = brief.industry.toLowerCase();
  const audience = brief.targetAudience.toLowerCase();
  const briefText = `${industry} ${audience}`;

  let type: BusinessModelContext['type'] = 'other';

  // Site signals take priority when available
  if (hasSite) {
    if (hasEcommerceSignals && !hasPhysicalRetailSignals) {
      type = 'e-commerce';
    } else if (hasPhysicalRetailSignals && !hasEcommerceSignals) {
      type = 'physical-retail';
    } else if (hasSaasSignals && !hasPhysicalRetailSignals && !hasEcommerceSignals) {
      type = 'saas';
    } else if (hasServiceSignals && !hasEcommerceSignals && !hasSaasSignals) {
      type = 'service';
    } else if (hasCardGridWithoutEcommerce && /\b(retail|grocery|tienda|store|supermercado|despensa|mercado)\b/.test(briefText)) {
      // Card grid without e-commerce signals + retail industry = likely physical retail catalog
      type = 'physical-retail';
    }
  }

  // Fall back to industry keywords if site didn't determine the type
  if (type === 'other') {
    if (/\b(tienda|store|retail|grocery|supermercado|despensa|discount|mercado)\b/.test(briefText)) {
      // Check if e-commerce signals contradict physical retail
      if (hasEcommerceSignals) {
        type = 'e-commerce';
      } else {
        type = 'physical-retail';
      }
    } else if (/\b(saas|software|platform|app\b|cloud)\b/.test(briefText)) {
      type = 'saas';
    } else if (/\b(marketplace|market.?place)\b/.test(briefText)) {
      type = 'marketplace';
    } else if (/\b(agency|consulting|lawyer|doctor|dentist|clinic|salon|service|freelance)\b/.test(briefText)) {
      type = 'service';
    } else if (/\b(blog|news|media|magazine|publication|journal)\b/.test(briefText)) {
      type = 'media';
    } else if (/\b(nonprofit|non-profit|ngo|charity|foundation)\b/.test(briefText)) {
      type = 'nonprofit';
    }
  }

  // Step 3: Build the full context based on detected type
  const result = buildModelContext(type, hasSite);

  // Step 4: Extract differentiators from site content
  if (hasSite) {
    const allItems = [...siteAnalysis.navItems, ...siteAnalysis.ctaTexts];
    for (const item of allItems) {
      // Look for text containing numbers (e.g., "3,300+ tiendas", "50 estados")
      if (/\d[\d,]*\+?\s*\w+/.test(item) && item.length < 80) {
        result.differentiators.push(item.trim());
      }
    }
  }

  return result;
}

/**
 * Build a complete BusinessModelContext for a given business type.
 */
function buildModelContext(
  type: BusinessModelContext['type'],
  hasSiteData: boolean,
): BusinessModelContext {
  switch (type) {
    case 'physical-retail':
      return {
        type: 'physical-retail',
        primaryRevenue: 'Physical store sales',
        websitePurpose: 'Drive foot traffic to nearest store location. Inform about deals and product availability.',
        primaryUserGoals: [
          'Find the nearest store location',
          'Check current deals and prices',
          'Browse available product categories',
          'Get store hours and contact information',
        ],
        keyFeatures: ['Store locator', 'Weekly deals/flyer', 'Product category browse', 'Store hours', 'Brand information'],
        notFeatures: ['Shopping cart', 'Online checkout', 'Add to cart buttons', 'User accounts', 'Wishlist', 'Online payment'],
        differentiators: [],
        confidence: hasSiteData ? 80 : 50,
      };

    case 'e-commerce':
      return {
        type: 'e-commerce',
        primaryRevenue: 'Online product sales',
        websitePurpose: 'Sell products directly to customers online.',
        primaryUserGoals: [
          'Browse and search products',
          'Compare prices and options',
          'Add items to cart and checkout',
          'Track orders and manage account',
        ],
        keyFeatures: ['Product catalog', 'Shopping cart', 'Checkout', 'User accounts', 'Order tracking', 'Search'],
        notFeatures: [],
        differentiators: [],
        confidence: hasSiteData ? 80 : 50,
      };

    case 'saas':
      return {
        type: 'saas',
        primaryRevenue: 'Software subscriptions',
        websitePurpose: 'Convert visitors into trial/paid users.',
        primaryUserGoals: [
          'Understand what the product does',
          'See pricing and compare plans',
          'Start a free trial or demo',
          'Access documentation',
        ],
        keyFeatures: ['Product demo/screenshots', 'Pricing tiers', 'Free trial CTA', 'Documentation', 'Customer testimonials'],
        notFeatures: ['Physical store locator', 'Inventory browsing'],
        differentiators: [],
        confidence: hasSiteData ? 80 : 50,
      };

    case 'marketplace':
      return {
        type: 'marketplace',
        primaryRevenue: 'Transaction fees or commissions',
        websitePurpose: 'Connect buyers and sellers on a shared platform.',
        primaryUserGoals: [
          'Browse listings from multiple sellers',
          'Compare options and prices',
          'Complete secure transactions',
          'Manage buyer/seller profile',
        ],
        keyFeatures: ['Search and filtering', 'Seller profiles', 'Reviews/ratings', 'Secure checkout', 'Messaging'],
        notFeatures: ['Single-brand store locator'],
        differentiators: [],
        confidence: hasSiteData ? 75 : 45,
      };

    case 'service':
      return {
        type: 'service',
        primaryRevenue: 'Service fees',
        websitePurpose: 'Generate leads and bookings.',
        primaryUserGoals: [
          'Understand available services',
          'Book an appointment or consultation',
          'Contact the business',
          'Read reviews and credentials',
        ],
        keyFeatures: ['Service catalog', 'Booking form', 'Contact information', 'Testimonials', 'Team/credentials'],
        notFeatures: ['Shopping cart', 'Product inventory'],
        differentiators: [],
        confidence: hasSiteData ? 70 : 40,
      };

    case 'media':
      return {
        type: 'media',
        primaryRevenue: 'Advertising or subscriptions',
        websitePurpose: 'Publish and distribute content to readers.',
        primaryUserGoals: [
          'Read articles and news',
          'Browse by category or topic',
          'Subscribe for updates',
          'Share content',
        ],
        keyFeatures: ['Article listings', 'Category navigation', 'Search', 'Newsletter signup', 'Social sharing'],
        notFeatures: ['Shopping cart', 'Store locator'],
        differentiators: [],
        confidence: hasSiteData ? 70 : 40,
      };

    case 'nonprofit':
      return {
        type: 'nonprofit',
        primaryRevenue: 'Donations and grants',
        websitePurpose: 'Inspire action and facilitate donations.',
        primaryUserGoals: [
          'Understand the mission',
          'Make a donation',
          'Find volunteer opportunities',
          'Learn about impact',
        ],
        keyFeatures: ['Mission statement', 'Donate button', 'Impact metrics', 'Volunteer signup', 'Event calendar'],
        notFeatures: ['Shopping cart', 'Product catalog'],
        differentiators: [],
        confidence: hasSiteData ? 70 : 40,
      };

    case 'other':
    default:
      return {
        type: 'other',
        primaryRevenue: 'Unknown',
        websitePurpose: 'Inform visitors about the organization.',
        primaryUserGoals: ['Learn about the organization', 'Find contact information'],
        keyFeatures: ['About page', 'Contact form'],
        notFeatures: [],
        differentiators: [],
        confidence: 20,
      };
  }
}

// ─── Site Analysis ─────────────────────────────────────────────────

/**
 * Detect the content tone of a page.
 */
function detectContentTone(text: string): SiteAnalysis['contentTone'] {
  const lower = text.toLowerCase();

  const formalWords = ['enterprise', 'solutions', 'leverage', 'optimize', 'facilitate', 'utilize'];
  const casualWords = ['hey', 'awesome', 'check out', 'cool', 'love', "let's"];
  const technicalWords = ['api', 'sdk', 'integration', 'deploy', 'infrastructure', 'latency'];
  const warmWords = ['family', 'together', 'community', 'home', 'welcome', 'care', 'heart'];

  const scores = {
    formal: formalWords.filter((w) => lower.includes(w)).length,
    casual: casualWords.filter((w) => lower.includes(w)).length,
    technical: technicalWords.filter((w) => lower.includes(w)).length,
    warm: warmWords.filter((w) => lower.includes(w)).length,
  };

  const max = Math.max(scores.formal, scores.casual, scores.technical, scores.warm);
  if (max === 0) return 'neutral';
  if (scores.formal === max) return 'formal';
  if (scores.casual === max) return 'casual';
  if (scores.technical === max) return 'technical';
  if (scores.warm === max) return 'warm';
  return 'neutral';
}

/**
 * Analyze a website by fetching it and extracting design signals.
 * Returns null on fetch failure (graceful degradation).
 */
export async function analyzeSite(url: string): Promise<SiteAnalysis | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'StitchForge/0.3.0' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = load(html);

    const palette = extractPalette(html);
    const typography = extractTypography(html);
    const layoutPatterns = detectLayoutPatterns(html);

    // Content tone from body text
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const contentTone = detectContentTone(bodyText);

    // Extract nav items
    const navItems: string[] = [];
    $('nav a, header a').each((_i, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 50 && !navItems.includes(text)) {
        navItems.push(text);
      }
    });

    // Extract CTA texts from buttons and prominent links
    const ctaTexts: string[] = [];
    $('button, a.btn, [role="button"], .cta, [class*="cta"], [class*="button"]').each((_i, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 50 && !ctaTexts.includes(text)) {
        ctaTexts.push(text);
      }
    });

    return {
      url,
      palette,
      typography,
      layoutPatterns,
      contentTone,
      navItems,
      ctaTexts,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── Orchestrator ──────────────────────────────────────────────────

/**
 * Perform complete business research for a brief.
 * Orchestrates site analysis, competitor analysis, audience insights,
 * market positioning, and business model inference.
 */
export async function researchBusiness(
  brief: BusinessBrief,
): Promise<BusinessResearchResult> {
  const fallbacksUsed: string[] = [];
  let confidence = 10; // baseline

  // Analyze current site
  let currentSite: SiteAnalysis | undefined;
  if (brief.websiteUrl) {
    const analysis = await analyzeSite(brief.websiteUrl);
    if (analysis) {
      currentSite = analysis;
      confidence += 30;
    } else {
      fallbacksUsed.push('current_site_unavailable');
    }
  } else {
    fallbacksUsed.push('current_site_unavailable');
  }

  // Analyze competitors
  const competitors: CompetitorAnalysis[] = [];
  if (brief.competitorUrls && brief.competitorUrls.length > 0) {
    for (const compUrl of brief.competitorUrls) {
      const analysis = await analyzeSite(compUrl);
      if (analysis) {
        // Derive a name from the URL
        let name: string;
        try {
          name = new URL(compUrl).hostname.replace('www.', '').split('.')[0];
        } catch {
          name = compUrl;
        }

        competitors.push({
          url: compUrl,
          name,
          palette: analysis.palette,
          typography: analysis.typography,
          strengths: [],
          commonPatterns: analysis.layoutPatterns,
          fetchedAt: analysis.fetchedAt,
        });
        confidence += 20;
      }
    }
    if (competitors.length === 0) {
      fallbacksUsed.push('competitors_unavailable');
    }
  } else {
    fallbacksUsed.push('competitors_unavailable');
  }

  // Audience insights (always available)
  const audienceInsights = inferAudienceInsights(
    brief.industry,
    brief.targetAudience,
    brief.locale,
  );
  confidence += 20;

  // Market position
  const marketPosition = inferMarketPosition(brief, currentSite);

  // Business model inference
  const businessModel = inferBusinessModel(brief, currentSite);

  // Cap confidence at 100
  confidence = Math.min(confidence, 100);

  return {
    brief,
    businessModel,
    currentSite,
    competitors,
    audienceInsights,
    marketPosition,
    researchedAt: new Date().toISOString(),
    confidence,
    fallbacksUsed,
  };
}
