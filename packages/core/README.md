# @design-guard/core

Design intelligence engine for AI-generated web design. Business research, design synthesis, quality scoring, anti-slop validation, and design token conversion.

<p>
  <a href="https://www.npmjs.com/package/@design-guard/core"><img src="https://img.shields.io/npm/v/@design-guard/core.svg?style=flat&color=6C5CE7" alt="npm"></a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
</p>

This is the core library used by the [`design-guard`](https://www.npmjs.com/package/design-guard) CLI. You can also use it directly in your own tools.

## Install

```bash
npm install @design-guard/core
```

## What It Does

| Module | Purpose |
|--------|---------|
| **Research** | Scrape a website, extract palette/typography/layout, infer business model and audience |
| **Synthesis** | Turn research into a complete DESIGN.md (8 sections, industry-aware) |
| **Validation** | Score DESIGN.md quality (0-100) across specificity, differentiation, completeness, actionability |
| **Output Lint** | Validate generated HTML against DESIGN.md — 18 rules, Tailwind-aware, category breakdown |
| **Tokens** | Convert DESIGN.md to/from W3C DTCG format, export to CSS custom properties or flat JSON |
| **Templates** | Generate DESIGN.md from briefs (14 industries, 6 aesthetics), build structured prompts |
| **Prompt Utils** | Validate prompt length/intent, enhance prompts, calculate slop risk |

## Quick Start

### Validate HTML output against a design system

```typescript
import { validateOutput, formatValidationReport } from '@design-guard/core';
import { readFileSync } from 'fs';

const html = readFileSync('landing.html', 'utf-8');
const designMd = readFileSync('DESIGN.md', 'utf-8');

const result = validateOutput(html, designMd);

console.log(`Score: ${result.score}/100 (${result.passed ? 'PASS' : 'FAIL'})`);
console.log(`Confidence: ${result.confidence}%`);
console.log(formatValidationReport(result));
```

### Research a business and synthesize a design system

```typescript
import { researchBusiness, synthesizeDesign } from '@design-guard/core';

const research = await researchBusiness({
  name: 'Acme Coffee',
  industry: 'food-beverage',
  url: 'https://acmecoffee.com',
});

const design = synthesizeDesign(research);
// Returns a complete DESIGN.md string with 8 sections
```

### Score DESIGN.md quality

```typescript
import { scoreDesignMd, formatDesignQualityReport } from '@design-guard/core';

const designMd = readFileSync('DESIGN.md', 'utf-8');
const score = scoreDesignMd(designMd);

console.log(`Quality: ${score.total}/100`);
console.log(`  Specificity:     ${score.specificity}/25`);
console.log(`  Differentiation: ${score.differentiation}/25`);
console.log(`  Completeness:    ${score.completeness}/25`);
console.log(`  Actionability:   ${score.actionability}/25`);
```

### Convert to W3C Design Tokens

```typescript
import { designMdToDTCG, dtcgToCSS } from '@design-guard/core';

const designMd = readFileSync('DESIGN.md', 'utf-8');
const tokens = designMdToDTCG(designMd);
const css = dtcgToCSS(tokens);
// :root { --color-primary: #6C5CE7; ... }
```

## Lint Rules (18)

| Rule | Category | Severity | What it catches |
|------|----------|----------|----------------|
| `empty-body` | structure | error | Completely empty HTML body |
| `heading-hierarchy` | structure | warn | Skipped heading levels, multiple h1s |
| `no-div-soup` | structure | warn | Excessive divs vs semantic elements |
| `no-missing-meta` | structure | warn | Missing viewport, description, title, lang |
| `business-alignment` | structure | error | E-commerce elements on non-e-commerce sites, etc. |
| `no-default-fonts` | typography | warn | Inter, Poppins, Roboto, system-only stacks |
| `color-adherence` | color | error | Colors not in DESIGN.md palette |
| `no-centered-everything` | layout | warn | >60% of text elements centered |
| `no-missing-responsive` | layout | warn | No media queries or responsive classes |
| `no-uniform-spacing` | layout | info | Monotonous spacing (same value 10+ times) |
| `no-lorem-ipsum` | content | error | Placeholder text, lorem ipsum |
| `no-saas-speak` | content | warn | Generic AI marketing phrases (23 patterns) |
| `no-duplicate-ctas` | content | warn | Same CTA text repeated 3+ times |
| `alt-text` | accessibility | error | Images missing alt attribute |
| `no-slop-gradients` | slop | warn | Purple-to-blue AI-default gradients |
| `no-generic-hero` | slop | info | Centered gradient hero with heading + paragraph + button |
| `no-icon-grid` | slop | warn | 3-6 icon feature grid sections |
| `no-placeholder-images` | slop | warn | Placeholder/stock image URLs |

### Scoring

- Error: -20 points
- Warning: -10 points
- Info: -5 points
- Pass threshold: 70/100

Results include per-category breakdown (typography, color, layout, content, structure, slop, accessibility) and a confidence metric.

## API Reference

### Research

```typescript
researchBusiness(brief: BusinessBrief): Promise<BusinessResearchResult>
analyzeSite(url: string): Promise<SiteAnalysis>
extractPalette(html: string): ExtractedPalette
extractTypography(html: string): ExtractedTypography
```

### Validation

```typescript
validateOutput(html: string, designMd?: string): OutputValidationResult
scoreDesignMd(content: string): DesignQualityScore
getAllRules(): LintRule[]
```

### Templates

```typescript
generateDesignMdTemplate(brief: DesignBrief): string
buildInitialPrompt(spec: ScreenSpec): string
buildRefinementPrompt(spec: RefinementSpec): string
```

### Tokens

```typescript
designMdToDTCG(designMd: string): DTCGFile
dtcgToDesignMd(tokens: DTCGFile): string
dtcgToCSS(tokens: DTCGFile): string
dtcgToFlatJSON(tokens: DTCGFile): Record<string, string>
```

### Prompt Utils

```typescript
validatePrompt(prompt: string): { valid: boolean; issues: string[] }
enhancePrompt(prompt: string, designMd?: string): EnhancementResult
calculateSlopRisk(prompt: string): number
```

## License

[MIT](../../LICENSE)
