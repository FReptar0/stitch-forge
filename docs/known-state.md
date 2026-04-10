# Stitch — Known State

**Last Updated**: 2026-04-09

## AI Models

| Model | Monthly Quota | Use Case |
|-------|--------------|----------|
| Gemini 3 Pro | 50 | Complex screens, high fidelity |
| Gemini 2.5 Flash | 350 | Fast iteration, exploration |

## MCP Integration

**Official endpoint**: `https://stitch.googleapis.com/mcp`

**Auth methods**:
- API Key (from Stitch Settings → API Key)
- gcloud OAuth (`gcloud beta services mcp enable stitch.googleapis.com`)

**MCP tools** (native):
- `list_projects`, `get_project`
- `generate_screen_from_text`
- `list_screens`, `get_screen`

**Proxy tools** (via `@_davideast/stitch-mcp`):
- `get_screen_code` — HTML/CSS of a screen
- `get_screen_image` — Screenshot as base64
- `build_site` — Map screens to routes → Astro project

## Export Options
- Copy to Figma (Auto Layout, named layers)
- View Code (HTML + TailwindCSS)
- Send to AI Studio
- Send to Antigravity

## Canvas Features
- Infinite canvas with AI-native design
- Voice commands for real-time design critiques
- Interactive prototypes ("Stitch" screens + Play)
- Design DNA extraction from screens
- URL-based design extraction
- Design agent that tracks project evolution
- DESIGN.md import/export

## Known Limitations
- Static UI only — no JS-heavy interactive pages
- Login-walled URLs fail design extraction
- Prompts > 5000 chars cause component omissions
- Multiple changes in one prompt = full redesign instead of edit
- Output is a starting point, not production code

## Third-Party MCP Servers
- `@_davideast/stitch-mcp` — Official community CLI + proxy (npm)
- `stitch-mcp` by kargatharaakash — OAuth-based (npm)
- Multiple community servers on PulseMCP

## Change Log
- 2026-04-09: Initial baseline created
