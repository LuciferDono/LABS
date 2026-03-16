# LABS Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fork ECC into a lazy-loading Claude Code plugin with dual-format registry, plugin-root resolver shim, and profile-gated hooks.

**Architecture:** Fork everything-claude-code, drop multi-platform configs and dev tooling, add REGISTRY.md (generated from registry.json) as the lazy-load index, add plugin-root.js resolver shim, wire CLAUDE.md as auto-detect engine.

**Tech Stack:** Node.js (scripts/lib), Markdown (skills/agents/commands), JSON (registry, schemas, hooks), Bash (install.sh, shell hooks)

---

## Phase 1: Fork & Clean (repo scaffolding)

### Task 1: Fork ECC repo

**Files:**
- Create: `C:/Users/prana/Projekts/LABS/` (already exists as working dir)

**Step 1: Clone ECC into LABS**

```bash
cd /c/Users/prana/Projekts/LABS
git init
git remote add upstream https://github.com/affaan-m/everything-claude-code.git
git fetch upstream
git checkout -b main upstream/main
```

**Step 2: Verify clone**

Run: `ls -la`
Expected: Full ECC directory structure (agents/, skills/, commands/, hooks/, scripts/, etc.)

**Step 3: Set our own origin**

```bash
git remote remove upstream
```

We'll add our own remote later when we create the GitHub repo.

---

### Task 2: Delete dropped directories

**Files:**
- Delete: `.codex/`, `.cursor/`, `.opencode/`, `.agents/`
- Delete: `.github/workflows/`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/release.yml`, `.github/FUNDING.yml`
- Delete: `manifests/`
- Delete: `examples/`
- Delete: `tests/`
- Delete: `package.json`, `package-lock.json`, `eslint.config.js`, `.prettierrc`, `commitlint.config.js`, `.markdownlint.json`
- Keep: `.gitignore` (useful)

**Step 1: Remove multi-platform configs**

```bash
rm -rf .codex .cursor .opencode .agents
```

**Step 2: Remove CI/GitHub configs**

```bash
rm -rf .github
```

**Step 3: Remove install manifests (replaced by REGISTRY.md)**

```bash
rm -rf manifests examples tests
```

**Step 4: Remove dev tooling**

```bash
rm -f package.json package-lock.json eslint.config.js .prettierrc commitlint.config.js .markdownlint.json
```

**Step 5: Verify structure**

Run: `ls -la`
Expected: agents/, commands/, contexts/, docs/, hooks/, mcp-configs/, plugins/, rules/, schemas/, scripts/, skills/, CLAUDE.md, AGENTS.md, .gitignore

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: fork ECC, remove multi-platform configs and dev tooling"
```

---

## Phase 2: Plugin Root Resolver (blocking correctness issue)

### Task 3: Create `scripts/lib/plugin-root.js`

**Files:**
- Create: `scripts/lib/plugin-root.js`

**Step 1: Write the resolver**

```javascript
'use strict';

const path = require('path');
const fs = require('fs');

let _cachedRoot = null;

/**
 * Resolves the plugin root directory.
 * 1. Checks CLAUDE_PLUGIN_ROOT env var
 * 2. Walks up from __dirname until plugin.json is found
 * 3. Caches result for process lifetime
 */
function getPluginRoot() {
  if (_cachedRoot) return _cachedRoot;

  // Priority 1: env var
  const envRoot = process.env.CLAUDE_PLUGIN_ROOT;
  if (envRoot && fs.existsSync(path.join(envRoot, '.claude-plugin', 'plugin.json'))) {
    _cachedRoot = envRoot;
    return _cachedRoot;
  }
  if (envRoot && fs.existsSync(path.join(envRoot, 'plugin.json'))) {
    _cachedRoot = envRoot;
    return _cachedRoot;
  }

  // Priority 2: walk up from this file's location
  let dir = __dirname;
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (
      fs.existsSync(path.join(dir, '.claude-plugin', 'plugin.json')) ||
      fs.existsSync(path.join(dir, 'plugin.json'))
    ) {
      _cachedRoot = dir;
      return _cachedRoot;
    }
    dir = path.dirname(dir);
  }

  // Priority 3: fallback to two levels up from scripts/lib/
  const fallback = path.resolve(__dirname, '..', '..');
  _cachedRoot = fallback;
  return _cachedRoot;
}

module.exports = { getPluginRoot };
```

**Step 2: Verify it resolves correctly**

Run: `node -e "process.env.CLAUDE_PLUGIN_ROOT=''; require('./scripts/lib/plugin-root').getPluginRoot()"`
Expected: No error, returns the LABS directory path

**Step 3: Commit**

```bash
git add scripts/lib/plugin-root.js
git commit -m "feat: add plugin-root.js resolver shim for reliable path resolution"
```

---

### Task 4: Patch `run-with-flags.js` to use plugin-root.js

**Files:**
- Modify: `scripts/hooks/run-with-flags.js`

**Step 1: Read current file**

Read `scripts/hooks/run-with-flags.js` and locate the `getPluginRoot()` function.

**Step 2: Replace inline getPluginRoot with require**

Find the existing `getPluginRoot()` function definition and replace it with:

```javascript
const { getPluginRoot } = require('../lib/plugin-root');
```

Remove the old inline function entirely. Keep all other logic (stdin reading, profile checking, script execution) unchanged.

**Step 3: Test the dispatcher still works**

Run: `echo '{}' | node scripts/hooks/run-with-flags.js test:hook scripts/hooks/session-end-marker.js minimal,standard,strict`
Expected: Passthrough of `{}` to stdout (or graceful skip if profile doesn't match)

**Step 4: Commit**

```bash
git add scripts/hooks/run-with-flags.js
git commit -m "refactor: use centralized plugin-root.js in run-with-flags dispatcher"
```

---

## Phase 3: Plugin Manifest & CLAUDE.md

### Task 5: Update plugin.json

**Files:**
- Modify: `.claude-plugin/plugin.json`

**Step 1: Read current plugin.json**

**Step 2: Update manifest**

```json
{
  "name": "labs",
  "version": "1.0.0",
  "description": "Lazy-loading ECC fork — full Claude Code enhancement suite with on-demand component loading via registry-driven auto-detection",
  "keywords": ["tdd", "security", "planning", "agents", "workflow", "orchestration", "lazy-loading", "registry"]
}
```

**Step 3: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "feat: update plugin manifest for LABS"
```

---

### Task 6: Create CLAUDE.md (auto-detect engine)

**Files:**
- Modify: `CLAUDE.md` (replace ECC's project-level CLAUDE.md with our plugin instructions)

**Step 1: Read existing CLAUDE.md for reference**

**Step 2: Write new CLAUDE.md**

The CLAUDE.md must contain:
1. Plugin identity and purpose
2. Lazy component loading protocol (the core innovation)
3. Registry reading instructions
4. Skill/agent/command matching rules
5. Context switching via /context command
6. Hook profile documentation
7. Session persistence instructions

Key sections:

```markdown
# LABS — Lazy-Loading Claude Code Enhancement Suite

## Component Loading Protocol

At session start, read REGISTRY.md once. Do NOT read any skill, agent, or command file
until a task requires it.

### On every user message:
1. Scan message against skill triggers in the registry
2. If 1+ triggers match, load matched SKILL.md(s) via Read tool (max 3 per turn)
3. If task warrants delegation, spawn matched agent as subagent
4. If a command would serve the user better than direct response, suggest it

### Loading rules:
- Never pre-load speculatively
- If uncertain whether a skill applies, proceed without it
- Skills loaded earlier in session don't need re-loading
- For multi-step tasks, load phase-appropriate skills
  (planning skills first → implementation skills → review skills)

## Contexts
User-invoked only. NOT auto-detected.
- /context dev — active development mode (code first, explain after)
- /context research — exploration mode (read widely before concluding)
- /context review — PR review mode (prioritize by severity)

## Hook Profiles
Default: minimal (session boundary hooks only, zero per-tool overhead)
- ECC_HOOK_PROFILE=minimal — session-start, session-end, cost-tracker
- ECC_HOOK_PROFILE=standard — + quality-gate, formatter, typecheck, observe
- ECC_HOOK_PROFILE=strict — + tmux reminders, git push reminders

## Session Persistence
- /save-session — persist current state to ~/.claude/sessions/
- /resume-session — load most recent session and resume
- /sessions — list, load, alias, inspect sessions
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: replace ECC CLAUDE.md with LABS auto-detect engine"
```

---

## Phase 4: Dual-Format Registry

### Task 7: Create `registry.json` (source of truth)

**Files:**
- Create: `registry.json`

**Step 1: Build the registry**

This is the largest single file. It must contain every component:
- 94 skills from `skills/` directory (read each SKILL.md frontmatter for name + description, derive trigger keywords)
- 18 agents from `agents/` directory (read YAML frontmatter)
- 48 commands from `commands/` directory (read YAML frontmatter)
- 3 contexts from `contexts/` directory

Structure:

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-03-16",
  "skills": [
    {
      "name": "tdd-workflow",
      "path": "skills/tdd-workflow/SKILL.md",
      "triggers": ["test", "tdd", "failing test", "red-green", "coverage", "write tests first"]
    }
  ],
  "agents": [
    {
      "name": "planner",
      "file": "agents/planner.md",
      "model": "opus",
      "delegateWhen": "feature planning, implementation blueprint, PRD, complex refactoring"
    }
  ],
  "commands": [
    {
      "command": "/tdd",
      "file": "commands/tdd.md",
      "description": "Enforce test-driven development workflow",
      "suggestWhen": "user describes a bug fix or new feature without mentioning tests"
    }
  ],
  "contexts": [
    {
      "name": "dev",
      "file": "contexts/dev.md",
      "invokedVia": "/context dev",
      "description": "Active development mode — code first, explain after"
    }
  ]
}
```

**Step 2: Populate by scanning all directories**

For each skill in `skills/*/SKILL.md`:
- Read frontmatter for name and description
- Derive trigger keywords from description + first paragraph of content
- Add entry to skills array

For each agent in `agents/*.md`:
- Read YAML frontmatter (name, description, model, tools)
- Derive delegateWhen from description
- Add entry to agents array

For each command in `commands/*.md`:
- Read YAML frontmatter (description)
- Derive suggestWhen from description
- Add entry to commands array

For each context in `contexts/*.md`:
- Read first few lines for mode description
- Add entry to contexts array

**Step 3: Commit**

```bash
git add registry.json
git commit -m "feat: create registry.json with all 93+ component entries"
```

---

### Task 8: Create `scripts/sync-registry.js`

**Files:**
- Create: `scripts/sync-registry.js`

**Step 1: Write the sync script**

```javascript
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPluginRoot } = require('./lib/plugin-root');

const root = getPluginRoot();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf-8'));

let md = `# LABS Component Registry\n\n`;
md += `> Auto-generated from registry.json by sync-registry.js. Do not edit manually.\n`;
md += `> Version: ${registry.version} | Components: ${
  registry.skills.length + registry.agents.length + registry.commands.length + registry.contexts.length
}\n\n`;

// Skills table
md += `## Skills (${registry.skills.length})\n\n`;
md += `| name | triggers |\n|------|----------|\n`;
for (const s of registry.skills) {
  md += `| ${s.name} | ${s.triggers.join(', ')} |\n`;
}

md += `\n## Agents (${registry.agents.length})\n\n`;
md += `| name | model | delegate when |\n|------|-------|---------------|\n`;
for (const a of registry.agents) {
  md += `| ${a.name} | ${a.model} | ${a.delegateWhen} |\n`;
}

md += `\n## Commands (${registry.commands.length})\n\n`;
md += `| command | suggest when |\n|---------|-------------|\n`;
for (const c of registry.commands) {
  md += `| ${c.command} | ${c.suggestWhen} |\n`;
}

md += `\n## Contexts (${registry.contexts.length})\n\n`;
md += `| name | invoked via | description |\n|------|------------|-------------|\n`;
for (const ctx of registry.contexts) {
  md += `| ${ctx.name} | ${ctx.invokedVia} | ${ctx.description} |\n`;
}

fs.writeFileSync(path.join(root, 'REGISTRY.md'), md);
console.log(`REGISTRY.md generated: ${
  registry.skills.length + registry.agents.length + registry.commands.length + registry.contexts.length
} components`);
```

**Step 2: Run it**

Run: `node scripts/sync-registry.js`
Expected: `REGISTRY.md generated: 163 components` (approximate)

**Step 3: Verify REGISTRY.md was created**

Run: `wc -l REGISTRY.md`
Expected: ~180-220 lines

**Step 4: Commit**

```bash
git add scripts/sync-registry.js REGISTRY.md
git commit -m "feat: add sync-registry.js and generate REGISTRY.md"
```

---

### Task 9: Create `scripts/validate-registry.js`

**Files:**
- Create: `scripts/validate-registry.js`

**Step 1: Write the validator**

```javascript
#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { getPluginRoot } = require('./lib/plugin-root');

const root = getPluginRoot();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'registry.json'), 'utf-8'));

let errors = 0;

function check(label, filePath) {
  const full = path.join(root, filePath);
  if (!fs.existsSync(full)) {
    console.error(`MISSING: [${label}] ${filePath}`);
    errors++;
  }
}

for (const s of registry.skills) check(`skill:${s.name}`, s.path);
for (const a of registry.agents) check(`agent:${a.name}`, a.file);
for (const c of registry.commands) check(`cmd:${c.command}`, c.file);
for (const ctx of registry.contexts) check(`ctx:${ctx.name}`, ctx.file);

if (errors === 0) {
  console.log(`All ${
    registry.skills.length + registry.agents.length + registry.commands.length + registry.contexts.length
  } registry paths verified.`);
} else {
  console.error(`${errors} missing paths found.`);
  process.exit(1);
}
```

**Step 2: Run it**

Run: `node scripts/validate-registry.js`
Expected: `All 163 registry paths verified.` (or errors pointing to files we need to fix)

**Step 3: Commit**

```bash
git add scripts/validate-registry.js
git commit -m "feat: add validate-registry.js for path verification"
```

---

## Phase 5: Context Command & Hook Profile Default

### Task 10: Create `/context` command

**Files:**
- Create: `commands/context.md`

**Step 1: Write the context switching command**

```markdown
---
description: Switch behavioral context mode. Usage: /context [dev|research|review]
---

## Context Switching

Load a behavioral context that changes how Claude approaches tasks.

### Available contexts:
- `dev` — Active development. Code first, explain after. Priorities: working → right → clean.
- `research` — Exploration mode. Read widely, document findings, don't code until understanding is clear.
- `review` — PR review mode. Prioritize by severity. Suggest fixes, don't just flag problems.

### Process:
1. Read the argument to determine which context
2. Read the corresponding file from `contexts/<name>.md`
3. Apply the behavioral mode for the rest of the session
4. Confirm to the user which mode is active

If no argument provided, show the list of available contexts.
```

**Step 2: Commit**

```bash
git add commands/context.md
git commit -m "feat: add /context command for behavioral mode switching"
```

---

### Task 11: Set default hook profile to minimal

**Files:**
- Modify: `CLAUDE.md` (already done in Task 6, just verify the profile documentation is there)
- Modify: `scripts/hooks/run-with-flags.js` (verify default profile fallback)

**Step 1: Read `scripts/lib/hook-flags.js`**

Verify the default profile when `ECC_HOOK_PROFILE` is unset. ECC defaults to `standard`. We want `minimal`.

**Step 2: Patch hook-flags.js default**

Change the default profile from `'standard'` to `'minimal'` in the `isHookEnabled()` function.

**Step 3: Test**

Run: `ECC_HOOK_PROFILE= node -e "const {isHookEnabled} = require('./scripts/lib/hook-flags'); console.log(isHookEnabled('test', {profiles: 'minimal,standard,strict'}))"`
Expected: `true` (minimal profile should match)

Run: `ECC_HOOK_PROFILE= node -e "const {isHookEnabled} = require('./scripts/lib/hook-flags'); console.log(isHookEnabled('test', {profiles: 'standard,strict'}))"`
Expected: `false` (standard-only hook should NOT fire on minimal)

**Step 4: Commit**

```bash
git add scripts/lib/hook-flags.js
git commit -m "feat: default hook profile to minimal for lean idle overhead"
```

---

## Phase 6: Validation & Testing

### Task 12: Run full validation

**Step 1: Validate registry paths**

Run: `node scripts/validate-registry.js`
Expected: All paths verified

**Step 2: Verify REGISTRY.md is in sync**

Run: `node scripts/sync-registry.js`
Expected: No changes to REGISTRY.md (already generated)

**Step 3: Verify hook dispatcher works**

Run: `echo '{}' | ECC_HOOK_PROFILE=minimal node scripts/hooks/run-with-flags.js session:start scripts/hooks/session-start.js minimal,standard,strict`
Expected: Session start output (previous session summary or clean start)

**Step 4: Verify plugin structure**

Run: `ls .claude-plugin/plugin.json && echo "Plugin manifest exists"`
Expected: Plugin manifest exists

**Step 5: Spot-check a few skills exist**

Run: `ls skills/tdd-workflow/SKILL.md skills/verification-loop/SKILL.md skills/security-review/SKILL.md`
Expected: All three files listed

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "chore: validation fixes"
```

---

### Task 13: Final commit & push preparation

**Step 1: Review git log**

Run: `git log --oneline`
Expected: Clean commit history showing the fork + our additions

**Step 2: Create GitHub repo (manual or via gh)**

```bash
gh repo create prana/labs --private --source=. --push
```

Or if manual: create repo on GitHub, then:

```bash
git remote add origin https://github.com/<user>/labs.git
git push -u origin main
```

---

## Phase 7: Install & Smoke Test

### Task 14: Install as Claude Code plugin

**Step 1: Install the plugin**

```bash
claude plugin add /c/Users/prana/Projekts/LABS
```

Or if using a git-based install:

```bash
claude plugin add <github-url>
```

**Step 2: Verify plugin loads**

Start a new Claude Code session and verify:
- REGISTRY.md is readable (check that skills/agents/commands are listed)
- No errors from hooks on session start
- `/tdd` command is recognized
- `/context dev` loads the dev context
- Typing a test-related task triggers tdd-workflow skill loading

**Step 3: Verify session persistence**

Run: `/save-session`
Expected: Session file created in `~/.claude/sessions/`

Run: (new session) `/resume-session`
Expected: Previous session loaded

---

## Summary: Implementation Order

| Phase | Tasks | Commits | Blocking? |
|-------|-------|---------|-----------|
| 1: Fork & Clean | 1-2 | 2 | Yes — everything depends on having the repo |
| 2: Plugin Root | 3-4 | 2 | Yes — hooks break without this |
| 3: Manifest & CLAUDE.md | 5-6 | 2 | Yes — plugin identity |
| 4: Dual Registry | 7-9 | 3 | Yes — core innovation |
| 5: Context & Profiles | 10-11 | 2 | No — enhancement |
| 6: Validation | 12 | 1 | Yes — catches errors |
| 7: Install & Test | 13-14 | 1 | Final verification |

**Total: 14 tasks, ~13 commits, 7 phases**
