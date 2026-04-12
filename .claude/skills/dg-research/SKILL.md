---
name: dg-research
description: >
  Check for Google Stitch updates and refresh the local knowledge base.
  Use when the user asks "what's new with Stitch", "are there any updates",
  or wants to know about current Stitch capabilities, models, or quotas.
  Searches official docs, blogs, and forums.
---

Check for Google Stitch updates and refresh the local knowledge base.

## Instructions

1. **Search for recent Stitch updates** from these sources:
   - Google Stitch documentation (stitch.withgoogle.com)
   - Google AI blog posts about Stitch
   - Google AI developer forums discussing Stitch

2. **Compare findings** against the current known state in `src/research/known-state.json`. Check for:
   - New or changed AI models (names, quotas)
   - New export options
   - New or removed MCP tools
   - Changed limitations
   - New features or capabilities

3. **Report changes** with severity:
   - **Breaking**: Changes that affect existing workflows (model removed, tool renamed)
   - **Warning**: Changes that may affect usage (quota changes, new limitations)
   - **Info**: New features, improvements, blog posts

4. **If changes found**, update:
   - `src/research/known-state.json` with new data and current timestamp
   - `docs/known-state.md` with human-readable version

5. **If no changes**, report "Knowledge base is current" with the last update date.

6. **Always show** the current known state summary:
   - Available models and their monthly quotas
   - Available MCP tools
   - Known limitations

7. **Next step**: "Check if any changes affect your current project."
