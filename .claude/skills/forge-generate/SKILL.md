---
name: forge-generate
description: >
  Generate a screen in Google Stitch from a text description. Use when
  the user wants to create a new web page, landing page, dashboard,
  pricing page, about page, or any UI design. Also use when the user
  says "design a page", "create a screen", or "build a webpage".
  Uses DESIGN.md if available for visual consistency.
---

Generate a screen in Google Stitch from a description.

## Guardrails (MUST follow)

Before sending any prompt to Stitch:
1. Verify prompt is under 5000 characters
2. Verify prompt targets ONE screen only (not multiple pages)
3. For refinements: verify ONE change only (not compound changes)
4. Reject vague requests ("make it better", "improve it") — ask for specifics
5. Check quota before generating: read `.forgerc.json` to see current usage
6. If DESIGN.md exists, reference it for visual consistency
7. Flag generic terms ("modern", "clean", "professional") and suggest specific UI/UX vocabulary replacements (e.g., "asymmetric hero layout", "bento grid", "sticky nav with CTA")

## Instructions

1. **Read DESIGN.md** if it exists at the project root. Use it as context for visual consistency.

2. **Guide the user** through building a good prompt using the zoom-out-zoom-in framework:

   **Zoom out (context ~30%):**
   - Product name and what it does
   - Target user/audience
   - Overall aesthetic direction

   **Zoom in (specifics ~70%):**
   - Page type (landing page, dashboard, pricing, about, contact, etc.)
   - Goal of this screen
   - Each section with specific descriptions
   - UI patterns: "bento grid", "sticky header", "card layout"
   - Specific numbers: "3 pricing tiers", "4 testimonials"

3. **Build the prompt** following this structure:
   ```
   A [adjective] [page type] for "[Product Name]," a [product description].
   Designed for [target user]. [Visual tone].

   Include these sections:
   1. [Section with brief description]
   2. [Section with brief description]
   ...
   ```

4. **Generate the screen** by calling `mcp__stitch__generate_screen_from_text` with the prompt.

5. **After generation**, retrieve the screen code and save the HTML to `screens/[screen-name].html`.

6. **Preview the screen** after saving:
   - Call `mcp__stitch__get_screen_image` with the project ID and screen ID to get a base64 PNG.
   - Display the image inline so the user can see the result immediately.

7. For **refinements**, use this structure (one change at a time):
   ```
   On the [specific section] of [screen name], [specific change]:
   - [Detail 1]
   - [Detail 2]
   ```

8. If generating multiple screens for a project, prefix subsequent prompts with:
   "Following the same design language as the homepage..."

9. For **variants**, offer to call `mcp__stitch__generate_variants` to produce 2-3 alternative designs the user can compare before committing to one direction.

10. For **inline edits** to an existing screen, use `mcp__stitch__edit_screens` instead of regenerating from scratch.

11. **Next step**: Suggest "Preview with `/forge-preview` or generate another screen with `/forge-generate`"

Reference: See `docs/prompting-guide.md` for examples and strategies.
