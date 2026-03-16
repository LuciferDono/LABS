# LABS Plugin Design — Lazy-ECC Fork

**Date:** 2026-03-16
**Status:** Locked
**Authors:** Human + Claude Opus 4.6 + Sonnet 4.6 (independent instance)

---

## Overview

LABS is a Claude Code plugin that forks everything-claude-code (ECC) with a lazy-loading architecture. Instead of injecting all 94 skills, 18 agents, and 47 commands into context at session start, LABS loads only a registry index (~800-1200 tokens) and resolves components on demand via an auto-detect engine.

## Architecture

```
Session Start → REGISTRY.md (~800-1200 tokens)
    ↓
User message → Auto-detect engine (CLAUDE.md)
    ↓
┌───────────┬──────────────┬─────────────┐
│  Skills   │   Agents     │  Commands   │
│ on-demand │ sub-delegate │ slash-load  │
└───────────┴──────────────┴─────────────┘
    ↓
Hooks — always active (hooks.json, profile-gated)
    ↓
Rules — manually installed (install.sh)
```

See `ecc_lazy_loader_architecture.svg` for the visual diagram.

## Core Innovation: Dual-Format Registry

### registry.json (source of truth)

Machine-readable. Used by `scripts/validate-registry.js` to verify all paths exist. Used by `scripts/sync-registry.js` to generate REGISTRY.md.

```json
{
  "version": "1.0.0",
  "skills": [
    {
      "name": "tdd-workflow",
      "path": "skills/tdd-workflow/SKILL.md",
      "triggers": ["test", "tdd", "failing test", "red-green", "coverage"]
    }
  ],
  "agents": [
    {
      "name": "planner",
      "file": "agents/planner.md",
      "delegateWhen": "feature planning, implementation blueprint, PRD"
    }
  ],
  "commands": [
    {
      "command": "/tdd",
      "suggestWhen": "user describes a bug fix or new feature without mentioning tests"
    }
  ],
  "contexts": [
    {
      "name": "dev",
      "file": "contexts/dev.md",
      "invokedVia": "/context dev"
    }
  ]
}
```

### REGISTRY.md (generated, human-readable)

Generated from registry.json by `scripts/sync-registry.js`. This is what Claude reads at session start. ~800-1200 tokens.

Contains markdown tables for skills, agents, commands, and contexts — each row has name, path/file, and trigger keywords.

## Plugin Root Resolution

### Problem

ECC's scripts use `${CLAUDE_PLUGIN_ROOT}` env var, but Claude Code's plugin system doesn't guarantee it's set at all lifecycle stages (especially SessionStart hooks, which have an elaborate fallback search in ECC's hooks.json).

### Solution: `scripts/lib/plugin-root.js`

A resolver shim that:
1. Checks `CLAUDE_PLUGIN_ROOT` env var first
2. Falls back to walking up from `__dirname` until it finds `.claude-plugin/plugin.json`
3. Caches the result for the process lifetime
4. Throws a clear error if resolution fails

All hook scripts and lib modules import this instead of reading the env var directly.

## Component Loading Protocol (CLAUDE.md)

### On every user message:
1. Match message against registry triggers
2. Load matched skills via Skill tool (max 3 per turn)
3. If task warrants delegation → spawn matched agent as subagent
4. If a command fits better than direct response → suggest it

### Rules:
- Never pre-load speculatively
- If uncertain, proceed without loading
- Skills loaded earlier in session don't need re-loading
- For multi-step tasks, load phase-appropriate skills

### Contexts:
- NOT auto-detected (risk of loading 2k-token context on ambiguous signals)
- User-invoked via `/context dev`, `/context research`, `/context review`
- Or set via alias: `claude-dev`, `claude-review`, `claude-research`

## Hook Profile System

Default: `minimal` (session boundary hooks only)

| Profile | Hooks Active | Per-Tool Overhead |
|---------|-------------|-------------------|
| `minimal` | session-start, session-end, evaluate-session, cost-tracker, session-end-marker | Zero |
| `standard` | + quality-gate, post-edit-format, typecheck, console-warn, doc-warning, suggest-compact, observe, PR logging | Moderate |
| `strict` | + tmux reminders, git push reminders | Full |

Set via `ECC_HOOK_PROFILE` env var. Individual hooks disabled via `ECC_DISABLED_HOOKS`.

## Session Persistence System

Ships from ECC as-is, using plugin-root.js for path resolution:

- `scripts/lib/session-manager.js` — CRUD for `~/.claude/sessions/*.tmp`
- `scripts/lib/session-aliases.js` — human-readable session names
- `scripts/hooks/session-start.js` — loads previous context on SessionStart
- `scripts/hooks/session-end.js` — persists state on Stop (async, 10s timeout)
- `scripts/hooks/pre-compact.js` — saves state before context compaction
- `commands/save-session.md`, `resume-session.md`, `sessions.md`

## What Ships

| Directory | Contents | Count |
|-----------|----------|-------|
| `skills/` | All ECC skills | 94 |
| `agents/` | All ECC agents | 18 |
| `commands/` | All ECC commands | 47 |
| `hooks/` | hooks.json + README | 1 config |
| `scripts/hooks/` | Hook implementations | 25 |
| `scripts/lib/` | Runtime libraries | 20+ |
| `scripts/ci/` | Validators | 8 |
| `rules/` | Language-specific rule packs | 7 languages |
| `contexts/` | Behavioral modes | 3 |
| `schemas/` | JSON schemas | 9 |
| `mcp-configs/` | MCP server catalog (reference) | 1 |
| `docs/` | Guides | 4 |

## What Gets Dropped

| Directory | Reason |
|-----------|--------|
| `.codex/` | Codex CLI support — not needed |
| `.cursor/` | Cursor IDE support — not needed |
| `.opencode/` | OpenCode support — not needed |
| `.agents/` | Codex agent mirror — not needed |
| `.github/workflows/` | ECC's own CI — not our concern |
| `manifests/` | Selective install system — REGISTRY.md replaces this |
| `examples/` | Sample CLAUDE.md files — reference only |
| `tests/` | ECC's test suite — not plugin content |
| `package.json` etc. | ECC dev tooling |

## What Gets Created (New Files)

| File | Purpose |
|------|---------|
| `registry.json` | Source of truth for all components |
| `REGISTRY.md` | Generated human-readable index for Claude |
| `CLAUDE.md` | Auto-detect engine instructions |
| `.claude-plugin/plugin.json` | Updated plugin manifest |
| `scripts/lib/plugin-root.js` | Plugin root resolver shim |
| `scripts/validate-registry.js` | Validates all registry paths exist |
| `scripts/sync-registry.js` | Generates REGISTRY.md from registry.json |

## Plugin Manifest

```json
{
  "name": "labs",
  "version": "1.0.0",
  "description": "Lazy-loading ECC fork — full Claude Code enhancement suite with on-demand component loading",
  "keywords": ["tdd", "security", "planning", "agents", "workflow", "orchestration"]
}
```

## Implementation Order

1. Fork ECC repo → rename to `labs`
2. Delete dropped directories
3. Create `scripts/lib/plugin-root.js` (resolver shim)
4. Patch all hook scripts to use plugin-root.js instead of raw env var
5. Create `registry.json` with all 94+18+47+3 entries
6. Create `scripts/sync-registry.js` and `scripts/validate-registry.js`
7. Generate `REGISTRY.md` from registry.json
8. Create `CLAUDE.md` with auto-detect engine + loading rules
9. Update `.claude-plugin/plugin.json`
10. Create `/context` command for context switching
11. Set default `ECC_HOOK_PROFILE=minimal`
12. Validate: run validate-registry.js, verify all paths resolve
13. Test: install as plugin, verify lazy loading, verify hooks fire
14. Push to GitHub as standalone repo
