# Design Guard — Design System

## 1. Visual Theme & Business Context

Dark futuristic terminal aesthetic with neon accents — inspired by IDE color schemes and cyberpunk UI. The design feels like a premium developer tool: precise, technical, confident. Glassmorphism cards with subtle backdrop blur create depth against the dark canvas. The visual language says "this is built by developers, for developers" while remaining approachable enough for designers exploring AI-powered workflows.

**Business Model**: Open source CLI framework — free to use, community-driven, MIT licensed.
**Website Purpose**: Drive tool adoption (npm install / GitHub clone) and grow the open source community (GitHub stars, contributions, discussions). NOT a SaaS product — no pricing, no signup, no user accounts.
**Primary User Goals**:
1. Understand what Design Guard does in under 30 seconds
2. See the workflow in action (design → generate → build)
3. Install and start using the CLI
4. Explore Claude Code slash commands
5. Star the repo or contribute

**Key Page Elements**: Hero with clear value proposition, workflow visualization, feature highlights, Claude Code integration showcase, installation command, GitHub CTA.
**Avoid on this site**: Pricing pages, login/signup flows, user dashboards, enterprise contact forms, SaaS trial CTAs, testimonial carousels with fake headshots.

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Guard Purple | #6C5CE7 | CTAs, active states, key highlights, command prefixes |
| Secondary | Neon Cyan | #00CEC9 | Accent links, code syntax, secondary emphasis |
| Tertiary | Hot Pink | #FD79A8 | Badges, notifications, warning highlights |
| Surface | Void Black | #0F0F1A | Page background, card backgrounds |
| On-Surface | Cloud White | #E8E8F0 | Body text, descriptions |
| Heading | Pure White | #FFFFFF | H1, H2, nav links, strong emphasis |
| Muted | Smoke | #2D2D3F | Borders, disabled states, code block backgrounds |
| Glass | Glass White | rgba(255,255,255,0.05) | Card surfaces, glassmorphism overlays |

## 3. Typography

- **Heading**: "Space Grotesk", sans-serif
- **Body**: "DM Sans", sans-serif
- **Mono**: "JetBrains Mono", monospace (for code blocks, terminal output, commands)

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 3.5rem | 700 | 1.1 |
| H2 | 2.25rem | 700 | 1.15 |
| H3 | 1.5rem | 600 | 1.3 |
| Body | 1rem | 400 | 1.7 |
| Small | 0.875rem | 400 | 1.5 |
| Code | 0.9rem | 400 | 1.6 |
| Command | 1.125rem | 500 | 1.4 |

## 4. Spacing & Layout

- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
- **Max content width**: 1140px
- **Grid**: 12-column, 24px gutter
- **Breakpoints**: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- **Section vertical padding**: 80px desktop, 48px mobile

## 5. Component Patterns

### Buttons
- Primary: Guard Purple fill, white text, 8px radius, 14px 28px padding, subtle glow on hover
- Secondary: transparent with 1px Guard Purple border, Guard Purple text, fill on hover
- Ghost: transparent, Cloud White text, Muted background on hover
- Install CTA: Mono font, Muted background, Neon Cyan text, copy-to-clipboard icon

### Glass Cards
- Glass White background with `backdrop-filter: blur(12px)`, 1px border Muted, 12px radius, 24px padding
- Hover: border shifts to Guard Purple at 30% opacity
- Used for features, workflow steps, command showcases

### Code Blocks
- Muted background (#1E1E2E), JetBrains Mono font, 8px radius, 16px padding
- Syntax highlighting: strings in Neon Cyan, keywords in Guard Purple, comments in #636381
- Copy button top-right, Ghost style

### Terminal Mockup
- Muted background with fake window chrome (three dots: #FF5F57, #FEBC2E, #28C840)
- Content in JetBrains Mono with realistic command output
- Used in hero to show the dg workflow

## 6. Iconography

Lucide icons, 24px default, 1.5px stroke, outline style. Guard Purple for interactive icons, Cloud White for decorative. Use terminal-related icons: Terminal, Code, Palette, Layers, Zap, GitBranch, Package, Eye.

## 7. Imagery Guidelines

No photography — this is a developer tool. Use: terminal mockups showing real CLI output, code editor screenshots with syntax highlighting, abstract geometric patterns (low-poly mesh, grid lines, particle effects) as section backgrounds. Animated gradient orbs (purple-to-cyan) as decorative elements. All imagery should reinforce the "built in the terminal" identity.

Avoid: stock photos of people at computers, generic SaaS dashboard screenshots, AI-generated robot/brain imagery, clipart-style illustrations.

## 8. Do's and Don'ts

### Do
- Use the terminal mockup as the hero centerpiece — show the actual workflow
- Display real CLI commands with copy-to-clipboard functionality
- Show the slash commands (`/dg-design`, `/dg-generate`, etc.) as interactive elements
- Use glassmorphism cards consistently for content sections
- Keep the dark background throughout — no light sections
- Use Neon Cyan for links and interactive code elements
- Include the GitHub star count and npm install command prominently
- Use monospace font for any command, path, or technical term
- Add subtle glow effects on interactive elements (buttons, cards on hover)

### Don't
- Don't use Inter, Poppins, or system sans-serif as the primary font
- Don't use purple-to-blue gradients (use purple-to-cyan instead for brand consistency)
- Don't add pricing, signup, or login elements — this is free open source software
- Don't use light backgrounds for any main content section
- Don't use photography or realistic illustrations
- Don't use uniform border-radius (>16px) on all elements
- Don't use standard three-column icon grids as the second page section
- Don't include testimonials with stock headshots
- Don't use generic SaaS language ("revolutionize your workflow", "seamless integration")
- Don't use a hamburger menu on desktop — keep nav items visible
