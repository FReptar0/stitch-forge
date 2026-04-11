---
name: forge-sync
description: >
  Sync local files with a Google Stitch project. Downloads all screens
  and updates local config. Use when the user has made changes in
  Stitch's web UI and wants to pull them into their local project.
---

Sync local files with a Google Stitch project.

## Instructions

1. **Find the project** to sync from:
   - If a project ID was provided as argument, use it
   - Otherwise, call `mcp__stitch__list_projects` and show available projects
   - Let the user pick which project to sync

2. **List all screens** in the project using `mcp__stitch__list_screens`.

3. **Show what will be synced**:
   ```
   Project: [name] ([id])
   Screens to sync: [count]
   - Screen Name 1
   - Screen Name 2
   ...
   ```

4. **Confirm** with the user before downloading.

5. **Download each screen** using `mcp__stitch__get_screen_code` and save the HTML to `screens/[screen-name].html`.

6. **Update `.forgerc.json`** with:
   - `projectId`: the synced project ID
   - `screens`: array of synced screen records (id, name, lastSynced timestamp)
   - `lastSync`: current timestamp

7. **Report results**:
   - How many screens were synced
   - Which files were created/updated in `screens/`
   - Any screens that failed to download

8. **Check for design system** using `mcp__stitch__list_design_systems`. If one exists and no local DESIGN.md is found, suggest running `/forge-design` to create one.

9. **Next step**: "Run `/forge-preview` to see synced screens."
