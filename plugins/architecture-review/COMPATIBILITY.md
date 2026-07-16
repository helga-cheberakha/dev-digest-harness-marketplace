# Compatibility

- **Claude Code: requires v2.1.196 or later.** This plugin relies on
  plugin dependency constraints (`dependencies` in `plugin.json`,
  resolved against `engineering-paved-path ^1.0.0`) and coordinated
  enable/disable across dependent plugins.
- **Requires `engineering-paved-path` ^1.0.0** to be installed — its
  skills are loaded by name in this agent's frontmatter.
- **Stack assumptions:** several loaded skills (`fastify-best-practices`,
  `drizzle-orm-patterns`, `postgresql-table-design`, `next-best-practices`)
  assume a TypeScript/Node stack. The agent explicitly skips a skill and
  notes it under "Not Investigated" when the host project doesn't use
  that part of the stack.
- **Requires the host project to supply its own rule catalog** — a fresh
  install with no project-specific rules still applies the one
  stack-agnostic rule (`inward-only-dependencies`) but won't catch
  project-specific violations until the project documents them (see the
  agent's "Rule catalog" section).
- **No external tool dependencies** — no bundled scripts, hooks, or MCP
  servers.
