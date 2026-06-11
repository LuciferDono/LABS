# ECC → LABS Sync — Round 2 (branch `ecc-sync-round2`)

- Date: 2026-06-11
- Upstream: affaan-m/ECC @ 2.0.0
- Registry: version bumped `1.0.0` → `1.1.0`, generatedAt `2026-06-11`
- All entries in `labs:` namespace. Loader contract unchanged (registry.json schema intact).

## Imported

| Layer | Count | Items |
|-------|------:|-------|
| Skills | +46 | **core-infra (29):** agent-architecture-audit, agent-eval, agent-introspection-debugging, agent-sort, agentic-os, autonomous-agent-harness, council, dynamic-workflow-mode, parallel-execution-optimizer, plan-orchestrate, team-agent-orchestration, team-builder, recursive-decision-ledger, context-budget, token-budget-advisor, cost-tracking, ecc-tools-cost-audit, benchmark, benchmark-optimization-loop, canary-watch, config-gc, skill-comply, skill-scout, repo-scan, rules-distill, hookify-rules, santa-method, intent-driven-development, mle-workflow · **AgentShield (2):** safety-guard, gateguard · **lang JS-TS+Py (15):** react-patterns, react-performance, react-testing, nextjs-turbopack, nuxt4-patterns, vite-patterns, nestjs-patterns, bun-runtime, ui-to-vue, fastapi-patterns, pytorch-patterns, django-celery, prisma-patterns, redis-patterns, mysql-patterns |
| Agents | +20 | **cross-cutting (10):** code-architect, code-explorer, code-simplifier, comment-analyzer, conversation-analyzer, docs-lookup, performance-optimizer, pr-test-analyzer, silent-failure-hunter, type-design-analyzer · **lang C++/JS-TS/Py (10):** cpp-reviewer, cpp-build-resolver, typescript-reviewer, react-reviewer, react-build-resolver, django-reviewer, django-build-resolver, fastapi-reviewer, pytorch-build-resolver, mle-reviewer |
| Commands | +17 files, +18 rows | **lang (7):** cpp-build, cpp-review, cpp-test, react-build, react-review, react-test, fastapi-review · **paired (7):** hookify, hookify-configure, hookify-help, hookify-list, santa-loop, cost-report, skill-health · **flagged (3):** security-scan, review-pr, feature-dev · **registered existing:** /context |

| Skills | +6 | **orch-* family:** orch-pipeline, orch-add-feature, orch-build-mvp, orch-change-feature, orch-fix-defect, orch-refine-code |
| Commands | +6 | **orch-* (5):** orch-add-feature, orch-build-mvp, orch-change-feature, orch-fix-defect, orch-refine-code · **prp (1):** prp-prd |

**Totals: 146 skills / 38 agents / 72 commands / 3 contexts = 259 components** (was 163).

### orch-* / prp-prd notes
- `orch-*` is the gated Research→Plan→TDD→Review→Commit orchestration pipeline; each command is a thin wrapper over a same-named skill, all sharing the `orch-pipeline` engine.
- `prp-prd` = interactive, hypothesis-driven PRD generator (problem-first product spec).

> Registry `triggers` (skills), `delegateWhen` (agents), and `suggestWhen` (commands) were auto-derived from each component's frontmatter `description`. Hand-tune if any read poorly.

## Skipped (per command-center decisions)
- `continuous-learning-v2` — already in LABS; ECC differs but LABS copy is longer (local edits). LEFT UNTOUCHED. See TODO below.
- All 22 ops verticals, memory-persistence hooks, selective-install, cross-platform adapters, ecc2, Discord bot, dashboard, auto-update, non-stack languages, Go/Kotlin lang pairs (already present).

## prp-* family — partial import
- **Imported:** `prp-prd` (PRD generator).
- **Skipped:** `prp-plan`, `prp-implement`, `prp-pr`, `prp-commit` — redundant with the `orch-*` pipeline (plan/implement) and with the `commit-commands` plugin (PR/commit).

## TODO
- [ ] **continuous-learning-v2 3-way review.** LABS `skills/continuous-learning-v2/` (365 ln SKILL.md, 10 files) vs ECC 2.0.0 (360 ln, 12 files — 2 extra files). Diff manually; decide whether ECC's 2 added files + edits are worth merging without losing LABS local customizations. Do NOT blind-overwrite.
