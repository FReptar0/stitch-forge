---
name: forge-design
description: >
  Generate a DESIGN.md from a brand brief. Use when the user wants to
  create a visual identity, design system, or brand style guide for a
  web project. Also use when starting a new website from scratch. Asks
  for company name, industry, target audience, and aesthetic direction.
  Outputs an 8-section design spec with colors, typography, and anti-slop rules.
---

Generate a complete DESIGN.md for a web project using Google Stitch.

## Instructions

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

7. **Next step**: Suggest running `/forge-generate` to create the first screen using the new design system.

Reference: See `docs/design-md-guide.md` for the full specification.
