export interface DesignBrief {
  companyName: string;
  industry: string;
  targetAudience: string;
  aesthetic: string; // e.g. "minimal luxury", "vibrant tech", "organic warm"
  primaryColor?: string; // hex
  secondaryColor?: string; // hex
}

export function generateDesignMdTemplate(brief: DesignBrief): string {
  return `# ${brief.companyName} — Design System

## 1. Visual Theme & Atmosphere

${brief.aesthetic} aesthetic for ${brief.industry}. Targeting ${brief.targetAudience}.
<!-- Replace with 2-3 sentences describing the overall visual direction.
     Be specific: name a mood, a reference, a cultural anchor.
     Bad: "A clean and modern look."
     Good: "Inspired by mid-century Swiss graphic design — structured grids,
     bold typography, and restrained color. Feels authoritative but approachable,
     like a well-designed annual report for a creative agency." -->

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Deep Navy | ${brief.primaryColor || '#1B2A4A'} | Main brand color, CTAs, key UI elements |
| Secondary | Warm Copper | ${brief.secondaryColor || '#C17F59'} | Supporting elements, hover states, accents |
| Surface | Soft White | #FAFAF8 | Background, cards |
| On-Surface | Charcoal | #2D2D2D | Body text on surface |
| Error | Brick Red | #C53030 | Error states, destructive actions |
| Success | Forest Green | #2F855A | Success states, confirmations |
| Muted | Warm Gray | #E8E6E1 | Disabled states, subtle backgrounds |

## 3. Typography

- **Heading**: <!-- e.g. "Space Grotesk", "DM Serif Display", "Outfit", "Sora" — avoid Inter, Poppins, system defaults -->
- **Body**: <!-- e.g. "Libre Franklin", "Source Sans 3", "Instrument Sans" — avoid Inter, Poppins, system defaults -->
- **Mono**: <!-- e.g. "JetBrains Mono", "IBM Plex Mono", monospace -->

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 3rem | 700 | 1.1 |
| H2 | 2.25rem | 700 | 1.2 |
| H3 | 1.5rem | 600 | 1.3 |
| Body | 1rem | 400 | 1.6 |
| Small | 0.875rem | 400 | 1.5 |

## 4. Spacing & Layout

- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
- **Max content width**: 1200px
- **Grid**: 12-column, 24px gutter
- **Breakpoints**: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)

## 5. Component Patterns

### Buttons
- Primary: filled with Primary color, white text, 8px radius, 16px 24px padding
- Secondary: outline with Primary color border, Primary text
- Ghost: no background, Primary text, hover shows Muted background

### Cards
- White surface, 1px border Muted, 12px radius, 24px padding
- Hover: subtle shadow elevation

### Inputs
- 1px border Muted, 8px radius, 12px 16px padding
- Focus: Primary border, subtle Primary shadow
- Error: Error border, Error text below

## 6. Iconography

<!-- e.g. "Lucide icons, 24px default, 1.5px stroke, outline style" -->

## 7. Imagery Guidelines

<!-- e.g. "Professional photography, muted tones, 16:9 hero images, 1:1 team photos. No stock photo clichés." -->

## 8. Do's and Don'ts

### Do
- Use consistent spacing from the scale
- Maintain high contrast (4.5:1 minimum) for text readability
- Use Primary color sparingly for emphasis
- Use asymmetric or non-standard layouts for at least one section
- Vary card sizes and spacing to create visual rhythm
- Vary section backgrounds (alternate between light/dark surfaces)

### Don't
- Don't use Inter, Poppins, or system sans-serif as the primary font
- Don't use purple-to-blue gradients anywhere
- Don't use more than 2 font families
- Don't use pure black (#000000) for body text — use On-Surface
- Don't center-align body text longer than 2 lines
- Don't use uniform border-radius (>12px) on all elements
- Don't use standard three-column icon grids as the second page section
- Don't use generic stock illustrations (3D blobs, abstract shapes)
`;
}
