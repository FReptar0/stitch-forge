---
name: dg-design
description: >
  Generate a DESIGN.md from a brand brief. Use when the user wants to
  create a visual identity, design system, or brand style guide for a
  web project. Also use when starting a new website from scratch. Asks
  for company name, industry, target audience, and aesthetic direction.
  Outputs an 8-section design spec with colors, typography, and anti-slop rules.
---

Generate a complete DESIGN.md for a web project using Google Stitch.

## Instructions

0. **Discover check (MUST run before anything else)**:
   - Check if the `.dg-research/` directory exists and contains JSON files.
   - IF `.dg-research/` does NOT exist AND the user has mentioned a specific business name, company, brand, cafe, restaurant, store, or real-world entity:
     - STOP. Tell the user: "I recommend running `/dg-discover` first to research [business name]. This produces a DESIGN.md grounded in real market and competitor data instead of AI defaults. Would you like me to run `/dg-discover` instead?"
     - Only proceed with `/dg-design` if the user explicitly says to skip research.
   - IF `.dg-research/` exists with JSON files: Read `.dg-research/latest.json` to get the business brief, competitor analysis, and brand colors. This research data is your PRIMARY source for business context -- use it over any project-level context from CLAUDE.md. Proceed to step 1.
   - IF the user request is generic (no specific business mentioned, e.g., "make a portfolio site" or "create a SaaS dashboard"): proceed directly to step 1. Research is for real businesses, not generic projects.

### Context Isolation (CRITICAL -- read before generating)

When generating a DESIGN.md, distinguish between two contexts:

1. **Host project** -- the codebase you are running inside (Design Guard). CLAUDE.md
   describes THIS project. Its business model, features, CLI commands, test counts,
   and technical architecture are about Design Guard, NOT about the user's target business.

2. **Target business** -- the business the user wants a DESIGN.md for. This comes from:
   - The brand brief the user provides (Step 1)
   - Research data in `.dg-research/latest.json` (if available from /dg-discover -- this is your PRIMARY source)
   - WebSearch/WebFetch results about the target business

**Rules:**
- IF the target business is DIFFERENT from Design Guard:
  - Do NOT use business descriptions, feature lists, stats, or technical details from CLAUDE.md
  - Do NOT reference CLI commands, test counts, TypeScript, Node.js, MCP, or Stitch as features of the target business
  - Do NOT describe the target as "open source", "design intelligence", or any phrase from CLAUDE.md's Project Overview
  - Every business fact in the DESIGN.md must come from the user's brief or research data
  - If an existing DESIGN.md is present at the project root, do NOT copy its colors, fonts, or business context into the new one -- generate fresh from the brief and research

- IF the target business IS Design Guard itself:
  - CLAUDE.md is a valid source of business context -- use it alongside the user's brief

- ALWAYS follow the DESIGN.md 8-section specification and validation rules from CLAUDE.md regardless of target business. The FORMAT rules always apply; the BUSINESS context is what gets isolated.

1. If the user provided a brand brief as argument, use it. Otherwise ask for:
   - Company/product name
   - Industry or domain
   - Target audience
   - Aesthetic direction (e.g., "premium corporate", "playful startup", "minimal SaaS")

2. Generate a DESIGN.md with exactly these 8 sections:

   1. **Visual Theme & Atmosphere** — 2-3 evocative sentences describing overall aesthetic. Use specific adjectives and references, not generic terms.
   2. **Color Palette & Roles** — Markdown table with columns: Role, Name, Hex, Usage. Minimum 5 roles (Primary, Secondary, Surface, On-Surface, Error). All colors as hex values, never descriptions like "trustworthy blue". Give each color a descriptive name (e.g., "Deep Navy" not just "Primary").
   3. **Typography** — Font families from Google Fonts (avoid Inter, Poppins as primary — they signal AI-generated design). Sizes in rem/px, weights as numbers (400/600/700), line heights. Include heading, body, and mono. Use a serif/sans-serif pairing for contrast.
   4. **Spacing & Layout** — Base unit (e.g., 4px), scale, max content width, grid system, breakpoints.
   5. **Component Patterns** — At least 3 components (buttons, cards, inputs, etc.) with structure and style rules. Vary border-radius and shadow styles.
   6. **Iconography** — Style (outline/solid/duotone), default size, source library.
   7. **Imagery Guidelines** — Photo style, illustration style, aspect ratios. Be specific about what imagery communicates.
   8. **Do's and Don'ts** — At least 3 of each. MUST include these anti-slop defaults:

   ### Do
   - Do use asymmetric or non-standard layouts for at least one feature section
   - Do vary card sizes and spacing to create visual rhythm
   - Do use the specified color palette exclusively (no AI-chosen colors)
   - Do maintain high contrast (4.5:1 minimum) for all text
   - Do vary section backgrounds (alternate between light/dark surfaces)

   ### Don't
   - Don't use Inter, Poppins, or system sans-serif as the primary font
   - Don't use purple-to-blue gradients anywhere
   - Don't use uniform border-radius (>12px) on all elements
   - Don't use standard three-column icon grids as the second page section
   - Don't center-align body text longer than 2 lines
   - Don't use generic stock photo illustrations (3D blobs, abstract shapes)

3. Validation rules:
   - All colors must be hex values (#RRGGBB)
   - Font sizes in rem or px only
   - At least 5 color roles, 3 component patterns, 3 Do's and 3 Don'ts
   - Keep total under ~3000 tokens (Stitch reads it as context on every generation)

4. If DESIGN.md already exists, ask before overwriting.

5. Write the file to `DESIGN.md` at the project root.

6. After writing, check if a Stitch design system exists using `mcp__stitch__list_design_systems`. If the user has a Stitch project:
   - Offer to create a design system with `mcp__stitch__create_design_system`
   - Or update an existing one with `mcp__stitch__update_design_system`
   - Apply it to the project with `mcp__stitch__apply_design_system` so all future generations respect it

7. **Next step**: Suggest running `/dg-generate` to create the first screen using the new design system.

Reference: See `docs/design-md-guide.md` for the full specification.
