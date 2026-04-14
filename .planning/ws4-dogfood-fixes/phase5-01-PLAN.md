# Phase 5: Remaining Lint Rules — Plan

## Goal
Add 6 lint rules to close the gap between anti-slop-design.md bans and linter coverage (10/16 -> 16/16).

## Files to Create
1. `packages/core/src/validation/rules/no-single-font.ts`
2. `packages/core/src/validation/rules/no-flat-hierarchy.ts`
3. `packages/core/src/validation/rules/no-nested-cards.ts`
4. `packages/core/src/validation/rules/no-opacity-palette.ts`
5. `packages/core/src/validation/rules/no-colored-glow.ts`
6. `packages/core/src/validation/rules/no-generic-cta.ts`

## Files to Modify
1. `packages/core/src/validation/rules/index.ts` — import all 6 + add to ALL_RULES + update comment count 23->29

## Pattern (each rule file)
```typescript
import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';
export const ruleName: LintRule = {
  id, name, description, severity, category,
  check(context: LintContext): ValidationIssue[] { ... }
};
```

## Must-Haves
- [ ] All 6 rule files created, following existing patterns
- [ ] All 6 rules registered in index.ts
- [ ] `npx tsc --noEmit` compiles clean
- [ ] `npm test -- --run` passes all tests
- [ ] Comment count updated from 23 to 29

## Verification
- `ls packages/core/src/validation/rules/no-*.ts | wc -l` = 24 (18 existing + 6 new)
- Rule count in getAllRules() = 29
