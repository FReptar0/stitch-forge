# Phase 5: Remaining Lint Rules — Research

## Current State
- 23 rules in registry (index.ts), 18 `no-*` rule files
- All rules follow LintRule interface: id, name, description, severity, category, check(context)
- LintContext provides: html, allStyles, allClasses, $ (Cheerio), designMdContent?
- Categories available: color, typography, accessibility, slop, structure, content, layout

## Detection Strategies for 6 New Rules

### 1. no-single-font (typography, warning)
- Parse allStyles for `font-family` declarations, extract font names
- Deduplicate (case-insensitive, ignore generic families like sans-serif/monospace)
- Also check Tailwind font-* classes (font-sans, font-serif, font-mono count as distinct)
- Flag if only 1 unique named font family found

### 2. no-flat-hierarchy (typography, info)
- Match CSS selectors h1-h6 with font-size declarations from allStyles
- Parse values to px (rem * 16, em * 16)
- Sort by heading level, compute ratio between consecutive levels
- Flag if any consecutive ratio < 1.3x

### 3. no-nested-cards (layout, warning)
- Define card indicators: classes containing "card", elements with border+radius, box-shadow
- Use Cheerio: find elements matching card indicators
- For each, check if any ancestor also matches card indicators
- Flag if nested cards found

### 4. no-opacity-palette (color, warning)
- Match all rgba() values in allStyles
- Extract unique alpha values per base color (or just count total distinct rgba patterns)
- Flag if 5+ distinct rgba() values found

### 5. no-colored-glow (slop, warning)
- Match box-shadow declarations in allStyles
- Filter: must have blur > 8px AND colored (not grayscale rgba(0,0,0,x))
- Count elements with colored glow via inline styles + CSS classes
- Flag if 3+ found

### 6. no-generic-cta (content, info)
- Define generic CTA list: "Get Started", "Learn More", "Sign Up", "Try Now", etc.
- Select button/a elements, extract text content
- Match against generic list (case-insensitive, trimmed)
- Flag if 2+ generic CTAs found

## Pattern Notes
- Each rule file: ~30-60 lines, single export const
- Import: LintRule from ./types.js, ValidationIssue from ../output-validator.js
- Return ValidationIssue[] with type matching severity, category matching rule category
