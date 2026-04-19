# Combined Superpowers + Planning-with-Files Workflow

## Philosophy

| Tool | Handles |
|------|---------|
| **Planning-with-Files** | Persistent context, session recovery, progress tracking |
| **Superpowers** | Workflow discipline, TDD, code review |

```
PWF = "What's my progress?"
Superpowers = "How do I implement correctly?"
```

## When to Use Each

### Planning-with-Files (PWF)
- Multi-step tasks (3+ phases)
- Research tasks
- Tasks spanning sessions
- Complex projects with many components

### Superpowers Skills
| Skill | When |
|-------|------|
| `brainstorming` | Before building anything new |
| `writing-plans` | After design approved |
| `subagent-driven-development` | Execute plan with fresh subagents |
| `test-driven-development` | During implementation |
| `verification-before-completion` | Before claiming done |
| `requesting-code-review` | Between tasks |
| `finishing-a-development-branch` | After implementation complete |

## Combined Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PLANNING-WITH-FILES (PWF)                                │
│ ─────────────────────────────────────────────────────────── │
│ • Create task_plan.md, findings.md, progress.md             │
│ • Define goal, phases, requirements                        │
│ • Store research and discoveries                            │
│ • Update after each session                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SUPERPOWERS: brainstorming                              │
│ ─────────────────────────────────────────────────────────── │
│ • Use PWF's findings as input                              │
│ • Refine design through questions                          │
│ • Present design, get approval                             │
│ • Save to docs/superpowers/specs/                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SUPERPOWERS: writing-plans                              │
│ ─────────────────────────────────────────────────────────── │
│ • Convert design spec into implementation tasks            │
│ • Break into 2-5 minute bite-sized tasks                  │
│ • Save to docs/superpowers/plans/                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SUPERPOWERS: subagent-driven-development                 │
│ ─────────────────────────────────────────────────────────── │
│ • Use PWF's task_plan.md for phase context                │
│ • Dispatch fresh subagent per task                        │
│ • Two-stage review: spec compliance → code quality       │
│ • Update PWF's progress.md after each task                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. SUPERPOWERS: finishing-a-development-branch             │
│ ─────────────────────────────────────────────────────────── │
│ • Verify all tests pass                                    │
│ • Present merge/PR options                                 │
│ • Clean up worktree                                       │
└─────────────────────────────────────────────────────────────┘
```

## Session Recovery Flow

```
/clear triggered
       ↓
PWF Stop hook fires
       ↓
planning files saved with current state
       ↓
Next session starts
       ↓
Run: python3 ~/.config/opencode/skills/planning-with-files/scripts/session-catchup.py "$(pwd)"
       ↓
Read task_plan.md, progress.md, findings.md
       ↓
Continue from current phase
```

## Key Files Location

| File | Purpose | Location |
|------|---------|----------|
| `task_plan.md` | Phase tracking | Project root |
| `findings.md` | Research storage | Project root |
| `progress.md` | Session log | Project root |
| Design specs | Superpowers designs | `docs/superpowers/specs/` |
| Implementation plans | Superpowers plans | `docs/superpowers/plans/` |
| Templates | PWF templates | `~/.config/opencode/skills/planning-with-files/templates/` |

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Use both for same thing | PWF for persistence, Superpowers for workflow |
| Skip PWF, rely on context | Always create planning files first |
| Skip Superpowers, code immediately | Always brainstorm → plan → implement |
| Update PWF only at end | Update after each phase |
| Skip TDD | Write failing test first |

## Quick Reference Commands

```bash
# Start planning session (PWF)
# 1. Create planning files
# 2. Use brainstorming skill

# Session recovery (PWF)
python3 ~/.config/opencode/skills/planning-with-files/scripts/session-catchup.py "$(pwd)"

# Check completion (PWF Stop hook)
sh ~/.config/opencode/skills/planning-with-files/scripts/check-complete.sh

# Load Superpowers skill
skill tool to load brainstorming
skill tool to load writing-plans
skill tool to load subagent-driven-development
```
