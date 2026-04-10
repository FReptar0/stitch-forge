# DESIGN.md Format Guide

## Purpose

DESIGN.md is a markdown file that encodes a design system for Google Stitch.
When imported into a Stitch project, it acts as persistent context — read by
Gemini on every generation to keep screens consistent.

## Required Sections

### 1. Visual Theme & Atmosphere
2-3 sentences describing the overall aesthetic direction.
Example: "A premium, minimal B2B aesthetic with generous whitespace and editorial typography. Dark navy accents against warm off-white surfaces."

### 2. Color Palette & Roles
Use a markdown table with semantic role names, hex values, and usage descriptions.

| Role | Hex | Usage |
|------|-----|-------|
| Primary | #1E3A5F | CTAs, links, key UI |
| Secondary | #F5A623 | Accents, badges |
| Surface | #FAFAF8 | Backgrounds |
| On-Surface | #2D2D2D | Body text |
| Error | #DC2626 | Error states |

**Rules:**
- Minimum 5 color roles
- Always use hex values, never descriptions ("trustworthy blue" is invalid)
- Include semantic names (Primary, not just "Blue")

### 3. Typography
Specify exact font families (from Google Fonts), sizes, weights, line heights.

**Rules:**
- Sizes in rem or px
- Weights as numbers (400, 600, 700)
- Include heading, body, and mono families

### 4. Spacing & Layout
- Base unit (e.g., 4px)
- Scale (e.g., 4, 8, 12, 16, 24, 32, 48, 64)
- Max content width
- Grid system
- Breakpoints

### 5. Component Patterns
Define at least 3 components: buttons, cards, inputs, navbars, etc.
Include structure and style rules for each.

### 6. Iconography
Icon style (outline/solid/duotone), default size, stroke width, source library.

### 7. Imagery Guidelines
Photo style, illustration style, aspect ratios, treatment rules.

### 8. Do's and Don'ts
At least 3 of each. Explicit rules to prevent common AI generation mistakes.

## Token Budget

Keep total DESIGN.md under ~3000 tokens. Stitch reads it as context on every
generation, so verbose files reduce prompt budget for the actual screen description.

## Anti-patterns

- ❌ Brand philosophy essays ("Our brand represents trust and innovation...")
- ❌ Vague color descriptions ("Use a warm, inviting palette")
- ❌ Missing hex values
- ❌ Missing font size specifications
- ❌ Overly long component descriptions (keep to style rules, not full HTML)
