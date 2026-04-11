---
name: forge-build
description: >
  Build a deployable site from generated Stitch screens. Use when the user
  wants to export, ship, publish, or turn their screens into a real website.
  Maps screens to routes and generates a static HTML, Astro, or Next.js project.
---

Build a deployable site from Stitch screens using a selected framework.

Supported frameworks: `static` (default, plain HTML), `astro` (Stitch MCP build_site), `nextjs` (App Router with static export). Ask the user which framework to use before building. Check `.forgerc.json` for a saved `framework` preference.

## Instructions

1. **List all projects** using `mcp__stitch__list_projects`. If multiple exist, ask the user which project to build from.

2. **List all screens** in the selected project using `mcp__stitch__list_screens`.

3. **Present the route mapping** to the user for confirmation:
   - The first screen or any screen named "home/landing/hero/main" maps to `/`
   - Other screens map to `/{screen-name-lowercase}`
   - Ask the user if they want to adjust any routes

4. **Show the mapping** clearly:
   ```
   Screen            Route
   Homepage      ->  /
   About Us      ->  /about-us
   Pricing       ->  /pricing
   Contact       ->  /contact
   ```

5. **Confirm** with the user before building.

6. **Retrieve screen code** for each screen using `mcp__stitch__get_screen_code` to get the HTML/CSS.

7. **Save all screen files** to the `screens/` directory.

8. **Explain next steps** clearly:
   - "Your site screens have been saved to the `screens/` folder"
   - "Each file contains the complete HTML/CSS for that page"
   - "You can open any `.html` file in your browser to preview it"

9. **Next step**: "Open the built site in your browser to review."

Do NOT output raw CLI commands like `cd dist && npm install`. Explain in plain language.
