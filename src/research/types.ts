/**
 * Shared types for the Design Intelligence Agent pipeline.
 * Used by: business-researcher, design-synthesizer, design-validator, discover command.
 */

// ─── Business Brief ─────────────────────────────────────────────────

export interface BusinessBrief {
  companyName: string;
  industry: string;
  targetAudience: string;
  aesthetic: string;
  websiteUrl?: string;
  competitorUrls?: string[];
  locale?: string; // e.g. 'es-MX', 'en-US'
}

// ─── Site Analysis ──────────────────────────────────────────────────

export interface ExtractedColor {
  hex: string;
  frequency: number;
  context: 'background' | 'text' | 'accent' | 'border' | 'unknown';
}

export interface ExtractedPalette {
  colors: ExtractedColor[];
  dominantHex: string;
  accentHex?: string;
}

export interface ExtractedTypography {
  fonts: string[];
  headingFont?: string;
  bodyFont?: string;
}

export interface SiteAnalysis {
  url: string;
  palette: ExtractedPalette;
  typography: ExtractedTypography;
  layoutPatterns: string[];
  contentTone: 'formal' | 'casual' | 'technical' | 'warm' | 'neutral';
  navItems: string[];
  ctaTexts: string[];
  fetchedAt: string;
}

// ─── Competitor Analysis ────────────────────────────────────────────

export interface CompetitorAnalysis {
  url: string;
  name: string;
  palette: ExtractedPalette;
  typography: ExtractedTypography;
  strengths: string[];
  commonPatterns: string[];
  fetchedAt: string;
}

// ─── Audience & Market ──────────────────────────────────────────────

export interface AudienceInsight {
  trustSignals: string[];
  accessibilityNeeds: string[];
  culturalConsiderations: string[];
  expectations: string[];
}

export interface MarketPosition {
  pricePoint: 'budget' | 'mid-range' | 'premium' | 'luxury';
  reach: 'local' | 'regional' | 'national' | 'global';
  personality: 'traditional' | 'modern' | 'innovative' | 'disruptive';
}

// ─── Business Model ─────────────────────────────────────────────────

export interface BusinessModelContext {
  type: 'physical-retail' | 'e-commerce' | 'saas' | 'marketplace' | 'service' | 'media' | 'nonprofit' | 'other';
  primaryRevenue: string;
  websitePurpose: string;
  primaryUserGoals: string[];
  keyFeatures: string[];
  notFeatures: string[];
  differentiators: string[];
  confidence: number; // 0-100
}

// ─── Research Result ────────────────────────────────────────────────

export interface BusinessResearchResult {
  brief: BusinessBrief;
  businessModel: BusinessModelContext;
  currentSite?: SiteAnalysis;
  competitors: CompetitorAnalysis[];
  audienceInsights: AudienceInsight;
  marketPosition: MarketPosition;
  researchedAt: string;
  confidence: number; // 0-100
  fallbacksUsed: string[];
}

// ─── Design Quality ─────────────────────────────────────────────────

export interface DesignQualityIssue {
  section: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface DesignQualityScore {
  specificity: number;      // 0-25
  differentiation: number;  // 0-25
  completeness: number;     // 0-25
  actionability: number;    // 0-25
  total: number;            // 0-100
  issues: DesignQualityIssue[];
}

export interface SynthesizedDesign {
  markdown: string;
  tokenEstimate: number;
  qualityScore: DesignQualityScore;
  sources: string[];
}
