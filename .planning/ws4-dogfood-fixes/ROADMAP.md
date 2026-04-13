# Workstream 4: Dogfood Fixes — Roadmap

**Origin**: Dogfooding session 2026-04-13 (Escenarios 1 + 6)
**Source**: `dogfood-results.md`, automated agent tests (rounds 1-2), market research
**Goal**: Fix the 9 bugs/gaps found during dogfooding so the pipeline produces market-aligned output on the first attempt

---

## Phases

### Phase 1: Skill Flow Fixes (P0 — blocks user experience)
**Research**: How skills invoke each other, how advisor decides what to suggest, how generator selection works
**Deliverables**:
1. **Advisor suggests /dg-discover before /dg-design** when user mentions a real business/brand
   - File: `packages/cli/src/utils/advisor.ts` — add business-mention detection
   - File: `.claude/skills/dg-design/SKILL.md` — add preamble check for discover
2. **Present generator options to user** (Stitch vs Claude Code)
   - File: `.claude/skills/dg-generate/SKILL.md` — add generator selection step
   - File: `packages/cli/src/utils/config.ts` — surface `generator` field
3. **No silent fallback Stitch -> Claude Code**
   - File: `.claude/skills/dg-generate/SKILL.md` — on Stitch timeout, ask user before switching
   - File: `.claude/skills/dg-generate/SKILL.md` — suggest /dg-sync to check server-side completion

### Phase 2: Context Isolation (P1 — causes wrong output)
**Research**: How /dg-design reads project context, what bleeds from CLAUDE.md into DESIGN.md
**Requirements:** [CI-01, CI-02]
**Plans:** 1 plan
Plans:
- [ ] phase2-01-PLAN.md — Add context isolation preambles to dg-design and dg-discover SKILL.md files
**Deliverables**:
1. **Isolate brand brief from host project**
   - File: `.claude/skills/dg-design/SKILL.md` — explicit instruction to ignore CLAUDE.md business context when creating DESIGN.md for a DIFFERENT business
   - File: `.claude/skills/dg-discover/SKILL.md` — output should clearly mark what's the TARGET business vs the HOST project

### Phase 3: Build UX (P1 — missing confirmation steps)
**Research**: Current build flow, what config values should be confirmed
**Deliverables**:
1. **Build confirms framework before proceeding**
   - File: `.claude/skills/dg-build/SKILL.md` — enforce framework confirmation even when config has a preference
2. **Build comment is silent + includes repo URL**
   - File: `.claude/skills/dg-build/SKILL.md` — remove instruction to tell user about the comment
   - File: `packages/cli/src/adapters/static.ts` — update comment template to include URL
   - File: `packages/cli/src/adapters/astro.ts` — same
   - File: `packages/cli/src/adapters/nextjs.ts` — same
3. **Show quota status post-generation**
   - File: `.claude/skills/dg-generate/SKILL.md` — ensure quota display at step 12

### Phase 4: Generation Strategy (P2 — reliability)
**Research**: Stitch MCP timeout patterns, retry strategies, sync-after-timeout viability
**Deliverables**:
1. **Sequential generation, not parallel**
   - File: `.claude/skills/dg-generate/SKILL.md` — explicit instruction: one screen at a time, wait for result
2. **Sync-after-timeout recovery**
   - File: `.claude/skills/dg-generate/SKILL.md` — on timeout, wait then call list_screens to check if it completed
3. **Model deprecation awareness**
   - File: `.claude/skills/dg-generate/SKILL.md` — reference known-state.json for current models

### Phase 5: Remaining Lint Rules (P2 — detection gaps)
**Research**: Already done (ws1-rules RESEARCH.md + dogfood automated tests)
**Deliverables**:
6 remaining rules from the anti-slop-design.md gap analysis:
1. `no-single-font` — flags pages with only 1 font-family
2. `no-flat-hierarchy` — flags font sizes within 1.25x ratio
3. `no-nested-cards` — flags card inside card
4. `no-opacity-palette` — flags 5+ rgba opacity values as color system
5. `no-colored-glow` — flags colored box-shadow glow on 3+ elements
6. `no-generic-cta` — flags "Get Started", "Learn More" without specific action text

---

## Execution Order

```
Phase 1 (Skill Flow)     ←── highest impact, fixes P0 user-facing bugs
    ↓
Phase 2 (Context)         ←── fixes wrong output from contamination
    ↓
Phase 3 (Build UX)        ←── small targeted fixes
    ↓
Phase 4 (Generation)      ←── reliability improvements
    ↓
Phase 5 (Lint Rules)      ←── detection coverage (can parallelize with Phase 4)
```

## Process per Phase

Following established workflow:
1. **Research** — Read current files, understand constraints, document in RESEARCH.md
2. **Plan** — Write PLAN.md with specific file changes, must_haves, verification criteria
3. **Verify Plan** — Check plan against research, validate approach before executing
4. **Execute** — Make changes, run tests after each change
5. **Verify** — Run tests, typecheck, verify all must_haves met
6. **Audit** — Re-run dogfood tests to confirm fixes work end-to-end

## Verification

After all phases complete:
- Re-run the 3 automated dogfood agents (lint, advisor, MCP)
- Run Escenario 1 manually to verify the skill flow is fixed
- All 98+ tests must pass
- TypeScript must compile clean
