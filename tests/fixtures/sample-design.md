# Acme — Design System

## 1. Visual Theme & Atmosphere

Premium corporate aesthetic with generous whitespace and editorial typography. Dark navy accents against warm off-white surfaces. Confidence without ostentation.

## 2. Color Palette & Roles

| Role | Hex | Usage |
|------|-----|-------|
| Primary | #1E3A5F | CTAs, links, key UI elements |
| Secondary | #F5A623 | Accents, highlights, badges |
| Surface | #FAFAF8 | Page backgrounds, card fills |
| On-Surface | #2D2D2D | Body text |
| Muted | #E8E8E4 | Borders, dividers, disabled states |
| Error | #DC2626 | Error states, destructive actions |
| Success | #16A34A | Success confirmations |

## 3. Typography

- **Heading**: "DM Serif Display", serif
- **Body**: "DM Sans", sans-serif
- **Mono**: "JetBrains Mono", monospace

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 3rem | 700 | 1.1 |
| H2 | 2.25rem | 700 | 1.2 |
| H3 | 1.5rem | 600 | 1.3 |
| Body | 1rem | 400 | 1.6 |
| Small | 0.875rem | 400 | 1.5 |
| Caption | 0.75rem | 500 | 1.4 |

## 4. Spacing & Layout

- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
- **Max content width**: 1200px
- **Grid**: 12-column, 24px gutter
- **Breakpoints**: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)

## 5. Component Patterns

### Buttons
- Primary: #1E3A5F fill, white text, 8px radius, 12px 24px padding, 500 weight
- Secondary: #1E3A5F 1px border, #1E3A5F text, transparent fill
- Ghost: no border, #1E3A5F text, hover #F5F5F0 fill

### Cards
- #FFFFFF fill, 1px #E8E8E4 border, 12px radius, 24px padding
- Hover: 0 4px 12px rgba(0,0,0,0.08) shadow

### Inputs
- 1px #E8E8E4 border, 8px radius, 12px 16px padding, #2D2D2D text
- Focus: #1E3A5F border, 0 0 0 3px rgba(30,58,95,0.1) shadow
- Error: #DC2626 border, #DC2626 helper text below

### Navigation
- Sticky top, #FFFFFF fill, 1px bottom border #E8E8E4
- Logo left, nav links center, CTA button right
- Mobile: hamburger menu, slide-in drawer

## 6. Iconography

Lucide icons, 24px default, 1.5px stroke, outline style. Match On-Surface color for body context, Primary for interactive elements.

## 7. Imagery Guidelines

Professional photography with muted, warm tones. 16:9 for hero images, 1:1 for team/avatar photos. No generic stock. Overlay: subtle #1E3A5F at 60% opacity for text-over-image sections.

## 8. Do's and Don'ts

### Do
- Use consistent spacing from the 4px scale
- Maintain WCAG AA contrast ratios (4.5:1 for body text)
- Use Primary color sparingly — only for actions and emphasis
- Keep body text left-aligned
- Use the card pattern for grouping related content

### Don't
- Don't use more than 2 font families per page
- Don't use pure black (#000000) for text — use On-Surface (#2D2D2D)
- Don't center-align body text longer than 2 lines
- Don't use rounded corners > 12px (except pills for tags)
- Don't use gradients — flat colors only
