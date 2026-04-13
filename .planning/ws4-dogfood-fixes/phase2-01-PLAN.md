---
phase: phase2-context-isolation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/skills/dg-design/SKILL.md
  - .claude/skills/dg-discover/SKILL.md
autonomous: true
requirements: [CI-01, CI-02]

must_haves:
  truths:
    - "When dg-design generates a DESIGN.md for a business OTHER than Design Guard, the output contains zero references to CLI commands, test counts, TypeScript, Node.js, MCP, Stitch, or 'design intelligence'"
    - "When dg-design generates a DESIGN.md for Design Guard itself, CLAUDE.md business context IS used"
    - "When dg-design runs with an existing DESIGN.md for a different business, the new DESIGN.md does not copy colors, fonts, or business context from the existing one"
    - "dg-discover research data in .dg-research/ is stated as PRIMARY source, overriding CLAUDE.md for business content"
    - "Both skills preserve the 8-section DESIGN.md format specification and validation rules from CLAUDE.md"
  artifacts:
    - path: ".claude/skills/dg-design/SKILL.md"
      provides: "Context isolation preamble between Step 0 and Step 1"
      contains: "Context Isolation"
    - path: ".claude/skills/dg-discover/SKILL.md"
      provides: "Target business marking in Phase 1"
      contains: "Context Isolation"
  key_links:
    - from: ".claude/skills/dg-design/SKILL.md"
      to: ".dg-research/latest.json"
      via: "Priority statement in isolation preamble"
      pattern: "PRIMARY source"
    - from: ".claude/skills/dg-design/SKILL.md"
      to: "CLAUDE.md"
      via: "Conditional ignore instruction"
      pattern: "DIFFERENT from Design Guard"
    - from: ".claude/skills/dg-discover/SKILL.md"
      to: "CLAUDE.md"
      via: "Host project disambiguation"
      pattern: "not the host project"
---

<objective>
Add explicit context isolation instructions to dg-design and dg-discover SKILL.md files so that CLAUDE.md host project context does not contaminate DESIGN.md when designing for a different business.

Purpose: Fix the P1 bug where generating a DESIGN.md for Estresso cafe inside the Design Guard repo produced output containing "Open source design intelligence library", "13 CLI commands", "238 tests", and "NOT a SaaS" -- all Design Guard data, not cafe data. The root cause is that CLAUDE.md is always loaded (even with `context: fork`) and the skills had no instruction to separate host project context from target business context.

Output: Two updated SKILL.md files with context isolation preambles.
</objective>

<execution_context>
@/Users/freptar0/.claude/get-shit-done/workflows/execute-plan.md
@/Users/freptar0/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ws4-dogfood-fixes/ROADMAP.md
@.planning/ws4-dogfood-fixes/phase2-RESEARCH.md
@.claude/skills/dg-design/SKILL.md
@.claude/skills/dg-discover/SKILL.md
@dogfood-results.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add context isolation preamble to dg-design SKILL.md</name>
  <files>.claude/skills/dg-design/SKILL.md</files>
  <action>
Insert a new section between Step 0 (discover check) and Step 1 (collect brief). The new section goes AFTER the closing of step 0's bullet list and BEFORE the line that starts with `1. If the user provided a brand brief`.

Insert this EXACT markdown content:

```markdown

### Context Isolation (CRITICAL -- read before generating)

When generating a DESIGN.md, distinguish between two contexts:

1. **Host project** -- the codebase you are running inside (Design Guard). CLAUDE.md
   describes THIS project. Its business model, features, CLI commands, test counts,
   and technical architecture are about Design Guard, NOT about the user's target business.

2. **Target business** -- the business the user wants a DESIGN.md for. This comes from:
   - The brand brief the user provides (Step 1)
   - Research data in `.dg-research/latest.json` (if available from /dg-discover -- this is your PRIMARY source)
   - WebSearch/WebFetch results about the target business

**Rules:**
- IF the target business is DIFFERENT from Design Guard:
  - Do NOT use business descriptions, feature lists, stats, or technical details from CLAUDE.md
  - Do NOT reference CLI commands, test counts, TypeScript, Node.js, MCP, or Stitch as features of the target business
  - Do NOT describe the target as "open source", "design intelligence", or any phrase from CLAUDE.md's Project Overview
  - Every business fact in the DESIGN.md must come from the user's brief or research data
  - If an existing DESIGN.md is present at the project root, do NOT copy its colors, fonts, or business context into the new one -- generate fresh from the brief and research

- IF the target business IS Design Guard itself:
  - CLAUDE.md is a valid source of business context -- use it alongside the user's brief

- ALWAYS follow the DESIGN.md 8-section specification and validation rules from CLAUDE.md regardless of target business. The FORMAT rules always apply; the BUSINESS context is what gets isolated.
```

Also update Step 0's third bullet (the `.dg-research/` exists case) to emphasize research data priority. Change this line:

```
   - IF `.dg-research/` exists with JSON files: proceed to step 1, using the research data as context for DESIGN.md generation. Read `.dg-research/latest.json` to get the business brief, competitor analysis, and brand colors.
```

To this:

```
   - IF `.dg-research/` exists with JSON files: Read `.dg-research/latest.json` to get the business brief, competitor analysis, and brand colors. This research data is your PRIMARY source for business context -- use it over any project-level context from CLAUDE.md. Proceed to step 1.
```
  </action>
  <verify>
    <automated>grep -c "Context Isolation" .claude/skills/dg-design/SKILL.md | grep -q "1" && grep -c "DIFFERENT from Design Guard" .claude/skills/dg-design/SKILL.md | grep -q "1" && grep -c "IS Design Guard itself" .claude/skills/dg-design/SKILL.md | grep -q "1" && grep -c "FORMAT rules always apply" .claude/skills/dg-design/SKILL.md | grep -q "1" && grep -c "PRIMARY source" .claude/skills/dg-design/SKILL.md | grep -q "1" && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>
    - dg-design SKILL.md contains a "Context Isolation" section between Step 0 and Step 1
    - Section has conditional logic: different behavior for target == host vs target != host
    - Existing DESIGN.md cross-contamination is explicitly banned
    - Research data is stated as PRIMARY source
    - 8-section format spec compliance is preserved regardless of target
    - Total SKILL.md stays under 120 lines (current is 73, adding ~30 lines of isolation)
  </done>
</task>

<task type="auto">
  <name>Task 2: Add context isolation to dg-discover SKILL.md</name>
  <files>.claude/skills/dg-discover/SKILL.md</files>
  <action>
Insert a new subsection inside Phase 1 (Gather Context), AFTER the numbered list of 4 questions (after the line "If the user provides a detailed brief, extract answers from it...") and BEFORE the `## Phase 2: Research (autonomous)` heading.

Insert this EXACT markdown content:

```markdown

### Context Isolation

You are researching a specific target business, NOT the host project (Design Guard).

- CLAUDE.md describes how Design Guard works as a development tool. It does NOT describe the target business. Do not confuse the two.
- All research findings, business model analysis, and audience insights must be about the target business, not about Design Guard.
- When saving to `.dg-research/latest.json`, the `brief.companyName` field MUST match the target business name, never "Design Guard" (unless the user explicitly asked to research Design Guard itself).
- If you are unsure whether a fact comes from the target business or from CLAUDE.md project context, discard it and research again using WebSearch.
- Do NOT describe the target business as "open source", "CLI tool", "design intelligence", or any other phrase from CLAUDE.md's Project Overview.
```
  </action>
  <verify>
    <automated>grep -c "Context Isolation" .claude/skills/dg-discover/SKILL.md | grep -q "1" && grep -c "NOT the host project" .claude/skills/dg-discover/SKILL.md | grep -q "1" && grep -c "brief.companyName" .claude/skills/dg-discover/SKILL.md | grep -q "1" && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>
    - dg-discover SKILL.md contains a "Context Isolation" subsection inside Phase 1
    - Section explicitly names Design Guard as the host project to ignore
    - companyName field validation instruction is present
    - Discard-and-research-again instruction for ambiguous facts is present
    - Total SKILL.md stays under 160 lines (current is 140, adding ~12 lines)
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

1. **Structural check**: Both SKILL.md files parse correctly as valid markdown skill files
2. **Keyword absence test (dg-design)**: The isolation preamble contains all 5 required elements:
   - "Context Isolation" heading
   - Conditional for target != host ("DIFFERENT from Design Guard")
   - Conditional for target == host ("IS Design Guard itself")
   - Format preservation ("FORMAT rules always apply" or "8-section specification")
   - Research priority ("PRIMARY source")
3. **Keyword presence test (dg-discover)**: The isolation section contains:
   - "NOT the host project"
   - "brief.companyName"
   - "discard it and research again"
4. **No code breakage**: `npm test` passes (348 tests, no TypeScript files modified)
5. **Line count check**: dg-design < 120 lines, dg-discover < 160 lines (avoids Pitfall 3: instruction too verbose)
</verification>

<success_criteria>
- Both SKILL.md files contain context isolation instructions
- Isolation is CONDITIONAL (preserves host-project use case per Pitfall 4)
- Existing DESIGN.md cross-contamination is addressed (Pitfall 2)
- Research data priority is explicit (Pitfall 5)
- Format spec compliance is preserved (Pitfall 1)
- Instructions are concise, under 200 words each (Pitfall 3)
- `npm test` still passes
</success_criteria>

<output>
After completion, create `.planning/ws4-dogfood-fixes/phase2-01-SUMMARY.md`
</output>
