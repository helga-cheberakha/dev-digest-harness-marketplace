# Compatibility

- **Claude Code: requires v2.1.196 or later.** This plugin relies on
  plugin **dependency constraints** (`dependencies` in `plugin.json`,
  resolved against the three other catalog plugins at `^1.0.0`),
  **coordinated enable/disable** across dependent plugins (disabling
  `engineering-paved-path` while `sdd-engineering` is enabled is blocked,
  with guidance to disable dependents first), and **resolution-tag**
  behavior for local-folder marketplaces (installing this catalog via
  `/plugin marketplace add ./path` while iterating locally). Earlier
  versions either lack these mechanisms or handle them differently.
- **Requires all three other catalog plugins** (`engineering-paved-path`,
  `research-tools`, `architecture-review`) at `^1.0.0` — declared in
  `plugin.json` `dependencies`. The installer resolves and displays this
  dependency graph before confirming installation.
- **`AskUserQuestion` limitation:** `spec-creator` and
  `implementation-planner` both note that `AskUserQuestion` does not
  function when the agent runs as a subagent (the common case, spawned by
  an orchestrator); both fall back to returning a structured "Questions
  for the user" block instead. This is a Claude Code platform behavior,
  not specific to this plugin.
- **`workflow-retro` deep mode** requires local filesystem access to
  `~/.claude/projects/<project-slug>/.../subagents/*.jsonl` — only
  meaningful when run in the same Claude Code installation that ran the
  workflow being retro'd.
- **Stack assumptions:** the loaded `engineering-paved-path` skills lean
  TypeScript/Node; the agents themselves (spec format, planning process,
  verification logic) are stack-agnostic.
