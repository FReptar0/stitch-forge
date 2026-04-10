Generate a complete DESIGN.md for a web project using Google Stitch.

## Instructions

1. If the user provided a brand brief as argument, use it. Otherwise ask for:
   - Company/product name
   - Industry or domain
   - Target audience
   - Aesthetic direction (e.g., "premium corporate", "playful startup", "minimal SaaS")

2. Generate a DESIGN.md with exactly these 8 sections:

   1. **Visual Theme & Atmosphere** — 2-3 sentences describing overall aesthetic
   2. **Color Palette & Roles** — Markdown table with columns: Role, Hex, Usage. Minimum 5 roles (Primary, Secondary, Surface, On-Surface, Error). All colors as hex values, never descriptions like "trustworthy blue"
   3. **Typography** — Font families from Google Fonts, sizes in rem/px, weights as numbers (400/600/700), line heights. Include heading, body, and mono
   4. **Spacing & Layout** — Base unit (e.g., 4px), scale, max content width, grid system, breakpoints
   5. **Component Patterns** — At least 3 components (buttons, cards, inputs, etc.) with structure and style rules
   6. **Iconography** — Style (outline/solid/duotone), default size, source library
   7. **Imagery Guidelines** — Photo style, illustration style, aspect ratios
   8. **Do's and Don'ts** — At least 3 of each. Explicit rules to prevent AI generation mistakes

3. Validation rules:
   - All colors must be hex values (#RRGGBB)
   - Font sizes in rem or px only
   - At least 5 color roles, 3 component patterns, 3 Do's and 3 Don'ts
   - Keep total under ~3000 tokens (Stitch reads it as context on every generation)

4. If DESIGN.md already exists, ask before overwriting.

5. Write the file to `DESIGN.md` at the project root.

6. After writing, check if a Stitch design system exists using `mcp__stitch__list_design_systems`. If the user has a Stitch project, offer to create or update the design system with `mcp__stitch__create_design_system` or `mcp__stitch__update_design_system`.

Reference: See `docs/design-md-guide.md` for the full specification and anti-patterns to avoid.
