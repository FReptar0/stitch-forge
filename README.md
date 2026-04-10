# Stitch Forge

CLI framework for automating web page design with [Google Stitch](https://stitch.withgoogle.com) via MCP.

## Quick Start

```bash
# Install
npm install

# Setup
cp .env.example .env
# Add your STITCH_API_KEY from stitch.withgoogle.com > Settings > API Key

# Initialize project
npx tsx src/index.ts init

# Generate a design system
npx tsx src/index.ts design "Acme Corp, SaaS platform, startups, modern minimal"

# Launch TUI
npx tsx src/index.ts tui
```

## Claude Code Integration

Stitch Forge is designed to work with [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Add the MCP server config:

```json
// .mcp.json
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

Then use slash commands:
- `/forge-design` — Generate DESIGN.md from a brand brief
- `/forge-generate` — Generate screens via Stitch
- `/forge-build` — Build a deployable Astro site
- `/forge-research` — Check for Stitch updates
- `/forge-sync` — Pull screens from Stitch project

## Development

```bash
npm test          # Run tests
npm run dev       # TUI dev mode
npm run build     # Compile TypeScript
npm run typecheck # Type check
```

## Architecture

See [CLAUDE.md](./CLAUDE.md) for full architecture documentation.
