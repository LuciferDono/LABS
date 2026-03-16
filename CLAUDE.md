# LABS — Lazy-Loading Claude Code Enhancement Suite

> Forked from [everything-claude-code](https://github.com/affaan-m/everything-claude-code) with registry-driven lazy loading.

## Component Loading Protocol

At session start, read `REGISTRY.md` once. Do NOT read any skill, agent, or command file until a task requires it.

### On every user message:
1. Scan the user's message against skill triggers in the registry
2. If 1+ triggers match, load matched SKILL.md(s) via Read tool (max 3 per turn)
3. If the task warrants delegation, spawn the matched agent as a subagent
4. If a command would serve the user better than direct response, suggest it

### Loading rules:
- Never pre-load speculatively — match must be specific
- If uncertain whether a skill applies, proceed without it
- Skills loaded earlier in the session don't need re-loading
- For multi-step tasks, load phase-appropriate skills:
  planning skills first → implementation skills → review skills
- When loading a skill, use its full path from the registry relative to plugin root

## Contexts

User-invoked only. NOT auto-detected (avoids loading 2k-token context on ambiguous signals).

| Context | Invoked via | Behavior |
|---------|------------|----------|
| dev | `/context dev` | Active development — code first, explain after |
| research | `/context research` | Exploration — read widely before concluding |
| review | `/context review` | PR review — prioritize by severity, suggest fixes |

## Hook Profiles

Default: `minimal` (session boundary hooks only, zero per-tool-call overhead).

| Profile | Set via | What fires |
|---------|---------|------------|
| minimal | `ECC_HOOK_PROFILE=minimal` | session-start, session-end, cost-tracker, evaluate-session |
| standard | `ECC_HOOK_PROFILE=standard` | + quality-gate, formatter, typecheck, console-warn, observe |
| strict | `ECC_HOOK_PROFILE=strict` | + tmux reminders, git push reminders |

Disable individual hooks: `ECC_DISABLED_HOOKS=hook-id-1,hook-id-2`

## Session Persistence

Sessions are persisted as markdown files in `~/.claude/sessions/`.

| Command | Purpose |
|---------|---------|
| `/save-session` | Persist current state (what worked, what didn't, next steps) |
| `/resume-session` | Load most recent session with full context |
| `/sessions` | List, load, alias, inspect past sessions |

## Agent Orchestration

See `AGENTS.md` for the full agent dispatch protocol. Key agents:

| Agent | Model | When to dispatch |
|-------|-------|-----------------|
| planner | opus | Feature planning, complex refactoring |
| architect | opus | System design, architectural decisions |
| tdd-guide | sonnet | New features, bug fixes (TDD enforcement) |
| code-reviewer | sonnet | All code changes (mandatory) |
| security-reviewer | sonnet | Auth, user input, API endpoints, sensitive data |
| build-error-resolver | sonnet | Build/type errors |

## Project Structure

```
REGISTRY.md          — Component index (read at session start)
registry.json        — Source of truth (machine-readable)
agents/              — 18 specialized subagent definitions
skills/              — 94 lazy-loaded skill directories
commands/            — 48 slash commands
contexts/            — 3 behavioral modes (dev/research/review)
hooks/               — Hook configuration (profile-gated)
scripts/             — Runtime libraries and hook implementations
rules/               — Language-specific rule packs
mcp-configs/         — MCP server catalog (reference)
docs/                — Guides and plans
```
