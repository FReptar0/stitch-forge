---
name: dg-discover
description: >
  Research a business and generate a tailored DESIGN.md. Use when the user
  wants to redesign a website, create a design system, or build a web
  presence for a specific business. Investigates the business model,
  analyzes competitors, understands the audience, and only generates
  when confident enough. The recommended entry point for any real
  business project.
---

Research a business and generate a tailored DESIGN.md with autonomous investigation.

## Core Principle: Understand Before Designing

NEVER generate a DESIGN.md until you understand the business. A beautiful design for the wrong business model is worse than no design at all.

## Phase 1: Gather Context (REQUIRED — cannot skip)

Before ANY research or generation, establish these fundamentals:

1. **What the business IS**: 
   - If only a company name is given, ask: "What does [company] do? What products or services do they offer?"
   - If unclear whether physical or digital: "Do they sell online, in physical stores, or both?"

2. **Who the customers are**:
   - "Who are their primary customers? (families, developers, enterprises, etc.)"

3. **What the website should achieve**:
   - "What is the main goal of this website? (drive store visits, sell online, generate leads, inform)"
   - This is CRITICAL — it determines the entire page structure

4. **Current web presence**:
   - "Do they have a current website? What URL?"

If the user provides a detailed brief, extract answers from it. But if any critical info is missing (especially #1 and #3), ASK before proceeding. Do NOT assume.

## Phase 2: Research (autonomous)

Once you have the basics, research to validate and enrich:

5. **Search for the business**: Use WebSearch for "[company name]" and "[company name] business model"
   - Determine: Is this physical retail? E-commerce? SaaS? Service?
   - Find: Store count, locations, revenue model, market position
   - Find: Slogan, tagline, brand messaging

6. **Analyze current website** (if URL available): Use WebFetch on the homepage
   - Look at navigation items — what do they tell you about the business?
     - "Sucursales/Stores/Locations" → physical retail
     - "Cart/Checkout/Shop" → e-commerce
     - "Login/Dashboard/API" → SaaS
     - "Contact/Book/Schedule" → service
   - Extract current brand colors from CSS
   - Identify current fonts
   - Note CTAs — what action does the site want visitors to take?

7. **Research competitors**: Use WebSearch for "[company name] competitors" or "[industry] [market] companies"
   - Analyze 1-2 competitor websites via WebFetch
   - Note their color schemes, fonts, and layout patterns
   - Identify what to differentiate FROM

## Confidence Check (MUST pass before generating)

Rate your confidence on each dimension (0-100):

| Dimension | Minimum Required | What It Means |
|-----------|-----------------|---------------|
| Business model | >= 80 | You know what they do and how they make money |
| Website purpose | >= 80 | You know what the site should achieve |
| Audience | >= 60 | You know who the customers are |
| Visual identity | >= 40 | You have colors/fonts (can use presets if needed) |
| Competitive | >= 30 | You know at least who competitors are |

**Weighted average must be >= 70 to proceed.**

If below threshold:
- Ask the user for missing information
- Do more research
- DO NOT proceed until confident

Report your confidence: "My understanding confidence: [X]%. Business model: [type]. Proceeding to generate."

## Phase 3: Generate DESIGN.md

8. Generate DESIGN.md with **9 effective sections** (Section 1 expanded):

### Section 1: Visual Theme & Business Context

This section is the most important — Stitch reads it on every generation.

Include:
- 2-3 sentences describing the visual direction
- **Business Model**: What the company IS (e.g., "Physical retail grocery chain with 3,300+ stores")
- **Website Purpose**: What the site should DO (e.g., "Drive foot traffic to stores. NOT an e-commerce site.")
- **Primary User Goals**: Numbered list of what visitors want to accomplish
- **Key Page Elements**: What the site MUST have (e.g., "Store locator, weekly deals, category browse")
- **Avoid**: What the site must NOT have (e.g., "Shopping cart, checkout, add-to-cart buttons")

### Sections 2-7: Standard design tokens
Colors, typography, spacing, components, iconography, imagery — as before.

### Section 8: Do's and Don'ts
Standard anti-slop rules PLUS business-model-specific rules:
- Physical retail: "Do make store locator the primary CTA", "Don't add shopping cart"
- SaaS: "Do show product screenshots", "Don't use generic feature icons"
- Service: "Do make booking/contact primary", "Don't hide contact info"

## Phase 4: Validate & Present

9. Before writing, self-check:
   - Does Section 1 include business model context? (REQUIRED)
   - Does it explicitly state what the site is NOT? (REQUIRED for physical retail)
   - Are Do's/Don'ts business-specific, not just visual? (REQUIRED)
   - Are all colors hex values? (REQUIRED)
   - Is it under 3000 tokens? (REQUIRED)
   - Does it reference the actual audience? (REQUIRED)

10. Present findings to user:
    - "Business type: [type]"
    - "Website purpose: [purpose]"
    - "Brand colors found: [colors]"
    - "Competitor differentiation: [approach]"
    - "Confidence: [X]%"

11. Write DESIGN.md and save research to `.dg-research/`.

12. Suggest first screen prompt that ALIGNS with the business model:
    - Physical retail: "A landing page with hero, store locator as primary CTA, weekly deals section, and category browse"
    - SaaS: "A landing page with product demo hero, feature section, pricing tiers, and signup CTA"
    - Service: "A landing page with service overview, booking CTA, testimonials, and team section"

## Guardrails

- NEVER generate before understanding the business model
- NEVER assume e-commerce — most businesses in the world are NOT online stores
- ALWAYS include business context in Section 1 of DESIGN.md
- ALWAYS include what the site should NOT have (notFeatures)
- If unsure about the business model, ASK the user
- The DESIGN.md is not just a style guide — it's the business context that prevents wrong designs
