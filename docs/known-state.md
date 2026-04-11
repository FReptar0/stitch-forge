# Stitch — Known State

**Last Updated**: 2026-04-11

## AI Models

| Model | Monthly Quota | Use Case |
|-------|--------------|----------|
| Gemini 3 Pro | 200 | Complex screens, high fidelity, image input |
| Gemini 2.5 Flash | 350 | Fast iteration, exploration |

## MCP Integration

**Official endpoint**: `https://stitch.googleapis.com/mcp`

**Auth methods**:
- API Key (from Stitch Settings → API Key)
- gcloud OAuth (`gcloud beta services mcp enable stitch.googleapis.com`)
- System gcloud (`STITCH_USE_SYSTEM_GCLOUD=1`)

**MCP tools** (native):
- `list_projects`, `get_project`, `create_project`
- `generate_screen_from_text`, `edit_screens`, `generate_variants`
- `list_screens`, `get_screen`
- `list_design_systems`, `create_design_system`, `update_design_system`, `apply_design_system`

**Proxy tools** (via `@_davideast/stitch-mcp`):
- `get_screen_code` — HTML/CSS of a screen
- `get_screen_image` — Screenshot as base64
- `build_site` — Map screens to routes → Astro project

## Export Options
- Copy to Figma (Auto Layout, named layers) — **NOT available in Pro/Experimental mode**
- View Code (HTML + TailwindCSS)
- Send to AI Studio
- Send to Antigravity

## Canvas Features
- AI-native infinite canvas
- Voice canvas — speak to the canvas, AI asks clarifying questions
- Vibe design — describe business objective/feeling instead of exact components
- 5-screen canvas — generate up to 5 interconnected screens simultaneously
- Direct edits — manually tweak text, swap images, adjust spacing
- Interactive prototypes ("Stitch" screens + Play)
- Design DNA extraction from screens
- URL-based design extraction
- Screen stitching — combine multiple screens into cohesive flows
- Design agent that tracks project evolution
- DESIGN.md import/export

## Official SDK & Skills
- `@google/stitch-sdk` — Programmatic TypeScript API (github.com/google-labs-code/stitch-sdk)
- `google-labs-code/stitch-skills` — 7 agent skills:
  - `stitch-design` — unified entry: prompt enhancement + design system synthesis
  - `stitch-loop` — generate complete multi-page websites from single prompt
  - `design-md` — produce DESIGN.md from existing projects
  - `enhance-prompt` — refine vague ideas into Stitch-optimized prompts
  - `react-components` — transform screens into React component systems
  - `remotion` — create walkthrough videos from Stitch projects
  - `shadcn-ui` — integrate shadcn/ui components

## Known Limitations
- Static UI only — no JS-heavy interactive pages
- Login-walled URLs fail design extraction
- Prompts > 5000 chars cause component omissions
- Multiple changes in one prompt = full redesign instead of edit
- Output is a starting point, not production code
- Precision control limited — positional instructions interpreted variably
- Repetitive layouts — defaults to limited set of layout structures
- WCAG accessibility — frequently fails compliance
- Not responsive by default — manual adaptation needed
- Figma export unavailable in Pro/Experimental mode

## Third-Party MCP Servers
- `@_davideast/stitch-mcp` — Community CLI + proxy (npm, 766 stars)
- `stitch-mcp` by kargatharaakash — OAuth-based (npm)

## Change Log
- 2026-04-11: Updated Pro quota to 200, added new MCP tools, features, SDK/skills references, expanded limitations
- 2026-04-09: Initial baseline created
