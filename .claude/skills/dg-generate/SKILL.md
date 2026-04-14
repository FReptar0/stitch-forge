---
name: dg-generate
description: >
  Generate a screen using Google Stitch or Claude Code from a text description. Use when
  the user wants to create a new web page, landing page, dashboard,
  pricing page, about page, or any UI design. Also use when the user
  says "design a page", "create a screen", or "build a webpage".
  Requires DESIGN.md for visual consistency — blocks generation if missing.
---

Generate a screen from a description using the configured generator (Stitch or Claude Code).

## Guardrails (MUST follow)

Before sending any prompt to Stitch:
1. Verify prompt is under 5000 characters
2. Verify prompt targets ONE screen only (not multiple pages)
3. For refinements: verify ONE change only (not compound changes)
4. Reject vague requests ("make it better", "improve it") — ask for specifics
5. Check quota before generating: read `.guardrc.json` to see current usage
6. DESIGN.md is required — step 1 blocks generation if missing
7. Flag generic terms ("modern", "clean", "professional") and suggest specific UI/UX vocabulary replacements (e.g., "asymmetric hero layout", "bento grid", "sticky nav with CTA")

## Instructions

0. **Generator selection (MUST run before generating)**:
   - Read `.guardrc.json` and check the `generator` field.
   - **IF `generator` is already set** (value is `"stitch"` or `"claude"`):
     - Use it. Tell the user: "Using **[Stitch MCP / Claude Code]** as your configured generator."
     - Do NOT ask again.
   - **IF `generator` is NOT set** (field missing or `.guardrc.json` does not exist):
     - Present the options to the user:

       "Which generator would you like to use for this project?

       1. **Claude Code** (recommended) -- Generates HTML locally. Anti-slop rules from `.claude/rules/` are enforced during generation. Best for design-system compliance.
       2. **Google Stitch** -- Generates via Stitch MCP. More creative/varied layouts, but anti-slop rules do NOT apply during generation (the critic catches issues after).

       Which do you prefer? (Default: Claude Code)"

     - If the user picks Claude Code (or does not express a preference): set `generator` to `"claude"`.
     - If the user picks Stitch: set `generator` to `"stitch"`.
     - Save the choice to `.guardrc.json` by updating the `generator` field (create file with defaults if it does not exist).
     - Tell the user: "Saved generator preference to .guardrc.json. You can change it anytime by editing the file or telling me to switch."

1. **Read DESIGN.md (REQUIRED)**:
   - Read DESIGN.md from the project root.
   - **IF DESIGN.md does NOT exist: STOP.** Do NOT create one inline. Do NOT proceed with generation.
     - Tell the user: "No DESIGN.md found. A design system is required before generating screens. Run `/dg-design` to create one (or `/dg-discover` first if this is for a real business)."
     - Do NOT offer to create DESIGN.md within this skill. The user MUST use `/dg-design` which has context isolation and discover checks.
   - IF DESIGN.md exists: use it as context for visual consistency. Extract colors, fonts, spacing, and component patterns.

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

4. **Generate the screen**:
   - **IF generator is `stitch`**:
     - **Model selection**: Before generating, read `packages/cli/src/research/known-state.json` to check available models. Use ONLY non-deprecated models:
       - **GEMINI_3_FLASH** (350/month quota) — default for fast iteration and standard screens
       - **GEMINI_3_1_PRO** (200/month quota) — use for high-quality hero pages or when the user explicitly requests best quality
       - Do NOT use GEMINI_3_PRO or GEMINI_2_5_FLASH — these are deprecated and may produce inferior results or fail
     - Call `mcp__stitch__generate_screen_from_text` with the prompt, the selected model, and the Stitch project ID from `.guardrc.json`.
   - **IF generator is `claude`**: Generate a complete, single-file HTML page directly. Follow these constraints:
     - Apply ALL rules from `.claude/rules/anti-slop-design.md`
     - Apply ALL rules from `.claude/rules/design-system-adherence.md`
     - Apply ALL rules from `.claude/rules/content-authenticity.md`
     - Follow DESIGN.md for all color, typography, spacing, and component decisions
     - Use the zoom-out-zoom-in prompt structure from step 3 as the page specification
     - Output a complete HTML file with embedded CSS (no external dependencies except Google Fonts)
     - Run the self-check from `.claude/rules/post-generation-evaluation.md` before presenting

5. **After generation**, retrieve the screen code and save the HTML to `screens/[screen-name].html`.

6. **Post-generation quality gate**: After saving the HTML, run the `dg-critic` agent to check quality:
   - The critic runs static lint + 5 quick pattern checks (identical cards, gradient text, button hierarchy, palette compliance, content truth).
   - If the critic returns **FAIL**: show the issues, attempt one automatic fix pass using the critic's suggestions as a refinement prompt, then re-lint. If still failing, present both versions to the user with the issues noted.
   - If the critic returns **WARN**: show the warnings but proceed to preview.
   - If the critic returns **PASS**: proceed to preview.
   - The anti-slop rules in `.claude/rules/` prevent issues in Claude-generated HTML, but Stitch output is NOT influenced by rules — the critic catches what rules cannot.

7. **Preview the screen** after saving:
   - Call `mcp__stitch__get_screen_image` with the project ID and screen ID to get a base64 PNG.
   - Display the image inline so the user can see the result immediately.

8. For **refinements**, use this structure (one change at a time):
   ```
   On the [specific section] of [screen name], [specific change]:
   - [Detail 1]
   - [Detail 2]
   ```

9. **Multi-screen requests — SEQUENTIAL ONLY**:
   When the user asks to generate multiple screens (e.g., "create a landing page, about page, and pricing page"), generate them **ONE AT A TIME**. Follow this sequence for each screen:
   1. Build the prompt for screen N
   2. Generate screen N (Stitch or Claude)
   3. Save to `screens/`
   4. Run the critic on screen N
   5. Fix any issues the critic flags
   6. **Wait for the full cycle to complete** before starting screen N+1

   **NEVER send multiple generation requests in parallel** — this causes cascading timeouts on Stitch and wastes quota when screens fail. If Stitch is already timing out on one request, sending more will make it worse.

   For subsequent screens, prefix prompts with:
   "Following the same design language as the homepage..."

10. For **variants**, offer to call `mcp__stitch__generate_variants` to produce 2-3 alternative designs the user can compare before committing to one direction.

11. For **inline edits** to an existing screen, use `mcp__stitch__edit_screens` instead of regenerating from scratch.

12. **Next step**: Based on the critic verdict, provide context-aware guidance:
    - **If PASS**: "Screen passes quality gate. Preview with `/dg-preview`, deep-evaluate with `/dg-evaluate`, or generate another screen."
    - **If WARN**: "Screen has minor issues. Run `/dg-evaluate` for detailed analysis, or refine with `/dg-generate` targeting the flagged issues."
    - **If FAIL**: "Screen needs work. Use the suggested refinement prompt above, or run `/dg-evaluate` for a full breakdown."
    - Always show quota status: "Quota: Flash {used}/{limit}, Pro {used}/{limit}"

## Error Handling

### Stitch Timeout Recovery

IF a Stitch MCP call (`mcp__stitch__generate_screen_from_text`) times out, hangs, or returns an error:

1. **Do NOT silently switch to Claude Code generation.** The user chose Stitch and must be informed.
2. **Auto-check if the screen completed server-side**: Stitch often completes generation even when the MCP response times out. Immediately call `mcp__stitch__list_screens` to check if the screen was created despite the timeout.
   - **IF the screen IS found**: download it via `mcp__stitch__get_screen` and `get_screen_code`, save to `screens/`, and tell the user: "Stitch timed out but the screen completed server-side. Downloaded to screens/[name].html." Proceed to the critic step as normal.
   - **IF the screen is NOT found**: continue to step 3.
3. Tell the user exactly what happened: "Stitch MCP timed out while generating [screen name] and the screen was not completed server-side."
4. **Offer options** (do NOT pick one silently):
   - "Would you like me to generate this screen locally with Claude Code instead? (Anti-slop rules will be enforced during generation.)"
   - "Or run `/dg-sync` later to check again if it appears."
5. Generate locally with Claude Code ONLY if the user explicitly agrees.
6. **NEVER**:
   - Retry the Stitch call (the timeout suggests a server-side issue)
   - Send parallel requests to Stitch
   - Generate locally without asking
   - Pretend the timeout didn't happen

### Claude Code Generation Errors

IF generating locally with Claude Code and the output is incomplete or malformed:
1. Tell the user what went wrong.
2. Offer to retry generation.
3. Do NOT switch to Stitch as a fallback.

Reference: See `docs/prompting-guide.md` for examples and strategies.
