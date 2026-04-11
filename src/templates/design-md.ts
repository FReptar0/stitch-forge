export interface DesignBrief {
  companyName: string;
  industry: string;
  targetAudience: string;
  aesthetic: string; // e.g. "minimal luxury", "vibrant tech", "organic warm"
  primaryColor?: string; // hex
  secondaryColor?: string; // hex
}

// ─── Industry color psychology ──────────────────────────────────────
// Each industry has its own color logic independent of aesthetic
export interface IndustryPalette {
  primary: { name: string; hex: string };
  secondary: { name: string; hex: string };
  accent?: { name: string; hex: string };
}

export const INDUSTRY_PALETTES: Record<string, IndustryPalette> = {
  retail: { primary: { name: 'Retail Red', hex: '#DC0C0C' }, secondary: { name: 'Value Gold', hex: '#F5B800' } },
  grocery: { primary: { name: 'Fresh Green', hex: '#2D8F4E' }, secondary: { name: 'Harvest Orange', hex: '#E87B35' } },
  discount: { primary: { name: 'Bold Red', hex: '#CC1100' }, secondary: { name: 'Savings Yellow', hex: '#FFBF00' } },
  fintech: { primary: { name: 'Trust Navy', hex: '#0F2B5B' }, secondary: { name: 'Signal Blue', hex: '#2563EB' } },
  saas: { primary: { name: 'Product Blue', hex: '#1E40AF' }, secondary: { name: 'Action Indigo', hex: '#6366F1' } },
  healthcare: { primary: { name: 'Medical Teal', hex: '#0D7377' }, secondary: { name: 'Care Blue', hex: '#38BDF8' } },
  wellness: { primary: { name: 'Sage', hex: '#6B8F5E' }, secondary: { name: 'Terracotta', hex: '#C4704B' } },
  education: { primary: { name: 'Academic Blue', hex: '#1E3A8A' }, secondary: { name: 'Knowledge Amber', hex: '#D97706' } },
  food: { primary: { name: 'Appetite Red', hex: '#B91C1C' }, secondary: { name: 'Warm Spice', hex: '#D97706' }, accent: { name: 'Fresh Herb', hex: '#16A34A' } },
  fashion: { primary: { name: 'Noir', hex: '#1A1A1A' }, secondary: { name: 'Rose Gold', hex: '#C4917B' } },
  technology: { primary: { name: 'Deep Slate', hex: '#1E293B' }, secondary: { name: 'Electric Cyan', hex: '#06B6D4' } },
  realestate: { primary: { name: 'Estate Green', hex: '#1B4332' }, secondary: { name: 'Copper', hex: '#B87333' } },
  legal: { primary: { name: 'Barrister Navy', hex: '#1E2D4F' }, secondary: { name: 'Parchment Gold', hex: '#B8860B' } },
  nonprofit: { primary: { name: 'Purpose Teal', hex: '#0F766E' }, secondary: { name: 'Heart Coral', hex: '#F97066' } },
};

export function matchIndustry(industry: string): IndustryPalette {
  const lower = industry.toLowerCase();
  for (const [key, palette] of Object.entries(INDUSTRY_PALETTES)) {
    if (lower.includes(key)) return palette;
  }
  // Fuzzy matches
  if (/tienda|store|shop|mercado|supermarket|supermercado|despensa/.test(lower)) return INDUSTRY_PALETTES.retail;
  if (/descuento|discount|hard.?discount|barato|ahorro|budget/.test(lower)) return INDUSTRY_PALETTES.discount;
  if (/banco|bank|pago|payment|dinero|money|crypto|finanza/.test(lower)) return INDUSTRY_PALETTES.fintech;
  if (/salud|health|medic|clinic|hospital|doctor|pharma/.test(lower)) return INDUSTRY_PALETTES.healthcare;
  if (/comida|restauran|café|coffee|bakery|panader/.test(lower)) return INDUSTRY_PALETTES.food;
  if (/escuela|school|university|academia|curso|learn|educa/.test(lower)) return INDUSTRY_PALETTES.education;
  if (/ropa|cloth|moda|apparel|boutique|luxury/.test(lower)) return INDUSTRY_PALETTES.fashion;
  if (/software|app|plataforma|platform|tech|digital|ai|cloud/.test(lower)) return INDUSTRY_PALETTES.technology;
  if (/inmobili|property|real.?estate|bienes.?raices/.test(lower)) return INDUSTRY_PALETTES.realestate;
  if (/yoga|spa|bienestar|organic|natural/.test(lower)) return INDUSTRY_PALETTES.wellness;
  if (/ong|fundaci|caridad|charity|social.?impact/.test(lower)) return INDUSTRY_PALETTES.nonprofit;
  if (/abogad|lawyer|legal|notari|juridi/.test(lower)) return INDUSTRY_PALETTES.legal;
  return INDUSTRY_PALETTES.saas; // default for unrecognized
}

// ─── Aesthetic modifiers ────────────────────────────────────────────
// Aesthetic controls the surface tones, typography, and component styling
export interface AestheticModifier {
  surface: { name: string; hex: string };
  onSurface: { name: string; hex: string };
  muted: { name: string; hex: string };
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  iconStyle: string;
  borderRadius: string;
  shadowStyle: string;
}

export const AESTHETIC_MODIFIERS: Record<string, AestheticModifier> = {
  bold: {
    surface: { name: 'Soft White', hex: '#FAFAF8' },
    onSurface: { name: 'Charcoal', hex: '#2D2D2D' },
    muted: { name: 'Warm Gray', hex: '#E8E6E1' },
    headingFont: '"Space Grotesk", sans-serif',
    bodyFont: '"Libre Franklin", sans-serif',
    monoFont: '"JetBrains Mono", monospace',
    iconStyle: 'Lucide icons, 24px default, 2px stroke, solid style',
    borderRadius: '6px buttons, 8px cards, 4px badges',
    shadowStyle: 'Hard shadow: 4px 4px 0px On-Surface for emphasis, subtle elevation elsewhere',
  },
  elegant: {
    surface: { name: 'Pearl', hex: '#F8F6F0' },
    onSurface: { name: 'Deep Charcoal', hex: '#2B2B2B' },
    muted: { name: 'Oyster', hex: '#E5E0D8' },
    headingFont: '"DM Serif Display", serif',
    bodyFont: '"Source Sans 3", sans-serif',
    monoFont: '"IBM Plex Mono", monospace',
    iconStyle: 'Lucide icons, 20px default, 1.5px stroke, outline style',
    borderRadius: '4px buttons, 8px cards, 2px badges',
    shadowStyle: 'Subtle: 0 1px 3px rgba(0,0,0,0.08), larger on hover',
  },
  warm: {
    surface: { name: 'Cream', hex: '#FDF8F0' },
    onSurface: { name: 'Espresso', hex: '#3B2F2F' },
    muted: { name: 'Sand', hex: '#EDE5D8' },
    headingFont: '"Outfit", sans-serif',
    bodyFont: '"Instrument Sans", sans-serif',
    monoFont: '"JetBrains Mono", monospace',
    iconStyle: 'Phosphor icons, 24px default, regular weight, duotone style',
    borderRadius: '8px buttons, 12px cards, 20px badges',
    shadowStyle: 'Warm: 0 4px 12px rgba(59,47,47,0.06)',
  },
  playful: {
    surface: { name: 'Snow', hex: '#FAFBFC' },
    onSurface: { name: 'Ink', hex: '#1E1E2E' },
    muted: { name: 'Lavender Mist', hex: '#EDE9FE' },
    headingFont: '"Sora", sans-serif',
    bodyFont: '"Nunito Sans", sans-serif',
    monoFont: '"Fira Code", monospace',
    iconStyle: 'Phosphor icons, 24px default, bold weight, filled style',
    borderRadius: '12px buttons, 16px cards, 100px badges (pill)',
    shadowStyle: 'Colorful: 0 4px 14px rgba(124,58,237,0.10)',
  },
  minimal: {
    surface: { name: 'White', hex: '#FFFFFF' },
    onSurface: { name: 'Slate', hex: '#334155' },
    muted: { name: 'Cool Gray', hex: '#F1F5F9' },
    headingFont: '"Instrument Serif", serif',
    bodyFont: '"Geist", sans-serif',
    monoFont: '"Geist Mono", monospace',
    iconStyle: 'Lucide icons, 20px default, 1.5px stroke, outline style',
    borderRadius: '4px buttons, 6px cards, 2px badges',
    shadowStyle: 'None by default, 0 1px 2px rgba(0,0,0,0.05) on hover',
  },
  confident: {
    surface: { name: 'Clean White', hex: '#FFFFFF' },
    onSurface: { name: 'Dark Graphite', hex: '#333333' },
    muted: { name: 'Soft Gray', hex: '#F4F4F5' },
    headingFont: '"DM Sans", sans-serif',
    bodyFont: '"Nunito Sans", sans-serif',
    monoFont: '"JetBrains Mono", monospace',
    iconStyle: 'Heroicons outline, 20px default, 1.5px stroke',
    borderRadius: '6px buttons, 8px cards, 4px badges',
    shadowStyle: '0 2px 8px rgba(0,0,0,0.06), lift on hover',
  },
};

export function matchAesthetic(aesthetic: string): AestheticModifier {
  const lower = aesthetic.toLowerCase();
  if (/bold|industrial|strong|powerful|edgy|striking/.test(lower)) return AESTHETIC_MODIFIERS.bold;
  if (/elegant|premium|luxury|corporate|formal|sophisticated/.test(lower)) return AESTHETIC_MODIFIERS.elegant;
  if (/warm|organic|natural|earthy|cozy|friendly|welcoming/.test(lower)) return AESTHETIC_MODIFIERS.warm;
  if (/playful|vibrant|fun|creative|colorful|energetic|bright/.test(lower)) return AESTHETIC_MODIFIERS.playful;
  if (/minimal|clean|simple|understated|quiet|sparse/.test(lower)) return AESTHETIC_MODIFIERS.minimal;
  if (/confident|modern|trustworthy|reliable|accessible|smart/.test(lower)) return AESTHETIC_MODIFIERS.confident;
  return AESTHETIC_MODIFIERS.confident;
}

// ─── Audience-aware imagery ─────────────────────────────────────────

export function generateImageryGuidelines(industry: string, audience: string): string {
  const lower = `${industry} ${audience}`.toLowerCase();

  if (/famili|familia|hogar|casa|home|parent|madre|padre/.test(lower))
    return 'Warm lifestyle photography of real families — shopping, cooking, sharing meals together. Natural indoor lighting, authentic (not staged). Product photography on clean backgrounds. Hero images: wide 16:9 with people, not just products.';
  if (/developer|engineer|cto|technical|programm/.test(lower))
    return 'Clean product screenshots, code editor views, terminal interfaces. Technical diagrams with brand colors. Abstract geometric patterns for backgrounds. Developer-friendly, no corporate stock photos.';
  if (/executive|cfo|ceo|director|manager|enterprise/.test(lower))
    return 'Professional editorial photography, conference rooms, skyline views. Data visualization graphics. Polished headshots. Muted tones, sharp focus, 16:9 hero, 3:4 portraits.';
  if (/joven|young|student|millennial|gen.?z|teen|creativ/.test(lower))
    return 'Dynamic, candid photography with saturated colors. User-generated content style. Bold compositions, unusual angles. 1:1 for social, 16:9 for hero, 9:16 for mobile stories.';
  if (/salud|health|patient|wellness|bienestar/.test(lower))
    return 'Calming photography with natural light and soft focus. Real people in wellness settings. Green and white dominant imagery. Avoid clinical/sterile aesthetics.';
  if (/investor|financ|dinero|ahorro|saving/.test(lower))
    return 'Clean data visualizations, growth charts, abstract financial patterns. Professional but approachable. Avoid cliché money/coin imagery.';

  return 'Professional photography that reflects the target audience authentically. 16:9 hero images, 4:3 feature images, 1:1 team/product shots. Natural lighting preferred. Avoid generic stock photography.';
}

// ─── Industry-specific Do's and Don'ts ──────────────────────────────

export function generateDosAndDonts(industry: string, audience: string): { dos: string[]; donts: string[] } {
  const baseDos = [
    'Use consistent spacing from the scale',
    'Maintain high contrast (4.5:1 minimum) for text readability',
    'Use Primary color sparingly — reserve for CTAs and key emphasis',
    'Use asymmetric or non-standard layouts for at least one section',
    'Vary card sizes and spacing to create visual rhythm',
    'Vary section backgrounds (alternate between Surface and Muted)',
  ];

  const baseDonts = [
    "Don't use Inter, Poppins, or system sans-serif as the primary font",
    "Don't use purple-to-blue gradients anywhere",
    "Don't use uniform border-radius (>12px) on all elements",
    "Don't use standard three-column icon grids as the second page section",
    "Don't use generic stock illustrations (3D blobs, abstract shapes)",
    "Don't center-align body text longer than 2 lines",
  ];

  const lower = `${industry} ${audience}`.toLowerCase();
  const extraDos: string[] = [];
  const extraDonts: string[] = [];

  // Retail / discount specific
  if (/retail|tienda|store|shop|discount|descuento|supermercado|grocery|despensa/.test(lower)) {
    extraDos.push('Show prices prominently in every product display');
    extraDos.push('Use real product photography, never illustrations for products');
    extraDos.push('Show concrete savings amounts (pesos, not percentages)');
    extraDonts.push("Don't make it look cheap — maintain a confident, trustworthy tone throughout");
    extraDonts.push("Don't use dark backgrounds for main content areas");
    extraDonts.push("Don't hide pricing behind clicks — visibility builds trust");
  }

  // Fintech / financial
  if (/fintech|bank|financ|payment|pago|crypto/.test(lower)) {
    extraDos.push('Use data visualizations and charts to show growth/savings');
    extraDos.push('Include security trust signals (badges, certifications)');
    extraDonts.push("Don't use playful or casual language for financial data");
    extraDonts.push("Don't use red for positive financial metrics (red = loss in finance)");
  }

  // SaaS / technology (exclude retail/grocery matches)
  if (/saas|software|platform|app\b|cloud|ai\b/.test(lower) && !/retail|tienda|store|grocery|supermercado/.test(lower)) {
    extraDos.push('Include code examples or API references where relevant');
    extraDos.push('Show product screenshots with realistic data, not lorem ipsum');
    extraDonts.push("Don't use marketing jargon without substance ('revolutionize', 'seamless')");
    extraDonts.push("Don't show empty-state UIs in marketing screenshots");
  }

  // Mexican / Latin American market
  if (/mexican|mexico|méxico|latin|familia|barrio/.test(lower)) {
    extraDos.push('Use Spanish-language copy that feels natural, not translated');
    extraDos.push('Reflect local culture authentically — avoid stereotypes');
    extraDonts.push("Don't use American/European stock photography for Mexican audiences");
    extraDonts.push("Don't use English text in customer-facing UI elements");
  }

  // Healthcare / wellness
  if (/health|salud|wellness|bienestar|medic|clinic/.test(lower)) {
    extraDos.push('Use calming color tones and generous whitespace');
    extraDos.push('Ensure WCAG AAA compliance for critical health information');
    extraDonts.push("Don't use aggressive CTAs or urgency tactics for health content");
  }

  // Education
  if (/educa|school|escuela|university|learn|curso|academy/.test(lower)) {
    extraDos.push('Use clear visual hierarchy for learning paths and course structure');
    extraDos.push('Include progress indicators and achievement elements');
    extraDonts.push("Don't make navigation complex — students need clear paths");
  }

  return {
    dos: [...baseDos, ...extraDos],
    donts: [...baseDonts, ...extraDonts],
  };
}

// ─── Visual theme description ───────────────────────────────────────

function generateThemeDescription(brief: DesignBrief): string {
  const { companyName, industry, targetAudience, aesthetic } = brief;
  const toneWord = aesthetic.split(/\s+/)[0];
  return `${aesthetic} design language for ${companyName}, a ${industry} brand. Every screen should feel intentionally crafted for ${targetAudience} — not generic, not templated. The visual identity balances a ${toneWord} tone with the practical needs of ${targetAudience}, creating an experience that feels both professional and human.`;
}

// ─── Main generator ─────────────────────────────────────────────────

export function generateDesignMdTemplate(brief: DesignBrief): string {
  const industryPalette = matchIndustry(brief.industry);
  const aesthetic = matchAesthetic(brief.aesthetic);
  const imagery = generateImageryGuidelines(brief.industry, brief.targetAudience);
  const { dos, donts } = generateDosAndDonts(brief.industry, brief.targetAudience);
  const themeDesc = generateThemeDescription(brief);

  const primary = brief.primaryColor || industryPalette.primary.hex;
  const primaryName = brief.primaryColor ? 'Brand Primary' : industryPalette.primary.name;
  const secondary = brief.secondaryColor || industryPalette.secondary.hex;
  const secondaryName = brief.secondaryColor ? 'Brand Secondary' : industryPalette.secondary.name;

  const accentRow = industryPalette.accent
    ? `| Accent | ${industryPalette.accent.name} | ${industryPalette.accent.hex} | Tertiary highlights, category markers |\n`
    : '';

  return `# ${brief.companyName} — Design System

## 1. Visual Theme & Atmosphere

${themeDesc}

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | ${primaryName} | ${primary} | Main brand color, CTAs, key UI elements |
| Secondary | ${secondaryName} | ${secondary} | Supporting elements, hover states, accents |
${accentRow}| Surface | ${aesthetic.surface.name} | ${aesthetic.surface.hex} | Background, cards |
| On-Surface | ${aesthetic.onSurface.name} | ${aesthetic.onSurface.hex} | Body text on surface |
| Error | Signal Red | #DC2626 | Error states, destructive actions |
| Success | Verified Green | #16A34A | Success states, confirmations |
| Muted | ${aesthetic.muted.name} | ${aesthetic.muted.hex} | Disabled states, section alternates |
| Border | Light Border | #E5E5E5 | Card borders, dividers, input outlines |

## 3. Typography

- **Heading**: ${aesthetic.headingFont}
- **Body**: ${aesthetic.bodyFont}
- **Mono**: ${aesthetic.monoFont}

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
- Primary: filled with Primary color, white text, ${aesthetic.borderRadius.split(',')[0]}, 14px 28px padding
- Secondary: outline with Primary border, Primary text
- Ghost: no background, Primary text, hover shows Muted background

### Cards
- Surface background, 1px Border color, ${aesthetic.borderRadius.split(',')[1]?.trim() || '8px'}, 20px padding
- Shadow: ${aesthetic.shadowStyle}
- Hover: slight elevation increase

### Inputs
- 1px Border color, ${aesthetic.borderRadius.split(',')[0]}, 12px 16px padding
- Focus: Primary border, subtle Primary ring
- Error: Error border, Error text below

## 6. Iconography

${aesthetic.iconStyle}

## 7. Imagery Guidelines

${imagery}

## 8. Do's and Don'ts

### Do
${dos.map(d => `- ${d}`).join('\n')}

### Don't
${donts.map(d => `- ${d}`).join('\n')}
`;
}
