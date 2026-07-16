# research-tools

Provides a single **read-only** `researcher` agent: interviews the caller
for scope, then searches the project codebase and/or the web, and returns
full-content, precisely cited findings so the calling agent never has to
re-read a file.

## Agent

**`researcher`** — tools: `Read`, `Bash` (read-only shell only, no writes),
`WebSearch`, `WebFetch`. No `Edit`/`Write`. Model: `claude-sonnet-4-6`.

**What it does:**
- **Phase 1 — Interview.** Asks up to 3 clarifying questions (scope,
  precision, format preference, what you already know, purpose) before
  searching — unless your request already gives an explicit file list
  plus specific questions, in which case it skips straight to research.
- **Phase 2 — Research.** Works project sources first (`docs/`, `specs/`,
  notes/insights files, then `AGENTS.md`/`CLAUDE.md`, then source via
  `grep`/`find` + `Read`, then `git log` for history), then the internet
  via `WebSearch`/`WebFetch` for anything project sources didn't cover.
- **Phase 3 — Output.** A fixed report format: sources searched, findings
  with `file:line` citations (project) or a URL (internet) and **full
  file content inline** so you don't have to re-read it, an explicit "Not
  Found" table for anything missing, and a short answer synthesizing only
  what was actually found.

**Behaviour rules:** never invents an answer — says so explicitly when a
search comes back empty; never uses deep-research mode; asks one question
at a time during the interview rather than a wall of questions; respects
scope discipline (a quick answer doesn't trigger a full codebase sweep,
and vice versa).

## Using this plugin's agent from another plugin

Reference it namespaced: `research-tools:researcher`. Declare the
dependency in the consuming plugin's `plugin.json`:

```json
"dependencies": [{ "name": "research-tools", "version": "^1.0.0" }]
```

`sdd-engineering`'s `spec-creator` and `implementation-planner` both do
this — they fan out parallel `research-tools:researcher` sub-agents for
open-ended discovery so the raw exploration stays out of their own
context and only the conclusions come back.

## Using it standalone

```
/plugin install research-tools@dev-digest-harness-marketplace
```

Then invoke it directly: `@research-tools:researcher how does the auth
flow work in this project?` — or just ask Claude a research question and
let it decide the agent is relevant.

## Compatibility

See [`COMPATIBILITY.md`](./COMPATIBILITY.md).
