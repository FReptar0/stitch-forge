import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', async () => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => ''),
}));

describe('design synthesizer', () => {
  beforeEach(() => { vi.resetModules(); });

  it('falls back to template when confidence is low', async () => {
    const { synthesizeDesign } = await import('../../src/research/design-synthesizer.js');
    const result = synthesizeDesign({
      brief: { companyName: 'TestCo', industry: 'tech', targetAudience: 'devs', aesthetic: 'minimal' },
      businessModel: { type: 'other', primaryRevenue: 'Unknown', websitePurpose: 'Inform visitors.', primaryUserGoals: [], keyFeatures: [], notFeatures: [], differentiators: [], confidence: 0 },
      competitors: [],
      audienceInsights: { trustSignals: [], accessibilityNeeds: [], culturalConsiderations: [], expectations: [] },
      marketPosition: { pricePoint: 'mid-range', reach: 'national', personality: 'modern' },
      researchedAt: new Date().toISOString(),
      confidence: 10,
      fallbacksUsed: ['current_site_unavailable', 'competitors_unavailable'],
    });
    expect(result.markdown).toContain('TestCo');
    expect(result.qualityScore.total).toBeLessThan(80); // fallback won't score as high
  });

  it('uses real brand colors when site analysis available', async () => {
    const { synthesizeDesign } = await import('../../src/research/design-synthesizer.js');
    const result = synthesizeDesign({
      brief: { companyName: 'RedBrand', industry: 'retail', targetAudience: 'families', aesthetic: 'warm' },
      businessModel: { type: 'e-commerce', primaryRevenue: 'Online product sales', websitePurpose: 'Sell products online.', primaryUserGoals: ['Browse products'], keyFeatures: ['Product catalog'], notFeatures: [], differentiators: [], confidence: 60 },
      currentSite: {
        url: 'https://redbrand.com',
        palette: { colors: [{ hex: '#DC0C0C', frequency: 15, context: 'background' }, { hex: '#F5B800', frequency: 8, context: 'accent' }], dominantHex: '#DC0C0C', accentHex: '#F5B800' },
        typography: { fonts: ['DM Sans', 'Outfit'], headingFont: 'Outfit', bodyFont: 'DM Sans' },
        layoutPatterns: ['hero-banner', 'card-grid'],
        contentTone: 'warm',
        navItems: ['Home', 'Products', 'About'],
        fetchedAt: new Date().toISOString(),
      },
      competitors: [],
      audienceInsights: { trustSignals: ['Visible pricing'], accessibilityNeeds: ['High contrast'], culturalConsiderations: [], expectations: ['Browse products'] },
      marketPosition: { pricePoint: 'budget', reach: 'national', personality: 'modern' },
      researchedAt: new Date().toISOString(),
      confidence: 60,
      fallbacksUsed: ['competitors_unavailable'],
    });
    expect(result.markdown).toContain('#DC0C0C');
    expect(result.markdown).toContain('Outfit');
  });

  it('differentiates typography from competitors', async () => {
    const { synthesizeTypography } = await import('../../src/research/design-synthesizer.js');
    const result = synthesizeTypography({
      brief: { companyName: 'Test', industry: 'retail', targetAudience: 'all', aesthetic: 'warm' },
      businessModel: { type: 'other', primaryRevenue: 'Unknown', websitePurpose: 'Inform visitors.', primaryUserGoals: [], keyFeatures: [], notFeatures: [], differentiators: [], confidence: 0 },
      competitors: [{
        url: 'https://comp.com', name: 'Competitor',
        palette: { colors: [], dominantHex: '#000', },
        typography: { fonts: ['Outfit', 'Inter'], headingFont: 'Outfit', bodyFont: 'Inter' },
        strengths: [], commonPatterns: [], fetchedAt: new Date().toISOString(),
      }],
      audienceInsights: { trustSignals: [], accessibilityNeeds: [], culturalConsiderations: [], expectations: [] },
      marketPosition: { pricePoint: 'mid-range', reach: 'national', personality: 'modern' },
      researchedAt: new Date().toISOString(),
      confidence: 50,
      fallbacksUsed: [],
    });
    expect(result.heading).not.toBe('Outfit'); // should avoid competitor's font
    expect(result.heading).not.toBe('Inter');
  });

  it('keeps output under 3000 tokens', async () => {
    const { synthesizeDesign } = await import('../../src/research/design-synthesizer.js');
    const result = synthesizeDesign({
      brief: { companyName: 'Test', industry: 'retail', targetAudience: 'all', aesthetic: 'warm' },
      businessModel: { type: 'physical-retail', primaryRevenue: 'Store sales', websitePurpose: 'Drive foot traffic.', primaryUserGoals: ['Find store'], keyFeatures: ['Store locator'], notFeatures: ['Shopping cart'], differentiators: [], confidence: 50 },
      currentSite: {
        url: 'https://test.com',
        palette: { colors: [{ hex: '#AA0000', frequency: 10, context: 'background' }], dominantHex: '#AA0000' },
        typography: { fonts: ['Sora'], headingFont: 'Sora' },
        layoutPatterns: ['hero-banner'], contentTone: 'warm', navItems: ['Home'], fetchedAt: new Date().toISOString(),
      },
      competitors: [],
      audienceInsights: { trustSignals: ['Price visibility'], accessibilityNeeds: [], culturalConsiderations: [], expectations: [] },
      marketPosition: { pricePoint: 'budget', reach: 'local', personality: 'modern' },
      researchedAt: new Date().toISOString(),
      confidence: 50,
      fallbacksUsed: [],
    });
    expect(result.tokenEstimate).toBeLessThanOrEqual(3000);
  });

  it('includes business context in Section 1 for physical retail', async () => {
    const { synthesizeDesign } = await import('../../src/research/design-synthesizer.js');
    const result = synthesizeDesign({
      brief: { companyName: 'Tiendas 3B', industry: 'hard-discount retail', targetAudience: 'Mexican families', aesthetic: 'warm' },
      businessModel: {
        type: 'physical-retail',
        primaryRevenue: 'Physical store sales',
        websitePurpose: 'Drive foot traffic to nearest store.',
        primaryUserGoals: ['Find nearest store', 'See weekly deals'],
        keyFeatures: ['Store locator', 'Weekly deals'],
        notFeatures: ['Shopping cart', 'Online checkout'],
        differentiators: ['3,300+ stores'],
        confidence: 80,
      },
      competitors: [],
      audienceInsights: { trustSignals: [], accessibilityNeeds: [], culturalConsiderations: [], expectations: [] },
      marketPosition: { pricePoint: 'budget', reach: 'national', personality: 'modern' },
      researchedAt: new Date().toISOString(),
      confidence: 60,
      fallbacksUsed: [],
    });

    expect(result.markdown).toContain('physical retail');
    expect(result.markdown).toContain('foot traffic');
    expect(result.markdown).toContain('Shopping cart');
    expect(result.markdown.toLowerCase()).toContain('store locator');
    // Should contain physical-retail Do's/Don'ts
    expect(result.markdown).toContain('not an e-commerce site');
  });

  it('includes e-commerce context for online stores', async () => {
    const { synthesizeDesign } = await import('../../src/research/design-synthesizer.js');
    const result = synthesizeDesign({
      brief: { companyName: 'ShopMX', industry: 'online retail', targetAudience: 'shoppers', aesthetic: 'modern' },
      businessModel: {
        type: 'e-commerce',
        primaryRevenue: 'Online product sales',
        websitePurpose: 'Sell products directly online.',
        primaryUserGoals: ['Browse products', 'Add to cart', 'Checkout'],
        keyFeatures: ['Product catalog', 'Shopping cart', 'Checkout'],
        notFeatures: [],
        differentiators: [],
        confidence: 70,
      },
      competitors: [],
      audienceInsights: { trustSignals: [], accessibilityNeeds: [], culturalConsiderations: [], expectations: [] },
      marketPosition: { pricePoint: 'mid-range', reach: 'national', personality: 'modern' },
      researchedAt: new Date().toISOString(),
      confidence: 50,
      fallbacksUsed: [],
    });

    expect(result.markdown).toContain('e commerce');
    expect(result.markdown.toLowerCase()).toContain('shopping cart');
    expect(result.markdown).not.toContain('NOT an e-commerce');
  });

  it('adds saas-specific dos and donts', async () => {
    const { synthesizeDosAndDonts } = await import('../../src/research/design-synthesizer.js');
    const result = synthesizeDosAndDonts({
      brief: { companyName: 'SaaSCo', industry: 'saas', targetAudience: 'developers', aesthetic: 'minimal' },
      businessModel: {
        type: 'saas',
        primaryRevenue: 'Subscription revenue',
        websitePurpose: 'Convert visitors to trial signups.',
        primaryUserGoals: ['Try the product', 'Compare pricing'],
        keyFeatures: ['Product demo', 'Pricing page'],
        notFeatures: [],
        differentiators: [],
        confidence: 80,
      },
      competitors: [],
      audienceInsights: { trustSignals: [], accessibilityNeeds: [], culturalConsiderations: [], expectations: [] },
      marketPosition: { pricePoint: 'mid-range', reach: 'global', personality: 'innovative' },
      researchedAt: new Date().toISOString(),
      confidence: 60,
      fallbacksUsed: [],
    });

    expect(result.dos.some(d => d.includes('pricing'))).toBe(true);
    expect(result.dos.some(d => d.includes('free trial') || d.includes('demo'))).toBe(true);
  });
});

describe('design validator', () => {
  beforeEach(() => { vi.resetModules(); });

  it('scores high for specific, complete DESIGN.md', async () => {
    const { scoreDesignMd } = await import('../../src/utils/design-validator.js');
    const md = `# TestCo — Design System
## 1. Visual Theme & Atmosphere
Bold industrial aesthetic for TestCo, a SaaS platform. Targeting developers who value speed.
## 2. Color Palette & Roles
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Deep Navy | #1B2A4A | CTAs |
| Secondary | Copper | #C17F59 | Accents |
| Surface | White | #FAFAF8 | Background |
| On-Surface | Charcoal | #2D2D2D | Text |
| Error | Red | #DC2626 | Errors |
| Muted | Gray | #E8E6E1 | Disabled |
## 3. Typography
- **Heading**: "Space Grotesk", sans-serif
- **Body**: "Libre Franklin", sans-serif
- **Mono**: "JetBrains Mono", monospace
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2.75rem | 700 | 1.15 |
| Body | 1rem | 400 | 1.6 |
## 4. Spacing & Layout
- **Base unit**: 4px
- **Scale**: 4, 8, 16, 24, 32, 48, 64
- **Max content width**: 1200px
## 5. Component Patterns
### Buttons
- Primary: filled #1B2A4A, white text, 6px radius
### Cards
- White surface, 1px #E5E5E5 border, 8px radius
### Inputs
- 1px border, 8px radius, 12px padding
## 6. Iconography
Lucide icons, 24px default, 2px stroke
## 7. Imagery Guidelines
Industrial photography targeting developers. 16:9 hero images with code editors.
## 8. Do's and Don'ts
### Do
- Use consistent 4px spacing scale
- Maintain 4.5:1 contrast ratio
- Show API documentation prominently
### Don't
- Don't use Inter or Poppins as primary font
- Don't use purple-to-blue gradients
- Don't use generic stock photography`;
    const score = scoreDesignMd(md);
    expect(score.total).toBeGreaterThanOrEqual(70);
    expect(score.completeness).toBeGreaterThanOrEqual(20);
  });

  it('scores low for placeholder-heavy DESIGN.md', async () => {
    const { scoreDesignMd } = await import('../../src/utils/design-validator.js');
    const md = `# Test
## 1. Visual Theme & Atmosphere
<!-- TODO -->
## 2. Color Palette & Roles
| Role | Hex |
## 3. Typography
<!-- fill in -->
## 4. Spacing & Layout
## 5. Component Patterns
## 6. Iconography
<!-- choose icons -->
## 7. Imagery Guidelines
<!-- describe imagery -->
## 8. Do's and Don'ts
### Do
- Be good
### Don't
- Be bad`;
    const score = scoreDesignMd(md);
    expect(score.total).toBeLessThan(50);
    expect(score.specificity).toBeLessThan(15);
  });

  it('detects competitor color similarity', async () => {
    const { scoreDifferentiation } = await import('../../src/utils/design-validator.js');
    const md = '| Primary | Red | #DC0C0C | CTAs |';
    const competitors = [{
      url: '', name: 'Comp',
      palette: { colors: [{ hex: '#DC0C0C', frequency: 10, context: 'background' as const }], dominantHex: '#DC0C0C' },
      typography: { fonts: [] },
      strengths: [], commonPatterns: [], fetchedAt: '',
    }];
    const score = scoreDifferentiation(md, competitors);
    expect(score).toBeLessThan(20); // penalized for matching competitor
  });

  it('formats report correctly', async () => {
    const { formatDesignQualityReport } = await import('../../src/utils/design-validator.js');
    const report = formatDesignQualityReport({
      specificity: 20, differentiation: 15, completeness: 25, actionability: 22,
      total: 82, issues: [{ section: 'Typography', severity: 'warning', message: 'Contains vague language' }],
    });
    expect(report).toContain('82/100');
    expect(report).toContain('Specificity');
    expect(report).toContain('Typography');
  });
});
