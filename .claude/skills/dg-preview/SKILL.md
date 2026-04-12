---
name: dg-preview
description: >
  Preview generated Stitch screens. Use when the user says "show me the
  page", "what does it look like", or wants to see a screenshot of a
  screen they generated. Displays screen images inline or opens HTML
  files in the browser.
---

Preview generated Stitch screens.

## Instructions

1. **Check for screens** in the `screens/` directory. If none exist, tell the user to run `/dg-generate` first.

2. **If a screen name was provided as argument**, find the matching `.html` file in `screens/`.

3. **If no argument**, list available screens and ask the user which one to preview.

4. **Get the screen image** by calling `mcp__stitch__get_screen_image` with the project ID and screen ID from `.guardrc.json`. This returns a base64-encoded PNG.

5. **Display the image inline** so the user can see the screen preview directly in the conversation.

6. **Also mention** that the user can open the HTML file in their browser: "You can also open `screens/{name}.html` in your browser for a full interactive preview."

7. **Next step**: "Refine with `/dg-generate` or build with `/dg-build`"
