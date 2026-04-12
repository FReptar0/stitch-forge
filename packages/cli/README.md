# design-guard

CLI and TUI for AI-powered web design. Research businesses, generate design systems, create screens via Google Stitch or Claude, validate output against anti-slop rules, and build production sites.

<p>
  <a href="https://www.npmjs.com/package/design-guard"><img src="https://img.shields.io/npm/v/design-guard.svg?style=flat&color=6C5CE7" alt="npm"></a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT">
  <img src="https://img.shields.io/badge/Claude_Code-000?style=flat&logo=anthropic&logoColor=white" alt="Claude Code">
  <img src="https://img.shields.io/badge/Google_Stitch-4285F4?style=flat&logo=google&logoColor=white" alt="Google Stitch">
</p>

## Install

```bash
npm install -g design-guard
```

## Quick Start

```bash
# Initialize project and configure auth
dg init

# Research a business and generate a tailored design system
dg discover "Acme Coffee, food & beverage, young professionals, warm minimal" --url https://acmecoffee.com

# Generate a screen
dg generate "A landing page with hero, menu highlights, and location CTA"

# Lint the output
dg lint screens/landing.html

# Preview in browser
dg preview

# Build a production site
dg build --framework static --auto
```

## Commands

| Command | Description |
|---------|-------------|
| `dg init` | Setup project, auth, and MCP config |
| `dg discover "brief" [--url URL]` | Research business + generate tailored DESIGN.md |
| `dg design "brief"` | Generate DESIGN.md from preset templates (14 industries, 6 aesthetics) |
| `dg generate "description"` | Generate a screen via Stitch MCP or Claude |
| `dg lint [file\|dir]` | Validate HTML against DESIGN.md (18 rules, SARIF output) |
| `dg preview [name]` | Open screen in browser (`--all` for all screens) |
| `dg build --framework static` | Build site (static \| astro \| nextjs) |
| `dg sync [project-id]` | Pull screens and metadata from Stitch |
| `dg research` | Check for Stitch API updates, diff against known state |
| `dg tokens export` | Export DESIGN.md as W3C DTCG tokens, CSS, or JSON |
| `dg workflow [type]` | Guided multi-step workflow (redesign, new-app) |
| `dg tui` | Launch interactive terminal UI |

## Claude Code Skills

When using Design Guard inside Claude Code, these skills are available:

```
/dg-discover   Research business + generate tailored DESIGN.md
/dg-design     Generate DESIGN.md from a brand brief
/dg-generate   Generate screens with guided prompts + guardrails
/dg-build      Build and export to your chosen framework
/dg-preview    Preview screens inline
/dg-research   Check for Stitch API updates
/dg-sync       Pull latest from a Stitch project
```

## MCP Setup

Design Guard connects to Google Stitch via MCP. Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["@_davideast/stitch-mcp", "proxy"],
      "env": { "STITCH_API_KEY": "${STITCH_API_KEY}" }
    }
  }
}
```

Or connect directly:

```json
{
  "mcpServers": {
    "stitch": {
      "type": "http",
      "url": "https://stitch.googleapis.com/mcp",
      "headers": { "X-Goog-Api-Key": "${STITCH_API_KEY}" }
    }
  }
}
```

`dg init` creates this file automatically.

## Generators

Design Guard supports multiple generators:

| Generator | How | Best for |
|-----------|-----|----------|
| **Google Stitch** (default) | Via MCP (`@_davideast/stitch-mcp`) | Full visual design, multi-screen projects |
| **Claude Direct** | Via Anthropic API (`ANTHROPIC_API_KEY`) | Quick iterations, HTML/Tailwind output |

## Anti-Slop Validation

The `dg lint` command runs 18 rules across 7 categories:

- **Structure**: empty body, heading hierarchy, div soup, missing meta, business alignment
- **Typography**: default AI fonts (Inter, Poppins, Roboto...)
- **Color**: palette adherence against DESIGN.md
- **Layout**: centered everything, missing responsive, uniform spacing
- **Content**: lorem ipsum, SaaS-speak (23 phrases), duplicate CTAs
- **Accessibility**: missing alt text
- **Slop**: purple-blue gradients, generic hero, icon grids, placeholder images

Scoring: errors (-20), warnings (-10), info (-5). Pass threshold: 70/100.

Output formats: terminal report (default) or SARIF (`--format sarif`).

## Interactive TUI

```bash
dg tui
```

Launches a terminal UI with:
- **Dashboard** — Project overview, screen list, quota usage
- **Prompt Builder** — Interactive prompt composer with guardrails
- **Design Editor** — DESIGN.md section editor

## Development

```bash
git clone https://github.com/FReptar0/design-guard.git
cd design-guard && npm install
cp .env.example .env  # Add STITCH_API_KEY
npm run dev           # Launch TUI in dev mode
npm run test:cli      # Run CLI tests (98 tests)
npm run build         # Compile TypeScript
```

## License

[MIT](../../LICENSE)
