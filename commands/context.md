---
description: Switch behavioral context mode. Usage: /context [dev|research|review]
---

## Context Switching

Load a behavioral context that changes how Claude approaches tasks for the rest of the session.

### Available contexts:

- **dev** — Active development. Code first, explain after. Priorities: working → right → clean.
- **research** — Exploration mode. Read widely, document findings, don't code until understanding is clear.
- **review** — PR review mode. Prioritize by severity. Suggest fixes, don't just flag problems.

### Process:

1. Read the argument to determine which context
2. Read the corresponding file from `contexts/<name>.md` (relative to plugin root)
3. Apply the behavioral mode for the rest of the session
4. Confirm to the user which mode is active

If no argument provided, show the list of available contexts and ask which one to activate.

### Examples:

- `/context dev` → loads contexts/dev.md, confirms "Development mode active"
- `/context research` → loads contexts/research.md, confirms "Research mode active"
- `/context review` → loads contexts/review.md, confirms "Review mode active"
- `/context` → shows available contexts and asks user to choose
