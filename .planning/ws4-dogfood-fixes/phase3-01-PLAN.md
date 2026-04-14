---
phase: 3
plan: 1
title: "Build UX fixes — framework confirmation + silent comment"
status: pending
research: phase3-RESEARCH.md
files:
  - .claude/skills/dg-build/SKILL.md
---

# Plan: Build UX Fixes

## Context

Dogfooding revealed 3 P1 issues in the build flow. Research shows Fix 3 (quota
post-generation) was already addressed in Phase 1. This plan covers the remaining
two fixes.

## Tasks

### Task 1: Strengthen framework confirmation in dg-build SKILL.md

**File**: `.claude/skills/dg-build/SKILL.md`
**Location**: Step 1, after the heading

Add a MUST/NEVER enforcement block right after "## Step 1: Select Framework":
- "You MUST present the framework table below and wait for the user to confirm their choice BEFORE proceeding to Step 2."
- "NEVER skip this step, even if .guardrc.json has a framework preference or the context implies a framework."
- "NEVER auto-select a framework without explicit user confirmation."

### Task 2: Update comment text and make it silent in dg-build SKILL.md

**File**: `.claude/skills/dg-build/SKILL.md`
**Location**: Step 4 Static HTML section (line 78)

- Update the comment string from `<!-- Built with Design Guard -->` to `<!-- Built with Design Guard (https://github.com/FReptar0/design-guard) — {date} -->`
- Add instruction: "Do NOT mention this comment to the user. It is injected silently."
- Also add a similar silent-injection note to the Next.js section (line 115 area) that mentions the "Design Guard signature as a JSX comment".

## Must-haves

- [ ] SKILL.md Step 1 contains "MUST present" and "NEVER skip" language
- [ ] SKILL.md Step 4 comment string includes the repo URL
- [ ] SKILL.md Step 4 says not to mention the comment to the user
- [ ] All tests pass (`npm test -- --run`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)

## Verification

```bash
# MUST/NEVER in Step 1
grep -c "MUST present" .claude/skills/dg-build/SKILL.md  # >= 1
grep -c "NEVER skip" .claude/skills/dg-build/SKILL.md    # >= 1

# URL in comment instruction
grep -c "github.com/FReptar0/design-guard" .claude/skills/dg-build/SKILL.md  # >= 1

# Silent instruction
grep -c "Do NOT mention" .claude/skills/dg-build/SKILL.md  # >= 1

# Tests and typecheck
npm test -- --run
npx tsc --noEmit
```
