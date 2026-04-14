# Phase 3: Build UX — Research

**Date**: 2026-04-12
**Scope**: 3 P1 fixes from dogfooding (Build UX category)

---

## Fix 1: Build must confirm framework before proceeding

**Current state**: SKILL.md Step 1 (line 13-21) says "Present these options to the user before doing anything else" and line 21 says "confirm with the user". The Guardrails section (line 119) says "ALWAYS confirm the framework choice before building." Despite this, during dogfooding it jumped straight to static without asking (dogfood-results.md line 24).

**Root cause**: The instruction is suggestive, not mandatory. Claude treats "present options" as optional when it infers a framework from context.

**Fix location**: `.claude/skills/dg-build/SKILL.md` — Step 1, add a MUST/NEVER enforcement block at the top of the step.

---

## Fix 2: Build comment silent + includes repo URL

**Current state**:
- `packages/cli/src/adapters/types.ts` line 6: `getGuardSignature()` already returns `<!-- Built with Design Guard (https://github.com/FReptar0/design-guard) — ${now} -->` — URL is already there.
- `packages/cli/src/adapters/static.ts`: Uses `getGuardSignature()` — already correct.
- `packages/cli/src/adapters/nextjs.ts`: Uses `getGuardSignature()` — already correct.
- `packages/cli/src/adapters/astro.ts`: Delegates to Stitch MCP `build_site` — no local comment injection (Stitch handles it). No change needed.
- `.claude/skills/dg-build/SKILL.md` line 78: Still says the old comment text `<!-- Built with Design Guard -->` without URL — needs update.
- `.claude/skills/dg-build/SKILL.md` line 80: Says "Tell the user: Your site is in the dist/ folder..." — the build instructions mention the comment. The comment injection itself should be silent (don't tell the user about it).

**Fix locations**:
1. SKILL.md line 78: Update comment text to match `getGuardSignature()` output and add instruction to NOT mention the comment to the user.
2. Adapter code: Already correct — no changes needed.

---

## Fix 3: Show quota status post-generation

**Current state**: `.claude/skills/dg-generate/SKILL.md` step 12 (line 115) already says: `Always show quota status: "Quota: Flash {used}/{limit}, Pro {used}/{limit}"`

**Status**: Already done from Phase 1. No changes needed.

---

## Summary

| Fix | Files to Change | Status |
|-----|----------------|--------|
| 1. Framework confirmation | `dg-build/SKILL.md` | Needs edit |
| 2. Silent comment + URL | `dg-build/SKILL.md` | Needs edit |
| 2b. Adapter comment text | `types.ts`, `static.ts`, `nextjs.ts` | Already correct |
| 3. Quota post-generation | `dg-generate/SKILL.md` | Already done |
