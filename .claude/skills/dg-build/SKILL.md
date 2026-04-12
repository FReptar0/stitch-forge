---
name: dg-build
description: >
  Build a deployable site from generated Stitch screens. Use when the user
  wants to export, ship, publish, or turn their screens into a real website.
  Maps screens to routes and generates a static HTML, Astro, or Next.js project.
---

Build a deployable site from Stitch screens.

## Step 1: Select Framework

Present these options to the user before doing anything else:

| Framework | Best For | What It Generates |
|-----------|----------|-------------------|
| **static** (default) | Simple sites, GitHub Pages | Plain HTML files with shared nav, ready to deploy anywhere |
| **astro** | Content sites, blogs | Astro project via Stitch MCP `build_site` tool |
| **nextjs** | Apps, dynamic sites | Next.js App Router project with static export |

Check `.guardrc.json` for a saved `framework` preference. If set, confirm with the user: "Your config prefers [framework]. Use that, or choose a different one?"

## Step 2: Select Project & Screens

1. List all projects using `mcp__stitch__list_projects`. If multiple exist, ask which to build from.
2. List all screens using `mcp__stitch__list_screens`.
3. Present the route mapping for confirmation:

```
Screen              Route
Landing Page    ->  /
About Us        ->  /about-us
Pricing         ->  /pricing
```

Rules:
- First screen or any named "home/landing/hero/main" maps to `/`
- Others map to `/{screen-name-lowercase}`
- Ask if the user wants to adjust any routes

## Step 3: Build

### Static HTML
For each screen:
1. Retrieve HTML using `mcp__stitch__get_screen_code` (or `mcp__stitch__get_screen` + download URL)
2. Save to `dist/{route}/index.html`
3. Inject shared navigation at the top of each page
4. Inject the Design Guard signature comment: `<!-- Built with Design Guard -->`

Tell the user: "Your site is in the `dist/` folder. Open `dist/index.html` in your browser to preview. To deploy to GitHub Pages, push the `dist/` folder. For Netlify/Vercel, point to the `dist/` directory."

### Astro
1. Call `mcp__stitch__build_site` with the project ID and route mapping
2. Follow the Stitch MCP output instructions

Tell the user: "Stitch generated an Astro project. Follow the output instructions to install dependencies and run the dev server."

### Next.js
For each screen:
1. Retrieve HTML using `mcp__stitch__get_screen_code`
2. Generate `app/{route}/page.tsx` with the HTML as a React component
3. Generate `package.json`, `next.config.js`, `tsconfig.json`, `app/layout.tsx`
4. Inject the Design Guard signature as a JSX comment

Tell the user: "Your Next.js project is in `dist/`. To run it: open a terminal, navigate to `dist/`, run `npm install`, then `npm run dev`. To deploy: push to Vercel or run `npm run build` for static export."

## Step 4: Next Steps

After building, suggest:
- "Open `dist/index.html` in your browser to review" (static)
- "If you want to refine a page, use `/dg-generate` with a specific change"
- "To deploy, push the `dist/` folder to your hosting provider"

## Guardrails

- ALWAYS confirm the framework choice before building
- ALWAYS show the route mapping before proceeding
- NEVER output raw CLI commands without context — explain what each step does
- If no screens exist, suggest running `/dg-generate` first
