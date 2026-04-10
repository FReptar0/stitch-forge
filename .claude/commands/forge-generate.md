Generate a screen in Google Stitch from a description.

## Instructions

1. **Read DESIGN.md** if it exists at the project root. Use it as context for visual consistency.

2. **Guide the user** through building a good prompt using the zoom-out-zoom-in framework:

   **Zoom out (context):**
   - Product name and what it does
   - Target user/audience
   - Overall aesthetic direction

   **Zoom in (specifics):**
   - Page type (landing page, dashboard, pricing, about, contact, etc.)
   - Goal of this screen
   - Key sections with brief descriptions

3. **Build the prompt** following this structure:
   ```
   A [adjective] [page type] for "[Product Name]," a [product description].
   Designed for [target user]. [Visual tone].

   Include these sections:
   1. [Section with brief description]
   2. [Section with brief description]
   ...
   ```

4. **Apply guardrails** before sending:
   - Max 5000 characters (longer prompts cause Stitch to omit components)
   - One screen per prompt only
   - One change per refinement
   - No vague requests ("make it better" -- specify exactly what and how)
   - Use UI/UX vocabulary: "bento grid", "sticky header", "card layout"

5. **For refinements** of an existing screen, use this structure:
   ```
   On the [specific section] of [screen name], [specific change]:
   - [Detail 1]
   - [Detail 2]
   ```

6. **Generate the screen** by calling `mcp__stitch__generate_screen_from_text` with the prompt.

7. **After generation**, retrieve the screen code and save the HTML to `screens/[screen-name].html`.

8. If generating multiple screens for a project, prefix subsequent prompts with:
   "Following the same design language as the homepage..."

Reference: See `docs/prompting-guide.md` for examples and common mistakes.
