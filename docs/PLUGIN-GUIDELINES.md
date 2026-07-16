# Plugin Guidelines — how our plugins are built

The reference every plugin in this catalog follows: structure, manifest
fields, and dependency rules.

## Directory structure

```
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json                 # REQUIRED
├── skills/
│   └── <skill>/SKILL.md            # optional
├── agents/*.md                     # optional
├── evals/                          # optional — behavioral tests
├── README.md
├── CHANGELOG.md
└── COMPATIBILITY.md
```

The directory `name` = `name` in `plugin.json` = `name` of the entry in
`.claude-plugin/marketplace.json`. All `kebab-case`.

## `plugin.json` — the manifest

Required fields:

| Field | Type | Note |
| --- | --- | --- |
| `name` | string | kebab-case, public, **effectively immutable** after publication |
| `version` | string | SemVer; controls updates (see `RELEASES.md`) |
| `description` | string | short purpose statement |
| `author` | object | `{ "name": "...", "email": "..." }` (`name` required). Effectively required: per-plugin CI runs `claude plugin validate --strict`, which fails on a missing-author warning |

Recommended:

| Field | Type | Note |
| --- | --- | --- |
| `repository` | **string** | URL string, **NOT** an object `{type,url}` (object → validation error) |
| `displayName` | string | UI label; may contain spaces/casing |
| `keywords` | array | array of strings (not a string!) — also used as the site's search tags, no separate `tags` field |
| `homepage`, `license` | string | optional |
| `category` | string | small fixed set (`engineering-skills`, `research`, `review`, `workflow`) — used by the catalog site's filters, see `docs/SITE-SPEC.md` |
| `status` | string | `planned` \| `in-progress` \| `released` — set on the **marketplace entry** (not `plugin.json`); used by the catalog site, replaces the free-text status column in the root `README.md` table |

Example:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json",
  "name": "engineering-paved-path",
  "version": "1.0.0",
  "description": "Shared engineering skills for the team.",
  "author": { "name": "Helga Cheberakha" },
  "repository": "https://github.com/<owner>/dev-digest-harness-marketplace"
}
```

## Component rules

- **Paths to scripts/files** in hooks and MCP configs go through
  `${CLAUDE_PLUGIN_ROOT}` (a plugin is copied into the cache
  `~/.claude/plugins/cache` on install). Inside a skill's own scripts,
  prefer `${CLAUDE_SKILL_DIR}`. For state that must survive updates, use
  `${CLAUDE_PLUGIN_DATA}`.
- **Do not reference paths outside the plugin directory** (`../`) — those
  files are not copied. For shared files, use a symlink inside the
  directory.
- `strict` defaults to `true` — `plugin.json` is the source of truth for
  components.

## Cross-plugin dependencies

- Extract shared skills/agents into a single canonical source
  (`engineering-paved-path`) rather than duplicating them.
- `dependencies` in `plugin.json` is an **array** of
  `{ "name", "version" }` entries — a semver range like `"^1.0.0"` — never
  an object map.
- Reference dependency components **namespaced**:
  `engineering-paved-path:react-best-practices`,
  `research-tools:researcher`. Never use a bare name for a component that
  lives in another plugin.
- Pin dependency versions with constraints so the installer can show the
  full dependency graph before confirmation.

## Before a PR

```bash
claude plugin validate ./plugins/<name>   # manifest + frontmatter shape
claude --plugin-dir ./plugins/<name>       # plugin actually loads, no missing-skill warnings
```

Schema validation checks **shape**; evals check **behavior**. Keep both
where a plugin's correctness depends on more than well-formed JSON/YAML
(e.g. an agent's review output format).
