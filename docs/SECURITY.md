# Security Policy

## Reporting a vulnerability

Open a private security advisory on this repository (or contact the
maintainer listed in `CODEOWNERS`) rather than a public issue, if the
finding involves a way to make an installed plugin run unintended commands
or exfiltrate data.

## What's checked before a plugin is admitted or updated

- **No secrets** committed anywhere in a plugin directory — `plugin.json`
  may *declare* a config slot via `userConfig` (with `sensitive: true`),
  but must never contain a credential value.
- **No absolute paths** (`/Users/...`, `/home/...`, `C:\...`). All paths go
  through `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_SKILL_DIR}`, or
  `${CLAUDE_PLUGIN_DATA}`.
- **No path traversal.** A plugin's `source` in `marketplace.json` must not
  contain `..`; a plugin's own files must not reference anything outside
  its own directory.
- **Hooks and MCP servers get closer scrutiny** than skills/agents, because
  they execute automatically. Any `hooks/hooks.json` or `.mcp.json` in a
  plugin is read line-by-line before merge: what command runs, on which
  event, with what arguments, and whether it can be triggered by
  attacker-controlled input (e.g. content read from a file the agent was
  asked to summarize).
- **Agents with `Write`/`Edit`/`Bash` tool access** are reviewed for scope:
  does the agent's own instructions constrain it to read-only analysis, or
  does it modify files? Read-only agents (`research-tools:researcher`,
  `architecture-review:architecture-reviewer`) declare only
  `Read`/`Bash`/`Glob`/`Grep`/`WebSearch`/`WebFetch` in their frontmatter —
  no `Edit`/`Write`.
- **Dependency versions are pinned**, not left to float, so a compromised
  upstream commit doesn't silently reach installed users (see
  `RELEASES.md`).

## Reporting a vulnerability found in an installed plugin's behavior

If a plugin does something its manifest/description doesn't disclose
(reads files it shouldn't need, makes network calls not documented in its
`README.md`), treat it as a security bug: disable the plugin
(`claude plugin disable <plugin>`), then report it the same way as above.
