# Phase 2: Context Isolation - Research

**Researched:** 2026-04-12
**Domain:** Claude Code skill context management, CLAUDE.md contamination prevention
**Confidence:** HIGH

## Summary

Phase 2 fixes the P1 context isolation bug: when `/dg-design` generates a DESIGN.md for a DIFFERENT business (e.g., Estresso cafe) while running inside the Design Guard repo, CLAUDE.md project context bleeds into the generated DESIGN.md. The result is a cafe DESIGN.md that includes "Open source design intelligence library", "13 CLI commands", "238 tests", and "NOT a SaaS -- no pricing, no signups" -- all Design Guard data, not cafe data.

The root cause is architectural: CLAUDE.md is loaded into Claude's context at session start (as a `system-reminder` with "These instructions OVERRIDE any default behavior"). Every subsequent skill invocation sees this context. The `/dg-design` and `/dg-discover` skills have no instruction to distinguish between "host project context" and "target business context." When generating content about a different business, Claude unconsciously draws from its strongest context signals -- the CLAUDE.md project description.

**Primary recommendation:** Add explicit context isolation instructions to both `/dg-design` and `/dg-discover` SKILL.md files. These instructions must clearly tell Claude to separate "host project" (Design Guard) from "target business" (whatever the user asked about). The `context: fork` frontmatter option exists but does NOT solve this because forked skills still load CLAUDE.md (confirmed by official docs). The fix is prompt-level, not architecture-level.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CI-01 | Isolate brand brief from host project context in dg-design | CLAUDE.md contamination analysis identifies 4 specific sections that bleed; skill needs explicit isolation preamble |
| CI-02 | Mark target business vs host project clearly in dg-discover output | dg-discover already structures output well but needs explicit "this is for [TARGET], not for Design Guard" framing |

</phase_requirements>

## Standard Stack

### Core (no new dependencies)

| Component | Location | Purpose | Notes |
|-----------|----------|---------|-------|
| dg-design SKILL.md | `.claude/skills/dg-design/SKILL.md` | Design system generation skill | Needs context isolation preamble |
| dg-discover SKILL.md | `.claude/skills/dg-discover/SKILL.md` | Business research skill | Needs target/host disambiguation |
| CLAUDE.md | `CLAUDE.md` (project root) | Project development guide | CANNOT be modified (constraint) |

### No New Dependencies

All fixes are to SKILL.md markdown files. No `npm install` needed. No new TypeScript code.

## Architecture Patterns

### How CLAUDE.md Context Enters the Session

Claude Code builds its context dynamically. CLAUDE.md is loaded as a `system-reminder` attached to conversation messages. The model treats it as high-priority context because it carries the label "These instructions OVERRIDE any default behavior and you MUST follow them exactly as written."

**Context loading order:**
1. Claude Code system prompt (built-in)
2. CLAUDE.md content (injected as `system-reminder` in messages)
3. `.claude/rules/*.md` files (loaded when relevant)
4. Skill content (loaded when skill is invoked)

Source: [How Claude Code Builds a System Prompt](https://www.dbreunig.com/2026/04/04/how-claude-code-builds-a-system-prompt.html)

### Why `context: fork` Does NOT Solve This

The official Claude Code documentation provides this table for skills with `context: fork`:

| Approach | System prompt | Task | Also loads |
|----------|--------------|------|------------|
| Skill with `context: fork` | From agent type (Explore, Plan, etc.) | SKILL.md content | **CLAUDE.md** |

Source: [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)

Even in a forked context, CLAUDE.md is still loaded. This means `context: fork` gives conversation history isolation but NOT project context isolation. The skill still sees "Design Guard is a design intelligence CLI and library for AI-generated web design."

**Implication:** The fix MUST be at the prompt instruction level inside SKILL.md, not at the infrastructure level.

### Exactly Which CLAUDE.md Sections Cause Contamination

Analysis of CLAUDE.md against the dogfood contamination symptoms:

| CLAUDE.md Section | Content That Bleeds | Contamination Symptom in DESIGN.md |
|-------------------|--------------------|------------------------------------|
| **Project Overview** (lines 3-10) | "Design Guard is a design intelligence CLI and library for AI-generated web design" | Business Model says "Open source design intelligence library" instead of "cafe" |
| **Slash Commands** (lines 117-140) | Lists `/dg-design`, `/dg-generate`, `/dg-build`, etc. with descriptions | Key Stats include "13 CLI commands" |
| **Testing Strategy** (lines 267-282) | "Run all: `npm test`" and testing details | Key Stats include "238 tests" |
| **DESIGN.md Specification** (lines 205-225) | 8-section spec with validation rules | Minor: tends to enforce the spec format rather than adapt to business |

**Most dangerous sections** (in contamination order):
1. **Project Overview** -- directly states what Design Guard IS, which becomes the business model
2. **Slash Commands** -- provides feature inventory that becomes "Key Stats"
3. **known-state.json** section -- technical details that bleed into content

**Sections that DON'T contaminate** (they're about HOW to develop, not WHAT Design Guard IS):
- Conventions
- Development Workflow
- Implementation Order

### How dg-design Currently Reads Context

Current dg-design SKILL.md step flow (after Phase 1 updates):

1. **Step 0** (added in Phase 1): Check if `.dg-research/` exists. If not AND user mentions a specific business, suggest `/dg-discover` first.
2. **Step 1**: Collect brand brief (name, industry, audience, aesthetic)
3. **Step 2**: Generate DESIGN.md with 8 sections
4. **Step 3**: Validate
5. **Step 4**: Check for existing DESIGN.md before overwriting
6. **Step 5**: Write to project root
7. **Step 6**: Check Stitch design systems
8. **Step 7**: Suggest next step

**The gap:** Nowhere in this flow does the skill instruct Claude to separate host project context from target business context. The brand brief in step 1 collects the TARGET business info, but Claude still draws from CLAUDE.md for "what the business is" because CLAUDE.md provides the strongest signal.

### How dg-discover Handles Context

dg-discover has a more structured approach:

- Phase 1: Gather Context (asks what the business IS, who customers are, website purpose)
- Phase 2: Research (WebSearch, WebFetch for the actual business)
- Phase 3: Generate DESIGN.md with Section 1 including Business Model context
- Phase 4: Validate

**dg-discover is less vulnerable** because it explicitly researches the TARGET business via WebSearch/WebFetch, which provides strong counter-signals to CLAUDE.md. However, it still has risk:
- If research produces LOW confidence results, CLAUDE.md fills the gaps
- The "Business Model" type selection could be influenced (defaulting to "SaaS" because CLAUDE.md describes a CLI tool)
- The "notFeatures" list could inherit Design Guard patterns

### Pattern: Explicit Context Scoping in Skill Instructions

The recommended pattern for preventing host context contamination is to add a **context isolation preamble** at the top of the skill instructions. This is a common pattern in LLM prompt engineering: explicitly stating which context to use and which to ignore.

**Structure:**

```markdown
## Context Isolation (CRITICAL)

You are generating a DESIGN.md for **[TARGET BUSINESS]**, NOT for Design Guard.

**IGNORE the following from CLAUDE.md:**
- The "Project Overview" section describes Design Guard, not the target business
- Any references to CLI commands, TypeScript, Node.js, Vitest, MCP, Stitch
- Any testing strategies, development workflows, or architecture details
- The existing DESIGN.md at the project root (it may be for a DIFFERENT business)

**USE ONLY these sources for business context:**
- The user's brand brief (provided in this conversation)
- Research data from `.dg-research/latest.json` (if it exists)
- Information gathered via WebSearch/WebFetch about the target business

Every fact, statistic, feature, and business description in the DESIGN.md
MUST come from the target business, NEVER from the Design Guard codebase.
```

### Current DESIGN.md File: Estresso (from last dogfood)

The existing DESIGN.md at the project root is for Estresso (the cafe from the dogfood session). It already has the correct format and good content. However, its presence creates a secondary contamination vector: when dg-design generates for a NEW business, it might read the existing Estresso DESIGN.md as reference and mix in Estresso's palette/typography with the new business.

The dg-design SKILL.md step 4 says "If DESIGN.md already exists, ask before overwriting" but does NOT say "do not use the existing DESIGN.md as reference for the new one."

### Should DESIGN.md Go to a Subdirectory?

**Analysis:** The ROADMAP does not require this, and it would be a larger change:
- Stitch MCP reads DESIGN.md from the project root on every generation
- The `dg-generate` skill references "DESIGN.md at the project root"
- The `dg-evaluate` skill reads DESIGN.md from the project root
- The `dg-critic` agent reads DESIGN.md from the project root
- All lint rules reference DESIGN.md at root

Moving DESIGN.md to a subdirectory would require updating 6+ files and changing the Stitch integration. **Not worth the complexity for Phase 2.** The contamination fix should happen at the skill instruction level, not at the file layout level.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Context isolation | Custom subagent infrastructure | Explicit skill instructions | `context: fork` still loads CLAUDE.md; prompt-level isolation is the correct fix |
| Business context detection | NLP-based analyzer | Clear instructions + user input | The user explicitly says what business they want; Claude just needs to be told to USE that, not CLAUDE.md |
| DESIGN.md scoping | File-path-based project isolation | Overwrite-with-confirmation flow | Current approach works; just need to prevent cross-contamination during generation |

**Key insight:** This is a prompt engineering problem, not a code architecture problem. The fix is in SKILL.md markdown text that instructs Claude's behavior, not in TypeScript code.

## Common Pitfalls

### Pitfall 1: Over-Isolation Breaking the Development Workflow

**What goes wrong:** Adding "IGNORE CLAUDE.md" to the skill instruction causes Claude to ignore LEGITIMATE guidance from CLAUDE.md, such as the DESIGN.md 8-section specification, the validation rules, the anti-slop defaults in Do's/Don'ts, and the token limit guidance.
**Why it happens:** CLAUDE.md contains both "what Design Guard IS" (business context -- must ignore) and "how DESIGN.md should be structured" (format spec -- must follow).
**How to avoid:** The isolation instruction must be SPECIFIC about what to ignore: "Ignore the business model description, feature lists, technical stack, and development process from CLAUDE.md. Continue to follow the DESIGN.md 8-section specification and validation rules."
**Warning signs:** Generated DESIGN.md missing required sections or validation failures because the format spec was also ignored.

### Pitfall 2: Existing DESIGN.md Cross-Contamination

**What goes wrong:** The current DESIGN.md (Estresso cafe) bleeds into a DESIGN.md generated for a different business. New business gets Terracota (#BF4A30) and Instrument Serif because Claude uses the existing file as a template.
**Why it happens:** dg-design step 4 checks "if DESIGN.md exists" but only for overwrite confirmation, not for content isolation.
**How to avoid:** Add explicit instruction: "Do NOT use the existing DESIGN.md as a template or reference for colors, fonts, or business context. Generate a fresh design based solely on the brand brief and research data."
**Warning signs:** Two different businesses with suspiciously similar palettes or typography.

### Pitfall 3: Instruction Being Too Verbose

**What goes wrong:** The context isolation preamble becomes 500+ words, consuming skill token budget. Skills have a lifecycle where content stays in context for the session. After auto-compaction, only the first 5,000 tokens of each skill are re-attached.
**Why it happens:** Trying to enumerate every possible contamination vector instead of stating the principle.
**How to avoid:** Keep the isolation instruction under 200 words. State the PRINCIPLE (use target business data, not host project data) and give 2-3 specific examples. Don't try to list every CLAUDE.md section.
**Warning signs:** Skill content exceeds 500 lines (current dg-design is 73 lines, dg-discover is 140 lines).

### Pitfall 4: Not Testing Both Directions

**What goes wrong:** Fix works for "cafe while in Design Guard repo" but breaks for "Design Guard's own DESIGN.md" (when the user IS making a design for Design Guard itself).
**Why it happens:** The isolation instruction is too absolute. When the target business IS the host project, CLAUDE.md context is CORRECT to use.
**How to avoid:** The isolation should be CONDITIONAL: "IF the target business is different from the host project (Design Guard), ignore host project business context. IF the user is generating a DESIGN.md for the host project itself, use CLAUDE.md as a valid source."
**Warning signs:** User says "make a DESIGN.md for Design Guard" and gets a design with no business context because everything from CLAUDE.md was ignored.

### Pitfall 5: dg-discover Research Overridden by CLAUDE.md

**What goes wrong:** dg-discover researches Estresso cafe, gathers real data, saves to `.dg-research/latest.json`. Then dg-design reads both `.dg-research/latest.json` AND CLAUDE.md. CLAUDE.md's business context (stronger signal, higher priority) overrides the research data.
**Why it happens:** CLAUDE.md has "OVERRIDE" language in the system-reminder wrapper. Research data is just a JSON file with no priority signal.
**How to avoid:** The skill instruction must explicitly state: "Research data from `.dg-research/` takes PRIORITY over any project context from CLAUDE.md for business-related content."
**Warning signs:** dg-discover runs successfully but the resulting DESIGN.md still has Design Guard content.

## Code Examples

### Required Change: dg-design SKILL.md Context Isolation

Add after Step 0 (discover check), before Step 1 (collect brief):

```markdown
### Context Isolation (CRITICAL — read before generating)

When generating a DESIGN.md, you MUST distinguish between two contexts:

1. **Host project** — the codebase you are running inside (Design Guard). CLAUDE.md
   describes this project. Its business model, features, CLI commands, test counts,
   and technical architecture are about Design Guard, NOT about the user's target business.

2. **Target business** — the business the user wants a DESIGN.md for. This comes from:
   - The brand brief the user provides (Step 1)
   - Research data in `.dg-research/latest.json` (if available from /dg-discover)
   - WebSearch/WebFetch results about the target business

**Rules:**
- IF the target business is DIFFERENT from Design Guard:
  - Do NOT use any business descriptions, feature lists, stats, or technical details
    from CLAUDE.md in the DESIGN.md content
  - Do NOT reference CLI commands, test counts, TypeScript, Node.js, MCP, or Stitch
    as features of the target business
  - Do NOT describe the target business as "open source", "design intelligence", or any
    phrase from CLAUDE.md's Project Overview
  - Every business fact in the DESIGN.md must come from the user's brief or research data
  - The existing DESIGN.md at the project root may be for a different business — do NOT
    copy its colors, fonts, or business context into the new DESIGN.md

- IF the target business IS Design Guard itself:
  - CLAUDE.md is a valid source of business context
  - Use it alongside the user's brief

- ALWAYS follow the DESIGN.md 8-section specification and validation rules from CLAUDE.md,
  regardless of which business you are designing for. The FORMAT spec is always valid.
```

### Required Change: dg-discover SKILL.md Target Marking

Add to Phase 1 (Gather Context), after the 4 questions:

```markdown
### Context Isolation

You are researching **[BUSINESS NAME]**, not the host project (Design Guard).

- All research findings, business model analysis, and audience insights are about
  [BUSINESS NAME], not about Design Guard.
- When saving to `.dg-research/latest.json`, the `brief.companyName` field MUST match
  the target business, never "Design Guard".
- If you are unsure whether a fact comes from the target business or from CLAUDE.md
  project context, discard it and research again using WebSearch.
- CLAUDE.md describes how Design Guard works as a development tool. It does NOT describe
  the target business. Do not confuse the two.
```

### Current dg-design SKILL.md Step 0 (added in Phase 1)

```markdown
0. **Discover check (MUST run before anything else)**:
   - Check if the `.dg-research/` directory exists and contains JSON files.
   - IF `.dg-research/` does NOT exist AND the user has mentioned a specific business
     name, company, brand, cafe, restaurant, store, or real-world entity:
     - STOP. Tell the user: "I recommend running `/dg-discover` first..."
     - Only proceed with `/dg-design` if the user explicitly says to skip research.
   - IF `.dg-research/` exists with JSON files: proceed to step 1, using the research
     data as context for DESIGN.md generation. Read `.dg-research/latest.json`
   - IF the user request is generic: proceed directly to step 1.
```

This step already partially addresses the problem by routing users to /dg-discover first. But even after discover runs, the context isolation issue persists because CLAUDE.md still bleeds in during the design generation step.

### How dg-design Step 1 Should Reference Research Data

Current Step 0 says to read `.dg-research/latest.json` and use it. But the instruction should be more explicit about PRIORITY:

```markdown
   - IF `.dg-research/` exists with JSON files: Read `.dg-research/latest.json`.
     This research data is your PRIMARY source for business context. Use the
     `businessModel`, `brief`, `audienceInsights`, and `marketPosition` fields
     as the ground truth about the target business. Do NOT supplement with
     information from CLAUDE.md about Design Guard's business model.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No context isolation | Skill instructions with explicit isolation preamble | Phase 2 (this phase) | Prevents host project contamination in DESIGN.md |
| Skills inherit all context | `context: fork` available but still loads CLAUDE.md | Claude Code Skills 2.0 (March 2026) | Forking helps with conversation history but not project context |
| No discover-first flow | Step 0 preamble check (Phase 1) | Phase 1 of ws4 | Routes users to research before design |

**Key finding:** The Claude Code ecosystem does not provide a way to selectively exclude CLAUDE.md content from a skill's context. The official docs confirm `context: fork` still loads CLAUDE.md. The only option is prompt-level isolation: instructing Claude to ignore specific categories of CLAUDE.md content.

## Open Questions

1. **Should dg-design use `context: fork` even though it doesn't solve the CLAUDE.md problem?**
   - What we know: `context: fork` isolates conversation history but still loads CLAUDE.md. It does prevent OTHER conversation context from bleeding in.
   - What's unclear: Whether conversation history from previous turns (e.g., the user discussing Design Guard code) contributes to contamination beyond CLAUDE.md.
   - Recommendation: Do NOT add `context: fork` to dg-design in this phase. It would change the execution model (subagent vs inline) and is a larger change than needed. The prompt-level isolation addresses the documented contamination. If conversation history contamination is observed later, `context: fork` can be added as a follow-up.

2. **Does dg-generate also have contamination risk?**
   - What we know: dg-generate creates HTML screens, which include text content. If the screen is "for Estresso cafe" but CLAUDE.md context is loaded, the generated HTML could include Design Guard features.
   - What's unclear: Whether the DESIGN.md (once correctly generated) provides enough context override for screen generation.
   - Recommendation: Monitor during dogfooding. If dg-generate also shows contamination, add a similar isolation preamble. However, dg-generate reads DESIGN.md as its primary context, and the content-authenticity rules already ban hallucinated features. This provides some natural protection.

3. **How to verify the fix works?**
   - What we know: The original dogfood session produced specific contamination symptoms (Business Model, Key Stats, etc.)
   - Recommendation: Re-run the dogfood scenario: invoke `/dg-design` for "Estresso cafe" and check that NONE of these appear in the output: "open source", "CLI commands", "tests", "design intelligence", "NOT a SaaS", "TypeScript", "Node.js". This is a manual verification.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 |
| Config file | `packages/cli/vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CI-01 | dg-design SKILL.md contains context isolation preamble | manual-only | Read SKILL.md and verify isolation section exists with specific keywords | N/A |
| CI-01b | Isolation preamble distinguishes host project from target business | manual-only | Verify preamble has conditional logic (IF target != host) | N/A |
| CI-01c | Isolation preamble preserves DESIGN.md format spec compliance | manual-only | Verify preamble says "ALWAYS follow 8-section specification" | N/A |
| CI-02 | dg-discover SKILL.md marks target business explicitly | manual-only | Read SKILL.md and verify target marking section | N/A |
| CI-02b | dg-discover research priority over CLAUDE.md stated | manual-only | Verify SKILL.md says research is PRIMARY source | N/A |
| CI-ALL | Existing tests still pass after SKILL.md changes | unit | `npm test` | Yes |

### Sampling Rate

- **Per task commit:** `npm test` (ensures no TypeScript/code breakage)
- **Phase gate:** Manual dogfood test: run `/dg-design` for a cafe business inside the Design Guard repo and verify zero contamination

### Wave 0 Gaps

None -- this phase modifies only SKILL.md markdown files. No new test files needed. The existing 348 tests cover the TypeScript codebase which is unchanged.

## Sources

### Primary (HIGH confidence)

- `CLAUDE.md` -- full read, contamination analysis against dogfood symptoms
- `.claude/skills/dg-design/SKILL.md` -- current skill instructions, 73 lines
- `.claude/skills/dg-discover/SKILL.md` -- current skill instructions, 140 lines
- `dogfood-results.md` -- specific contamination bugs documented with examples
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- confirms `context: fork` still loads CLAUDE.md (table in "Run skills in a subagent" section)
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents) -- confirms subagent context model

### Secondary (MEDIUM confidence)

- [How Claude Code Builds a System Prompt](https://www.dbreunig.com/2026/04/04/how-claude-code-builds-a-system-prompt.html) -- system-reminder architecture
- [Claude Code Advanced Patterns](https://www.trensee.com/en/blog/explainer-claude-code-skills-fork-subagents-2026-03-31) -- fork isolation patterns
- [GitHub Issue #17283](https://github.com/anthropics/claude-code/issues/17283) -- `context: fork` behavior confirmed, issue resolved
- [Claude Code Customization Guide](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/) -- CLAUDE.md interaction with skills

### Tertiary (LOW confidence)

- None. All findings verified against primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all files exist in the repo, fully read and understood
- Architecture: HIGH -- CLAUDE.md contamination mechanism verified against official docs and dogfood symptoms
- Pitfalls: HIGH -- derived directly from contamination analysis and prompt engineering patterns

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable -- internal skill instructions, not external API)
