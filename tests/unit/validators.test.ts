import { describe, it, expect } from 'vitest';
import { validatePrompt, PROMPT_MAX_CHARS } from '../../src/utils/validators.js';

describe('validatePrompt', () => {
  it('accepts a valid short prompt', () => {
    const result = validatePrompt('A minimal landing page for "Acme Corp"');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects prompts over max length', () => {
    const longPrompt = 'x'.repeat(PROMPT_MAX_CHARS + 1);
    const result = validatePrompt(longPrompt);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('max is');
  });

  it('detects multiple screens in one prompt', () => {
    const result = validatePrompt('A homepage and a pricing page for Acme');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('multiple screens');
  });

  it('rejects vague refinements', () => {
    const result = validatePrompt('make it better');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('vague');
  });

  it('accepts specific refinements', () => {
    const result = validatePrompt('On the hero section, change the CTA button color to #FF5733');
    expect(result.valid).toBe(true);
  });

  it('detects fuzzy vague prompts', () => {
    expect(validatePrompt('just make it better').valid).toBe(false);
    expect(validatePrompt('improve this').valid).toBe(false);
    expect(validatePrompt('it looks bad').valid).toBe(false);
  });

  it('detects multiple page types listed', () => {
    expect(validatePrompt('Create a landing page, pricing page, and about page').valid).toBe(false);
  });

  it('detects numbered page requests', () => {
    expect(validatePrompt('Create three pages for my startup').valid).toBe(false);
  });

  it('allows legitimate prompts with page-like words', () => {
    expect(validatePrompt('A pricing page with three pricing tiers and annual toggle').valid).toBe(true);
  });
});
