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
<!-- Replace with 2-3 sentences describing the overall visual direction -->

## 2. Color Palette & Roles

| Role | Hex | Usage |
|------|-----|-------|
| Primary | ${brief.primaryColor || '#000000'} | Main brand color, CTAs, key UI elements |
| Secondary | ${brief.secondaryColor || '#666666'} | Supporting elements, hover states |
| Surface | #FFFFFF | Background, cards |
| On-Surface | #1A1A1A | Body text on surface |
| Error | #DC2626 | Error states, destructive actions |
| Success | #16A34A | Success states, confirmations |
| Muted | #F5F5F5 | Disabled states, subtle backgrounds |

## 3. Typography

- **Heading**: <!-- e.g. "DM Serif Display", serif -->
- **Body**: <!-- e.g. "Inter", sans-serif -->
- **Mono**: <!-- e.g. "JetBrains Mono", monospace -->

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
- Maintain high contrast for text readability
- Use Primary color sparingly for emphasis

### Don't
- Don't use more than 2 font families
- Don't use pure black (#000000) for body text — use On-Surface
- Don't center-align body text longer than 2 lines
`;
}
