---
name: forge-discover
description: >
  Research a business and generate a tailored DESIGN.md based on real-world
  data. Use when the user wants to redesign a website, create a design
  system for a specific business, or start a new web project with a real
  brand in mind. Analyzes the current website, studies competitors,
  understands the audience, and produces a design system that is specific
  to THIS business. This is the recommended entry point over /forge-design
  when real business context is available.
---

Research a business and generate a tailored DESIGN.md based on real-world data.

## When to Use This vs /forge-design

- **/forge-discover**: When you know the actual business (name, URL, industry). Produces a researched, differentiated design system.
- **/forge-design**: Quick generic design system from a brief. No research. Uses industry presets.

## Phase 1: Gather Brief

1. If the user provided a business description, extract:
   - Company name (required)
   - Industry / domain (required)
   - Target audience (required)
   - Aesthetic direction (optional — will infer from research)
   - Website URL (optional but highly valuable)
   - Locale / market (e.g., "Mexican market", "US enterprise")

2. If information is missing, ask for at minimum: company name, what they do, and who their customers are.

## Phase 2: Research

3. **Analyze current website** (if URL provided or discoverable):
   - Use WebFetch to retrieve the homepage HTML
   - Extract current color palette from CSS (hex values in stylesheets, custom properties, inline styles)
   - Identify current fonts (Google Fonts links, font-family declarations)
   - Note layout patterns (hero style, grid structure, nav pattern)
   - Report findings: "I found your current brand uses [colors], [fonts]"

4. **Research competitors** (2-3 in the same industry/market):
   - Use WebSearch: "[company name] competitors" or "[industry] [market] companies"
   - For each competitor, use WebFetch to analyze their website
   - Extract their color schemes and typography
   - Note shared patterns (table stakes to include)
   - Note distinctive elements (inspiration for differentiation)
   - Report: "Your competitors use [patterns]. To differentiate, we should..."

5. **Understand the audience**:
   - Use WebSearch for "[target audience] website expectations" or "[industry] UX best practices"
   - Identify trust signals important for this audience
   - Consider cultural factors (especially for non-US markets)

## Phase 3: Synthesize DESIGN.md

6. Generate DESIGN.md with 8 sections using research data:

   1. **Visual Theme & Atmosphere**: Reference the actual brand and market position. Be specific: "A warm, community-rooted aesthetic that positions [company] as the neighborhood alternative to [competitor]'s corporate feel."

   2. **Color Palette & Roles**: Use REAL brand colors if extracted. Explain why they differ from competitors. Name colors descriptively tied to the brand (not "Primary" but "Storefront Red").

   3. **Typography**: Choose fonts that DIFFERENTIATE from competitors. If all competitors use geometric sans-serifs, consider a humanist or serif pairing.

   4. **Spacing & Layout**: Standard layout tokens.

   5. **Component Patterns**: At least 3 components with specific style rules.

   6. **Iconography**: Icon style matching the aesthetic.

   7. **Imagery Guidelines**: Reference the ACTUAL target audience, not generic "professional photography."

   8. **Do's and Don'ts**: Standard anti-slop rules PLUS business-specific rules. Example: "Don't use [competitor's signature color] — it creates brand confusion."

## Guardrails

- All colors MUST be hex values — no "trustworthy blue"
- No `<!-- -->` placeholder comments anywhere
- Font families from Google Fonts (or specify self-hosted)
- Do's/Don'ts include at least 3 business-specific rules
- Total under ~3000 tokens (Stitch reads it every generation)
- Every section has real content, not templates
- Reference the actual audience, never just "users"

## Phase 4: Validate & Output

7. Self-check the DESIGN.md:
   - Specificity: Are design decisions backed by research?
   - Differentiation: Do colors/fonts differ from competitors?
   - Completeness: All 8 sections filled with real content?
   - Actionability: Can Stitch follow these rules unambiguously?

8. Report quality:
   - "Research confidence: X% (based on N data sources)"
   - "Specificity: X of Y decisions backed by research data"

9. Write DESIGN.md to project root (ask before overwriting).

10. Save research data to `.forge-research/latest.json`.

11. **Next steps**:
    - "Create a Stitch design system with `mcp__stitch__create_design_system`"
    - "Generate the first screen with `/forge-generate`"
    - "Review and adjust before generating"

## Fallback Behavior

- If WebFetch/WebSearch fail, fall back to industry presets
- If only partial research succeeds, use what's available
- Always tell the user what was researched vs inferred
- If confidence < 30%, suggest `/forge-design` instead
