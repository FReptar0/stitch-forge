# WS3: 3-Tier Integration Plan

## Objective

Wire the three anti-slop tiers together so they activate automatically at the right moments in the Design Guard workflow. The result: rules prevent slop during generation (Tier 1), a PostToolUse hook auto-lints HTML after writes (Tier 2), and `/dg-evaluate` provides deep opt-in review (Tier 3). Zero code changes to core or CLI -- all `.claude/` file additions.

**Purpose:** Connect the independent tiers into a seamless user experience where quality assurance is invisible until the user wants it.

**Output:** Hook script, updated dg-generate skill, new dg-evaluate skill, workflow documentation.

---

## Dependencies

| Workstream | What It Produces | WS3 Needs From It | Status |
|------------|------------------|--------------------|--------|
| WS1 (Rules) | `.claude/rules/` (4 files, ~470 lines) | Rules must exist so Tier 1 is active during generation | Researched, not yet built |
| WS2 (Evaluate) | Rubric design, scoring strategy | 6-axis rubric and calibration for dg-evaluate skill | Researched, not yet built |
| WS3 (This) | Hook, skill updates, dg-evaluate skill | -- | This plan |

**Execution order:** WS1 and WS2 can be built in parallel. WS3 depends on both being complete, since the hook references `dg lint` (already exists) and dg-evaluate needs the rubric from WS2.

**However:** The hook script and dg-generate update only depend on `dg lint` (which exists today). The dg-evaluate skill depends on WS2's rubric. So WS3 can be split into two waves:
- **Wave 1:** Hook script + dg-generate update (no WS1/WS2 dependency -- lint already works)
- **Wave 2:** dg-evaluate skill (depends on WS2 rubric design) + workflow docs (depends on everything)

---

## Task Breakdown

### Task 1: Create the PostToolUse lint hook and update dg-generate

**Files created/modified:**
- `.claude/hooks/lint-html.sh` (NEW)
- `.claude/skills/dg-generate/SKILL.md` (MODIFY)

**Action:**

1. Create `.claude/hooks/` directory.

2. Create `.claude/hooks/lint-html.sh` with this logic:
   - Read `tool_input.file_path` from stdin via `jq`
   - Skip non-HTML files (exit 0 if not `.html`)
   - Skip files outside `screens/` and `dist/` directories
   - Run `npx dg lint "$FILE_PATH" --format json 2>/dev/null`
   - Parse score and issue count from JSON output
   - Return JSON with `decision: "allow"`, `reason` containing score and issue summary, and `systemMessage` with brief score
   - Exit 0 on any error (hook must never block)

3. Make the script executable (`chmod +x`).

4. Update `.claude/skills/dg-generate/SKILL.md` with these targeted additions (do NOT rewrite the skill):

   a. Add `hooks:` block to the YAML frontmatter:
   ```yaml
   hooks:
     PostToolUse:
       - matcher: "Write"
         hooks:
           - type: command
             command: "$CLAUDE_PROJECT_DIR/.claude/hooks/lint-html.sh"
             statusMessage: "Checking design quality..."
             timeout: 30
   ```

   b. After current step 5 ("After generation, retrieve the screen code..."), add a new step 5b:
   ```
   5b. **Review lint results**: The PostToolUse hook automatically runs `dg lint` on
       the saved HTML file. If the score is below 70, review the issues and fix them
       before showing the preview. If the score is 70+, report it to the user.
   ```

   c. Update the existing step 11 ("Next step") to:
   ```
   11. **Next step**: Suggest "Run `/dg-evaluate` for deep design analysis, preview with `/dg-preview`, or generate another screen with `/dg-generate`"
   ```

   d. Add a brief note under Guardrails (as item 8):
   ```
   8. After saving HTML, the PostToolUse hook runs `dg lint` automatically.
      If lint reports errors (not warnings), fix the HTML and re-save before
      showing the preview to the user. This is the auto-correction loop.
   ```

**Verify:**

- `test -x .claude/hooks/lint-html.sh` confirms the hook is executable
- `echo '{"tool_input":{"file_path":"screens/test.html"}}' | .claude/hooks/lint-html.sh` runs without error (will output nothing if no file exists, which is correct)
- `echo '{"tool_input":{"file_path":"src/index.ts"}}' | .claude/hooks/lint-html.sh` produces no output (non-HTML skipped)
- `grep -q 'hooks:' .claude/skills/dg-generate/SKILL.md` confirms frontmatter hooks added
- `grep -q 'dg-evaluate' .claude/skills/dg-generate/SKILL.md` confirms evaluate reference added
- The dg-generate skill still has all original 11 steps intact (no steps removed)

**Done:**
- Hook script exists at `.claude/hooks/lint-html.sh`, is executable, filters to HTML files in screens/dist only
- dg-generate SKILL.md has skill-scoped PostToolUse hook in frontmatter
- dg-generate references the lint auto-correction loop and suggests /dg-evaluate as next step
- Existing skill behavior is preserved -- changes are additive only

---

### Task 2: Create the `/dg-evaluate` skill

**Files created:**
- `.claude/skills/dg-evaluate/SKILL.md` (NEW)
- `.claude/skills/dg-evaluate/rubric.md` (NEW)

**Action:**

1. Create `.claude/skills/dg-evaluate/` directory.

2. Create `SKILL.md` with this frontmatter:
   ```yaml
   ---
   name: dg-evaluate
   description: >
     Deep design evaluation of generated HTML screens. Use when the user
     wants to check if a page looks good, detect AI tells, or verify design
     quality beyond what static lint catches. Evaluates on 6 axes: design
     fidelity, visual distinction, content authenticity, layout intentionality,
     component craft, and coherence.
   disable-model-invocation: true
   allowed-tools:
     - Read
     - Bash
   ---
   ```

3. The SKILL.md instructions should follow this flow (total under 500 lines):

   **Step 1: Load context**
   - Read DESIGN.md from project root (required -- abort with helpful message if missing)
   - Read the target HTML file(s) from `$ARGUMENTS` (support single file or directory)
   - If no arguments, check `screens/` directory and list available files

   **Step 2: Run static analysis**
   - Execute `dg lint $ARGUMENTS --format json 2>/dev/null || echo '{"files":[],"summary":{"total":0}}'`
   - Parse the static lint score as the "structural quality" baseline
   - Note: this step connects Tier 2 into Tier 3

   **Step 3: Deep evaluation using rubric**
   - Read the rubric from `rubric.md` (supporting file in the skill directory)
   - Evaluate the HTML on 6 axes, citing specific HTML elements/CSS selectors as evidence:
     1. **Design Fidelity** -- Does output match DESIGN.md tokens (colors, fonts, spacing)?
     2. **Visual Distinction** -- Would someone know AI made this? (systemic sameness, template feel)
     3. **Content Authenticity** -- Is copy specific to the business, or generic placeholder?
     4. **Layout Intentionality** -- Does layout serve content hierarchy, or is it a template?
     5. **Component Craft** -- Are components designed with variation, or uniform defaults?
     6. **Coherence** -- Does the page work as a unified whole?
   - For each axis: find 2-3 specific elements, explain reasoning, score 1-5
   - Use devil's advocate prompting: "Before scoring, identify what a critical human designer would flag"

   **Step 4: Score and report**
   - Raw deep score: sum of 6 axes (6-30), normalized to 0-100
   - Combined score: (static_lint_score * 0.35) + (deep_score * 0.65)
   - Per-axis breakdown with evidence citations
   - Top 3 specific, actionable improvements
   - If combined score < 70: suggest specific `/dg-generate` refinement prompts

   **Step 5: Next steps**
   - If score >= 80: "Ready to build with `/dg-build`"
   - If score 60-79: "Consider these refinements with `/dg-generate`"
   - If score < 60: "Significant issues found. Address the top 3 improvements first."

4. Create `rubric.md` as a supporting file with:
   - Scoring rubric for each of the 6 axes (1-5 scale with descriptors)
   - Evidence requirements (must cite HTML elements, not make vague claims)
   - Calibration anchors (what a 1 looks like vs a 5 for each axis)
   - Devil's advocate instructions: "Before finalizing each axis score, argue for a score 1 point lower. Only keep your original score if you can rebut the argument."
   - Anti-self-preference bias instructions: "You may have generated this HTML. Evaluate as if reviewing someone else's work. Focus on what a human designer would flag."
   - Keep under 4000 tokens (must survive context compaction at 5000 token limit with SKILL.md header)

   Rubric axis detail:

   **Design Fidelity (1-5):**
   - 1: No DESIGN.md tokens present (wrong colors, wrong fonts, wrong spacing)
   - 3: Most tokens present but some drift (close hex values, similar but not specified fonts)
   - 5: Exact DESIGN.md compliance (all hex values match, fonts match, spacing follows scale)

   **Visual Distinction (1-5):**
   - 1: Immediately recognizable as AI-generated (purple gradient, Inter font, 3-card grid, glassmorphism)
   - 3: Some AI tells but overall passes casual inspection
   - 5: Indistinguishable from human-designed page (unique layout choices, intentional asymmetry)

   **Content Authenticity (1-5):**
   - 1: Generic placeholder copy ("Lorem ipsum", "Your Company", "Feature 1")
   - 3: Business-relevant but generic ("We offer the best solutions for your needs")
   - 5: Specific, factual, business-contextual copy referencing real products/services

   **Layout Intentionality (1-5):**
   - 1: Template layout (hero -> 3 features -> testimonials -> CTA -> footer)
   - 3: Some layout variation but still recognizable template structure
   - 5: Layout clearly serves content hierarchy (varied section widths, intentional whitespace, content-driven grid)

   **Component Craft (1-5):**
   - 1: All components identical (same border-radius, same shadow, same padding, same size)
   - 3: Some variation but uniform treatment dominates
   - 5: Components are individually designed (varied sizes, treatments, hover states)

   **Coherence (1-5):**
   - 1: Sections feel disconnected (different visual language per section)
   - 3: Generally consistent but with jarring transitions
   - 5: Unified visual flow from top to bottom, transitions feel intentional

**Verify:**

- `test -f .claude/skills/dg-evaluate/SKILL.md` confirms skill file exists
- `test -f .claude/skills/dg-evaluate/rubric.md` confirms rubric exists
- `grep -q 'disable-model-invocation: true' .claude/skills/dg-evaluate/SKILL.md` confirms opt-in only
- `grep -q 'dg lint' .claude/skills/dg-evaluate/SKILL.md` confirms static lint integration
- `wc -l .claude/skills/dg-evaluate/SKILL.md` is under 200 lines
- `wc -l .claude/skills/dg-evaluate/rubric.md` is under 150 lines
- SKILL.md references all 6 evaluation axes
- rubric.md includes devil's advocate and anti-self-preference instructions
- Format matches existing skills (YAML frontmatter with `---`, markdown body)

**Done:**
- `/dg-evaluate` skill exists with 6-axis evaluation rubric
- Skill runs `dg lint` as part of evaluation (connects Tier 2 and Tier 3)
- Rubric includes bias mitigation (devil's advocate, anti-self-preference)
- Combined scoring formula: 35% static + 65% deep
- Actionable improvement suggestions reference `/dg-generate` for fixes
- Skill is opt-in only (disable-model-invocation: true)

---

### Task 3: End-to-end workflow documentation and integration verification

**Files created:**
- `.claude/skills/dg-generate/workflow-reference.md` (NEW -- supporting file for dg-generate)

**Action:**

1. Create a workflow reference document at `.claude/skills/dg-generate/workflow-reference.md` that serves as a supporting file for the generate skill. This documents the complete 3-tier pipeline for both Claude (skill context) and users (readable reference).

   Structure:
   ```markdown
   # Design Guard: 3-Tier Quality Pipeline

   ## Tier Activation Map

   | Workflow Step | Tier 1 (Rules) | Tier 2 (Lint) | Tier 3 (Evaluate) |
   |--------------|----------------|---------------|-------------------|
   | Session start | Loaded automatically | -- | -- |
   | /dg-discover | Active (prevents slop in DESIGN.md) | -- | -- |
   | /dg-design | Active (prevents slop in DESIGN.md) | -- | -- |
   | /dg-generate | Active (prevents slop in HTML) | Auto via PostToolUse hook | -- |
   | Auto-fix loop | Active | Auto via hook (re-runs on each fix) | -- |
   | /dg-evaluate | Active (background) | Called by skill (static baseline) | Explicit (deep review) |
   | /dg-build | Active (background) | Called by build skill | Optional |

   ## Complete Flow: Business Brief to Production

   1. Start Claude Code session (rules load automatically)
   2. /dg-discover [business] -- research and generate DESIGN.md
   3. /dg-generate [screen description] -- generate HTML
      - Rules prevent slop during generation
      - PostToolUse hook auto-lints the HTML
      - If score < 70, Claude auto-fixes and hook re-runs
      - If score >= 70, Claude reports score
   4. /dg-evaluate screens/[file].html -- (optional) deep quality review
      - Runs static lint for baseline score
      - Evaluates on 6 axes with evidence
      - Suggests specific refinements
   5. /dg-build -- build deployable site from screens

   ## Auto-Correction Loop (Tier 2)

   The PostToolUse hook on dg-generate creates an automatic feedback loop:

   1. Claude writes HTML to screens/[name].html
   2. Hook runs `dg lint` in JSON format
   3. Hook feeds score + issues back as context
   4. If errors found, Claude fixes and re-writes
   5. Hook fires again on the re-write
   6. Loop continues until clean or max 3 iterations

   The user sees: "Screen generated. Score: 85/100."
   The loop is invisible unless issues require user input.

   ## Standalone CLI (Outside Claude Code)

   When running outside Claude Code, the existing CLI commands provide equivalent coverage:
   - `dg lint screens/` -- runs all 18 static rules
   - `dg lint dist/ --format sarif` -- CI/CD integration
   - `dg workflow redesign --url [url]` -- full pipeline with generateWithRetry

   Tier 1 (rules) and Tier 3 (evaluate) are Claude Code-only features.
   Tier 2 (static lint) works everywhere.
   ```

2. Verify the complete integration does not break existing functionality:
   - Confirm `dg lint` still works standalone: `npx dg lint --help`
   - Confirm existing skills are unchanged: diff dg-build, dg-discover, dg-design, dg-preview, dg-research, dg-sync against their current state (only dg-generate should differ)
   - Confirm the hook script handles edge cases: no jq installed (graceful exit), empty stdin, malformed JSON

3. Add edge case handling to the hook script if not already present:
   - If `jq` is not installed, exit 0 silently (hook must never block)
   - If `dg lint` is not installed/fails, exit 0 silently
   - If the lint output is malformed, exit 0 silently

**Verify:**

- `test -f .claude/skills/dg-generate/workflow-reference.md` confirms workflow doc exists
- `npx dg lint --help` still works (no breaking changes to CLI)
- `diff <(git show HEAD:.claude/skills/dg-build/SKILL.md) .claude/skills/dg-build/SKILL.md` shows no changes to unmodified skills
- The hook script handles missing jq: `echo '{}' | PATH="" .claude/hooks/lint-html.sh` exits 0
- All 8 skills exist: dg-build, dg-design, dg-discover, dg-evaluate, dg-generate, dg-preview, dg-research, dg-sync

**Done:**
- Workflow documentation exists as a supporting file in dg-generate
- Integration verified: lint still works standalone, unmodified skills unchanged
- Hook script handles edge cases gracefully (never blocks, exits 0 on any error)
- The complete flow is documented: discover -> design -> generate (rules + hook) -> evaluate -> build
- All three tiers activate at the correct moments

---

## Wave Structure

| Wave | Task | Can Parallel With | Depends On |
|------|------|-------------------|------------|
| 1 | Task 1 (Hook + dg-generate update) | Nothing (start here) | dg lint exists (it does) |
| 1 | Task 2 (dg-evaluate skill) | Task 1 | WS2 rubric design (from research) |
| 2 | Task 3 (Workflow docs + verification) | Nothing | Tasks 1 and 2 complete |

Tasks 1 and 2 are independent (different files, no shared state) and can execute in parallel. Task 3 verifies the integration after both are complete.

---

## Integration Test Plan

After all tasks are complete, run these tests to verify the full pipeline:

### Test 1: Hook fires on HTML write
```bash
# Create a test HTML file
echo '<html><body><h1>Test</h1></body></html>' > screens/test-hook.html

# Simulate hook input (what Claude Code sends)
echo '{"tool_input":{"file_path":"screens/test-hook.html"}}' | .claude/hooks/lint-html.sh

# Expected: JSON output with decision, reason containing score, systemMessage
# Clean up
rm screens/test-hook.html
```

### Test 2: Hook skips non-HTML files
```bash
echo '{"tool_input":{"file_path":"src/index.ts"}}' | .claude/hooks/lint-html.sh
# Expected: no output, exit 0
```

### Test 3: Hook skips HTML outside screens/dist
```bash
echo '{"tool_input":{"file_path":"docs/guide.html"}}' | .claude/hooks/lint-html.sh
# Expected: no output, exit 0
```

### Test 4: dg lint still works standalone
```bash
npx dg lint --help
# Expected: help output, exit 0

# If screens/ has HTML files from dogfood:
npx dg lint public/demos/ --format json
# Expected: JSON with scores
```

### Test 5: Full pipeline (manual, inside Claude Code)
1. Start a Claude Code session in the project directory
2. Verify rules load (check with `/cost` or observe Claude's behavior)
3. Run `/dg-generate "A simple landing page for a coffee shop"`
4. Observe: hook should auto-lint the generated HTML
5. Run `/dg-evaluate screens/[generated-file].html`
6. Observe: static lint score + 6-axis deep evaluation
7. Run `/dg-build` to verify build still works

### Test 6: Compare against dogfood (regression)
```bash
# Run lint on existing dogfood demos
npx dg lint public/demos/dogfood-v2/ --format json
npx dg lint public/demos/dogfood-stitch-v2/ --format json

# These should produce scores consistent with pre-integration results
# No scoring changes expected (lint rules are unchanged)
```

---

## Files Changed Summary

| File | Change | Lines |
|------|--------|-------|
| `.claude/hooks/lint-html.sh` | NEW | ~35 |
| `.claude/skills/dg-generate/SKILL.md` | MODIFY | ~15 lines added |
| `.claude/skills/dg-evaluate/SKILL.md` | NEW | ~150 |
| `.claude/skills/dg-evaluate/rubric.md` | NEW | ~120 |
| `.claude/skills/dg-generate/workflow-reference.md` | NEW | ~60 |

**Total: ~380 lines of markdown and bash. Zero TypeScript. Zero npm dependencies.**

---

## What This Plan Does NOT Include

- `.claude/rules/` files (WS1 scope -- separate plan)
- Rubric calibration against real pages (post-build validation)
- `--deep` flag on CLI `dg lint` command (future enhancement, needs API SDK)
- Automatic `/dg-evaluate` invocation (deliberately opt-in per research)
- Changes to `@design-guard/core` or `packages/cli/` (zero code changes confirmed)
- Global hooks in `.claude/settings.json` (using skill-scoped hooks instead)
