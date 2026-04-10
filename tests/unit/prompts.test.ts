import { describe, it, expect } from 'vitest';
import { buildInitialPrompt, buildRefinementPrompt, buildLocalePrompt } from '../../src/templates/prompts.js';

describe('buildInitialPrompt', () => {
  it('includes product name and page type', () => {
    const prompt = buildInitialPrompt({
      productName: 'Acme',
      productDescription: 'project management SaaS',
      pageType: 'landing page',
      targetUser: 'remote startup teams',
      visualTone: 'modern minimal',
      sections: ['Hero with value proposition', 'Features grid', 'Testimonials', 'Contact form'],
      hasDesignMd: false,
    });

    expect(prompt).toContain('Acme');
    expect(prompt).toContain('landing page');
    expect(prompt).toContain('1. Hero');
    expect(prompt).toContain('4. Contact');
    expect(prompt).not.toContain('Following the imported design system');
  });

  it('adds design system reference when DESIGN.md exists', () => {
    const prompt = buildInitialPrompt({
      productName: 'Test',
      productDescription: 'test app',
      pageType: 'homepage',
      targetUser: 'developers',
      visualTone: 'minimal',
      sections: ['Hero'],
      hasDesignMd: true,
    });

    expect(prompt).toContain('Following the imported design system');
  });
});

describe('buildRefinementPrompt', () => {
  it('targets a specific section', () => {
    const prompt = buildRefinementPrompt({
      screenName: 'homepage',
      sectionTarget: 'hero section',
      change: 'increase the heading font size to 4rem',
    });

    expect(prompt).toContain('hero section');
    expect(prompt).toContain('4rem');
  });

  it('includes detail bullets', () => {
    const prompt = buildRefinementPrompt({
      screenName: 'pricing',
      sectionTarget: 'pricing cards',
      change: 'add a highlighted "Popular" badge',
      details: ['Gold background', 'Positioned top-right corner'],
    });

    expect(prompt).toContain('- Gold background');
    expect(prompt).toContain('- Positioned top-right');
  });
});

describe('buildLocalePrompt', () => {
  it('generates locale switch prompt', () => {
    expect(buildLocalePrompt('Spanish')).toBe('Switch all text content to Spanish.');
  });
});
