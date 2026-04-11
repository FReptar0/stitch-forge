import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('business researcher', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  describe('extractPalette', () => {
    it('extracts colors from style blocks', async () => {
      const { extractPalette } = await import('../../src/research/business-researcher.js');
      const html = '<html><head><style>body { background-color: #DC0C0C; color: #333333; } .btn { background: #F5B800; } a { color: #DC0C0C; }</style></head><body></body></html>';
      const result = extractPalette(html);
      expect(result.colors.length).toBeGreaterThanOrEqual(3);
      expect(result.dominantHex).toBeTruthy();
      expect(result.colors.some(c => c.hex === '#DC0C0C')).toBe(true);
    });

    it('extracts colors from inline styles', async () => {
      const { extractPalette } = await import('../../src/research/business-researcher.js');
      const html = '<html><body><div style="background-color: #1B2A4A;"><p style="color: #FAFAF8;">Text</p></div></body></html>';
      const result = extractPalette(html);
      expect(result.colors.some(c => c.hex === '#1B2A4A')).toBe(true);
    });

    it('extracts CSS custom properties', async () => {
      const { extractPalette } = await import('../../src/research/business-researcher.js');
      const html = '<html><head><style>:root { --primary: #DC0C0C; --accent: #F5B800; }</style></head><body></body></html>';
      const result = extractPalette(html);
      expect(result.colors.some(c => c.hex === '#DC0C0C')).toBe(true);
      expect(result.colors.some(c => c.hex === '#F5B800')).toBe(true);
    });

    it('returns empty palette for colorless HTML', async () => {
      const { extractPalette } = await import('../../src/research/business-researcher.js');
      const result = extractPalette('<html><body>Plain text</body></html>');
      expect(result.colors).toHaveLength(0);
      expect(result.dominantHex).toBe('');
    });

    it('classifies color contexts correctly', async () => {
      const { extractPalette } = await import('../../src/research/business-researcher.js');
      const html = '<html><head><style>div { background-color: #111111; color: #222222; border-color: #333333; }</style></head><body></body></html>';
      const result = extractPalette(html);
      const bg = result.colors.find(c => c.hex === '#111111');
      const text = result.colors.find(c => c.hex === '#222222');
      const border = result.colors.find(c => c.hex === '#333333');
      expect(bg?.context).toBe('background');
      expect(text?.context).toBe('text');
      expect(border?.context).toBe('border');
    });

    it('sorts colors by frequency', async () => {
      const { extractPalette } = await import('../../src/research/business-researcher.js');
      const html = '<html><head><style>a { color: #AAAAAA; } b { color: #AAAAAA; } c { color: #AAAAAA; } p { color: #BBBBBB; }</style></head><body></body></html>';
      const result = extractPalette(html);
      expect(result.colors[0].hex).toBe('#AAAAAA');
      expect(result.colors[0].frequency).toBe(3);
    });

    it('normalizes 3-digit hex to 6-digit', async () => {
      const { extractPalette } = await import('../../src/research/business-researcher.js');
      const html = '<html><head><style>body { color: #abc; }</style></head><body></body></html>';
      const result = extractPalette(html);
      expect(result.colors.some(c => c.hex === '#AABBCC')).toBe(true);
    });
  });

  describe('extractTypography', () => {
    it('detects Google Fonts from link tags', async () => {
      const { extractTypography } = await import('../../src/research/business-researcher.js');
      const html = '<html><head><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=DM+Sans&display=swap" rel="stylesheet"/></head><body></body></html>';
      const result = extractTypography(html);
      expect(result.fonts).toContain('Space Grotesk');
      expect(result.fonts).toContain('DM Sans');
    });

    it('detects fonts from CSS font-family', async () => {
      const { extractTypography } = await import('../../src/research/business-researcher.js');
      const html = '<html><head><style>h1 { font-family: "Outfit", sans-serif; } body { font-family: "Libre Franklin", sans-serif; }</style></head><body></body></html>';
      const result = extractTypography(html);
      expect(result.fonts).toContain('Outfit');
      expect(result.headingFont).toBe('Outfit');
      expect(result.bodyFont).toBe('Libre Franklin');
    });

    it('filters out generic font families', async () => {
      const { extractTypography } = await import('../../src/research/business-researcher.js');
      const html = '<html><head><style>body { font-family: sans-serif; }</style></head><body></body></html>';
      const result = extractTypography(html);
      expect(result.fonts).not.toContain('sans-serif');
    });

    it('returns empty list for no fonts', async () => {
      const { extractTypography } = await import('../../src/research/business-researcher.js');
      const result = extractTypography('<html><body>Plain text</body></html>');
      expect(result.fonts).toHaveLength(0);
      expect(result.headingFont).toBeUndefined();
      expect(result.bodyFont).toBeUndefined();
    });
  });

  describe('detectLayoutPatterns', () => {
    it('detects hero banner', async () => {
      const { detectLayoutPatterns } = await import('../../src/research/business-researcher.js');
      const html = '<html><body><section style="background-image: url(hero.jpg)"><h1>Welcome</h1><p>Subtitle</p></section></body></html>';
      const patterns = detectLayoutPatterns(html);
      expect(patterns).toContain('hero-banner');
    });

    it('detects sticky nav', async () => {
      const { detectLayoutPatterns } = await import('../../src/research/business-researcher.js');
      const html = '<html><body><nav style="position: sticky; top: 0;"><a>Home</a></nav><section><h1>Content</h1></section></body></html>';
      const patterns = detectLayoutPatterns(html);
      expect(patterns).toContain('sticky-nav');
    });

    it('detects card grid', async () => {
      const { detectLayoutPatterns } = await import('../../src/research/business-researcher.js');
      const html = '<html><body><div class="grid"><div class="card"><img src="a.jpg"><p>A</p></div><div class="card"><img src="b.jpg"><p>B</p></div><div class="card"><img src="c.jpg"><p>C</p></div></div></body></html>';
      const patterns = detectLayoutPatterns(html);
      expect(patterns.some(p => p.includes('grid') || p.includes('card'))).toBe(true);
    });

    it('detects three-column grid', async () => {
      const { detectLayoutPatterns } = await import('../../src/research/business-researcher.js');
      const html = '<html><body><div class="grid"><div>One</div><div>Two</div><div>Three</div></div></body></html>';
      const patterns = detectLayoutPatterns(html);
      expect(patterns).toContain('three-column-grid');
    });

    it('returns empty for plain HTML', async () => {
      const { detectLayoutPatterns } = await import('../../src/research/business-researcher.js');
      const html = '<html><body><p>Just a paragraph.</p></body></html>';
      const patterns = detectLayoutPatterns(html);
      expect(patterns).toHaveLength(0);
    });
  });

  describe('inferAudienceInsights', () => {
    it('returns retail insights for grocery industry', async () => {
      const { inferAudienceInsights } = await import('../../src/research/business-researcher.js');
      const insights = inferAudienceInsights('hard-discount retail grocery', 'Mexican families', 'es-MX');
      expect(insights.trustSignals.length).toBeGreaterThan(0);
      expect(insights.expectations.length).toBeGreaterThan(0);
      expect(insights.culturalConsiderations.some(c => c.toLowerCase().includes('spanish') || c.toLowerCase().includes('mexican'))).toBe(true);
    });

    it('returns fintech insights for payments platform', async () => {
      const { inferAudienceInsights } = await import('../../src/research/business-researcher.js');
      const insights = inferAudienceInsights('fintech payments platform', 'CFOs and finance teams');
      expect(insights.trustSignals.some(t => t.toLowerCase().includes('security') || t.toLowerCase().includes('compliance'))).toBe(true);
    });

    it('returns healthcare insights', async () => {
      const { inferAudienceInsights } = await import('../../src/research/business-researcher.js');
      const insights = inferAudienceInsights('healthcare clinic', 'patients');
      expect(insights.trustSignals.some(t => t.toLowerCase().includes('hipaa'))).toBe(true);
      expect(insights.expectations.some(e => e.toLowerCase().includes('appointment'))).toBe(true);
    });

    it('returns education insights', async () => {
      const { inferAudienceInsights } = await import('../../src/research/business-researcher.js');
      const insights = inferAudienceInsights('education university', 'students');
      expect(insights.trustSignals.some(t => t.toLowerCase().includes('accreditation'))).toBe(true);
    });

    it('returns SaaS insights for technology platforms', async () => {
      const { inferAudienceInsights } = await import('../../src/research/business-researcher.js');
      const insights = inferAudienceInsights('saas platform', 'developers');
      expect(insights.trustSignals.some(t => t.includes('SOC2') || t.includes('Customer logos'))).toBe(true);
    });

    it('returns fallback insights for unknown industry', async () => {
      const { inferAudienceInsights } = await import('../../src/research/business-researcher.js');
      const insights = inferAudienceInsights('submarine manufacturing', 'admirals');
      expect(insights.trustSignals.length).toBeGreaterThan(0);
      expect(insights.expectations.length).toBeGreaterThan(0);
    });

    it('adds Latin cultural considerations', async () => {
      const { inferAudienceInsights } = await import('../../src/research/business-researcher.js');
      const insights = inferAudienceInsights('retail', 'latino families', 'es-MX');
      expect(insights.culturalConsiderations.length).toBeGreaterThan(0);
    });

    it('combines insights from multiple matching industries', async () => {
      const { inferAudienceInsights } = await import('../../src/research/business-researcher.js');
      const insights = inferAudienceInsights('fintech banking technology platform', 'enterprise users');
      // Should match both fintech and saas/technology
      expect(insights.trustSignals.length).toBeGreaterThan(3);
    });
  });

  describe('inferMarketPosition', () => {
    it('detects budget positioning', async () => {
      const { inferMarketPosition } = await import('../../src/research/business-researcher.js');
      const pos = inferMarketPosition({ companyName: '3B', industry: 'discount retail', targetAudience: 'budget families', aesthetic: 'confident' });
      expect(pos.pricePoint).toBe('budget');
    });

    it('detects premium positioning', async () => {
      const { inferMarketPosition } = await import('../../src/research/business-researcher.js');
      const pos = inferMarketPosition({ companyName: 'VaultPay', industry: 'enterprise fintech', targetAudience: 'CFOs', aesthetic: 'premium elegant' });
      expect(pos.pricePoint).toBe('premium');
    });

    it('detects luxury positioning', async () => {
      const { inferMarketPosition } = await import('../../src/research/business-researcher.js');
      const pos = inferMarketPosition({ companyName: 'Maison', industry: 'fashion', targetAudience: 'affluent buyers', aesthetic: 'luxury minimalist' });
      expect(pos.pricePoint).toBe('luxury');
    });

    it('defaults to mid-range', async () => {
      const { inferMarketPosition } = await import('../../src/research/business-researcher.js');
      const pos = inferMarketPosition({ companyName: 'GenericCo', industry: 'general', targetAudience: 'everyone', aesthetic: 'clean' });
      expect(pos.pricePoint).toBe('mid-range');
    });

    it('detects local reach', async () => {
      const { inferMarketPosition } = await import('../../src/research/business-researcher.js');
      const pos = inferMarketPosition({ companyName: '3B', industry: 'neighborhood stores', targetAudience: 'local families', aesthetic: 'warm' });
      expect(pos.reach).toBe('local');
    });

    it('detects global reach', async () => {
      const { inferMarketPosition } = await import('../../src/research/business-researcher.js');
      const pos = inferMarketPosition({ companyName: 'Acme', industry: 'global enterprise', targetAudience: 'international teams', aesthetic: 'modern' });
      expect(pos.reach).toBe('global');
    });

    it('detects innovative personality', async () => {
      const { inferMarketPosition } = await import('../../src/research/business-researcher.js');
      const pos = inferMarketPosition({ companyName: 'AITech', industry: 'ai platform', targetAudience: 'developers', aesthetic: 'cutting-edge' });
      expect(pos.personality).toBe('innovative');
    });

    it('detects traditional personality', async () => {
      const { inferMarketPosition } = await import('../../src/research/business-researcher.js');
      const pos = inferMarketPosition({ companyName: 'Heritage Bank', industry: 'traditional banking', targetAudience: 'families', aesthetic: 'classic' });
      expect(pos.personality).toBe('traditional');
    });
  });

  describe('inferBusinessModel', () => {
    it('detects physical retail from nav items', async () => {
      const { inferBusinessModel } = await import('../../src/research/business-researcher.js');
      const result = inferBusinessModel(
        { companyName: 'Test', industry: 'tiendas de abarrotes', targetAudience: 'familias', aesthetic: 'warm' },
        {
          url: 'https://test.com',
          palette: { colors: [], dominantHex: '' },
          typography: { fonts: [] },
          layoutPatterns: [],
          contentTone: 'warm',
          navItems: ['Inicio', 'Productos', 'Sucursales', 'Nosotros', 'Contacto'],
          ctaTexts: ['Encuentra tu tienda'],
          fetchedAt: new Date().toISOString(),
        },
      );
      expect(result.type).toBe('physical-retail');
      expect(result.websitePurpose).toContain('foot traffic');
      expect(result.notFeatures).toContain('Shopping cart');
      expect(result.primaryUserGoals.some(g => g.toLowerCase().includes('store') || g.toLowerCase().includes('tienda'))).toBe(true);
    });

    it('detects e-commerce from cart signals', async () => {
      const { inferBusinessModel } = await import('../../src/research/business-researcher.js');
      const result = inferBusinessModel(
        { companyName: 'Shop', industry: 'online retail', targetAudience: 'shoppers', aesthetic: 'modern' },
        {
          url: 'https://shop.com',
          palette: { colors: [], dominantHex: '' },
          typography: { fonts: [] },
          layoutPatterns: [],
          contentTone: 'neutral',
          navItems: ['Home', 'Shop', 'Cart', 'Account', 'Checkout'],
          ctaTexts: ['Add to Cart', 'Buy Now'],
          fetchedAt: new Date().toISOString(),
        },
      );
      expect(result.type).toBe('e-commerce');
      expect(result.keyFeatures).toContain('Shopping cart');
    });

    it('detects SaaS from dashboard/API signals', async () => {
      const { inferBusinessModel } = await import('../../src/research/business-researcher.js');
      const result = inferBusinessModel(
        { companyName: 'AppCo', industry: 'SaaS platform', targetAudience: 'developers', aesthetic: 'minimal' },
        {
          url: 'https://appco.com',
          palette: { colors: [], dominantHex: '' },
          typography: { fonts: [] },
          layoutPatterns: [],
          contentTone: 'technical',
          navItems: ['Product', 'Pricing', 'Docs', 'Login', 'API'],
          ctaTexts: ['Start Free Trial'],
          fetchedAt: new Date().toISOString(),
        },
      );
      expect(result.type).toBe('saas');
      expect(result.keyFeatures.some(f => f.toLowerCase().includes('trial') || f.toLowerCase().includes('demo'))).toBe(true);
    });

    it('detects physical retail from industry keywords alone when no site', async () => {
      const { inferBusinessModel } = await import('../../src/research/business-researcher.js');
      const result = inferBusinessModel(
        { companyName: '3B', industry: 'hard-discount retail grocery chain', targetAudience: 'Mexican families', aesthetic: 'warm' },
      );
      expect(result.type).toBe('physical-retail');
      expect(result.confidence).toBeLessThan(60); // lower confidence without site data
    });

    it('defaults to other for unknown business', async () => {
      const { inferBusinessModel } = await import('../../src/research/business-researcher.js');
      const result = inferBusinessModel(
        { companyName: 'Unknown', industry: 'misc', targetAudience: 'everyone', aesthetic: 'clean' },
      );
      expect(result.type).toBe('other');
      expect(result.confidence).toBeLessThan(30);
    });

    it('detects service business from appointment signals', async () => {
      const { inferBusinessModel } = await import('../../src/research/business-researcher.js');
      const result = inferBusinessModel(
        { companyName: 'Dr. Smith', industry: 'dental clinic', targetAudience: 'patients', aesthetic: 'clean' },
        {
          url: 'https://drsmith.com',
          palette: { colors: [], dominantHex: '' },
          typography: { fonts: [] },
          layoutPatterns: [],
          contentTone: 'warm',
          navItems: ['Home', 'Services', 'About', 'Contact'],
          ctaTexts: ['Book Appointment', 'Schedule Consultation'],
          fetchedAt: new Date().toISOString(),
        },
      );
      expect(result.type).toBe('service');
      expect(result.keyFeatures.some(f => f.toLowerCase().includes('booking'))).toBe(true);
      expect(result.notFeatures).toContain('Shopping cart');
    });

    it('extracts differentiators with numbers from site content', async () => {
      const { inferBusinessModel } = await import('../../src/research/business-researcher.js');
      const result = inferBusinessModel(
        { companyName: '3B', industry: 'retail grocery', targetAudience: 'families', aesthetic: 'warm' },
        {
          url: 'https://tiendas3b.com',
          palette: { colors: [], dominantHex: '' },
          typography: { fonts: [] },
          layoutPatterns: [],
          contentTone: 'warm',
          navItems: ['Inicio', 'Sucursales', '3,300+ tiendas', 'Contacto'],
          ctaTexts: ['Encuentra tu tienda'],
          fetchedAt: new Date().toISOString(),
        },
      );
      expect(result.type).toBe('physical-retail');
      expect(result.differentiators.some(d => d.includes('3,300+'))).toBe(true);
    });

    it('prefers site signals over industry keywords when they conflict', async () => {
      const { inferBusinessModel } = await import('../../src/research/business-researcher.js');
      // Industry says "store" but site has cart/checkout signals
      const result = inferBusinessModel(
        { companyName: 'RetailCo', industry: 'retail store', targetAudience: 'shoppers', aesthetic: 'modern' },
        {
          url: 'https://retailco.com',
          palette: { colors: [], dominantHex: '' },
          typography: { fonts: [] },
          layoutPatterns: [],
          contentTone: 'neutral',
          navItems: ['Home', 'Shop', 'Cart', 'Checkout'],
          ctaTexts: ['Add to Cart'],
          fetchedAt: new Date().toISOString(),
        },
      );
      expect(result.type).toBe('e-commerce');
    });

    it('detects marketplace from keywords', async () => {
      const { inferBusinessModel } = await import('../../src/research/business-researcher.js');
      const result = inferBusinessModel(
        { companyName: 'TradeHub', industry: 'online marketplace', targetAudience: 'buyers and sellers', aesthetic: 'modern' },
      );
      expect(result.type).toBe('marketplace');
    });
  });

  describe('analyzeSite', () => {
    it('returns null on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const { analyzeSite } = await import('../../src/research/business-researcher.js');
      const result = await analyzeSite('https://example.com');
      expect(result).toBeNull();
    });

    it('returns null on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      const { analyzeSite } = await import('../../src/research/business-researcher.js');
      const result = await analyzeSite('https://example.com');
      expect(result).toBeNull();
    });

    it('analyzes a site successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><head><style>body{background:#FFFFFF;color:#333;font-family:"DM Sans",sans-serif}h1{font-family:"Outfit",sans-serif}</style></head><body><nav><a>Home</a><a>Products</a></nav><section style="background-image:url(x)"><h1>Welcome</h1></section><p>Welcome to our family store</p></body></html>',
      });
      const { analyzeSite } = await import('../../src/research/business-researcher.js');
      const result = await analyzeSite('https://example.com');
      expect(result).not.toBeNull();
      expect(result!.url).toBe('https://example.com');
      expect(result!.palette.colors.length).toBeGreaterThan(0);
      expect(result!.typography.fonts.length).toBeGreaterThan(0);
      expect(result!.navItems).toContain('Home');
      expect(result!.navItems).toContain('Products');
      expect(result!.layoutPatterns).toContain('hero-banner');
    });

    it('extracts CTA texts from buttons', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><body><nav><a>Home</a></nav><button>Buy Now</button><a class="btn">Sign Up</a><div role="button">Learn More</div></body></html>',
      });
      const { analyzeSite } = await import('../../src/research/business-researcher.js');
      const result = await analyzeSite('https://example.com');
      expect(result).not.toBeNull();
      expect(result!.ctaTexts).toContain('Buy Now');
      expect(result!.ctaTexts).toContain('Sign Up');
      expect(result!.ctaTexts).toContain('Learn More');
    });

    it('returns empty ctaTexts array when no CTAs found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><body><p>Just text</p></body></html>',
      });
      const { analyzeSite } = await import('../../src/research/business-researcher.js');
      const result = await analyzeSite('https://example.com');
      expect(result).not.toBeNull();
      expect(result!.ctaTexts).toEqual([]);
    });
  });

  describe('researchBusiness', () => {
    it('returns result with audience insights even without URLs', async () => {
      const { researchBusiness } = await import('../../src/research/business-researcher.js');
      const result = await researchBusiness({
        companyName: 'TestCo',
        industry: 'retail',
        targetAudience: 'families',
        aesthetic: 'warm',
      });
      expect(result.confidence).toBeGreaterThanOrEqual(10);
      expect(result.audienceInsights.trustSignals.length).toBeGreaterThan(0);
      expect(result.fallbacksUsed).toContain('current_site_unavailable');
    });

    it('includes businessModel in result', async () => {
      const { researchBusiness } = await import('../../src/research/business-researcher.js');
      const result = await researchBusiness({
        companyName: '3B',
        industry: 'hard-discount retail grocery chain',
        targetAudience: 'Mexican families',
        aesthetic: 'warm',
      });
      expect(result.businessModel).toBeDefined();
      expect(result.businessModel.type).toBe('physical-retail');
      expect(result.businessModel.notFeatures).toContain('Shopping cart');
    });

    it('increases confidence when site analysis succeeds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><head><style>body{background:#DC0C0C;color:#333;font-family:"DM Sans"}</style></head><body><nav><a>Home</a><a>Products</a></nav><section style="background-image:url(x)"><h1>Welcome</h1></section></body></html>',
      });

      const { researchBusiness } = await import('../../src/research/business-researcher.js');
      const result = await researchBusiness({
        companyName: 'TestCo',
        industry: 'retail',
        targetAudience: 'families',
        aesthetic: 'warm',
        websiteUrl: 'https://example.com',
      });
      expect(result.confidence).toBeGreaterThanOrEqual(40);
      expect(result.currentSite).toBeTruthy();
      expect(result.currentSite?.palette.colors.length).toBeGreaterThan(0);
    });

    it('tracks competitors_unavailable when no competitor URLs given', async () => {
      const { researchBusiness } = await import('../../src/research/business-researcher.js');
      const result = await researchBusiness({
        companyName: 'TestCo',
        industry: 'retail',
        targetAudience: 'families',
        aesthetic: 'warm',
      });
      expect(result.fallbacksUsed).toContain('competitors_unavailable');
    });

    it('analyzes competitor sites', async () => {
      // Main site
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><head><style>body{background:#FFF;color:#333}</style></head><body><h1>Main</h1></body></html>',
      });
      // Competitor
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><head><style>body{background:#1A5C2E;color:#FFF}</style></head><body><h1>Competitor</h1></body></html>',
      });

      const { researchBusiness } = await import('../../src/research/business-researcher.js');
      const result = await researchBusiness({
        companyName: 'TestCo',
        industry: 'retail',
        targetAudience: 'families',
        aesthetic: 'warm',
        websiteUrl: 'https://example.com',
        competitorUrls: ['https://competitor.com'],
      });
      expect(result.competitors.length).toBe(1);
      expect(result.competitors[0].name).toBe('competitor');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('caps confidence at 100', async () => {
      // Main site
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '<html><body><h1>Site</h1></body></html>',
      });
      // 4 competitors
      for (let i = 0; i < 4; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: async () => '<html><body><h1>Comp</h1></body></html>',
        });
      }

      const { researchBusiness } = await import('../../src/research/business-researcher.js');
      const result = await researchBusiness({
        companyName: 'TestCo',
        industry: 'retail',
        targetAudience: 'families',
        aesthetic: 'warm',
        websiteUrl: 'https://example.com',
        competitorUrls: [
          'https://c1.com',
          'https://c2.com',
          'https://c3.com',
          'https://c4.com',
        ],
      });
      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });
});
