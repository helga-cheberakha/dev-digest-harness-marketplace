# Contributing to the marketplace

This document explains not only *how to install* a plugin, but **how to
change the catalog safely**. Every PR runs an automated check
(`.github/workflows/validate.yml`) — but you should know the rules below
before running it.

## General rules

- **Naming:** all `name` fields (marketplace and plugins) are `kebab-case`,
  no spaces. A plugin's `name` is public and **effectively immutable**
  after publication (renaming breaks users' installs). Use `displayName`
  for the UI label; use the top-level `renames` map in
  `.claude-plugin/marketplace.json` to rename/remove a plugin.
- **No secrets and no absolute paths** in manifests or components. A
  manifest may *name* a secret slot (`userConfig`), but must not contain a
  credential. Absolute paths (`/Users/...`, `/home/...`) are forbidden —
  use `${CLAUDE_PLUGIN_ROOT}` (or `${CLAUDE_SKILL_DIR}` inside a skill's own
  scripts).
- **Do not reach outside the plugin directory** with `../` — on install the
  plugin is copied into a local cache, and such files won't be copied.

## Required plugin structure

Full details are in [`docs/PLUGIN-GUIDELINES.md`](./docs/PLUGIN-GUIDELINES.md).
Minimum:

```
plugins/<name>/
└── .claude-plugin/plugin.json      # name, version, description, author
```

Required `plugin.json` fields: `name`, `version` (SemVer), `description`,
`author`. `repository`, if present, is a **string URL**, not an object.

## Dependencies

- Shared skills/agents have a single canonical source (`engineering-paved-path`)
  rather than being duplicated across plugins.
- `dependencies` in `plugin.json` is an **array** of `{ "name", "version" }`
  entries (a semver range like `"^1.0.0"`), never an object map.
- Reference components from a dependency plugin **namespaced**
  (`engineering-paved-path:react-best-practices`), never by a bare name.

## Contribution steps

1. **Validate scope** — confirm a new plugin actually fits the catalog
   before building it.
2. **Create the plugin directory** following the structure in
   [`docs/PLUGIN-GUIDELINES.md`](./docs/PLUGIN-GUIDELINES.md).
3. **Add an entry** to `.claude-plugin/marketplace.json`:
   `{ "name": "...", "source": "./plugins/..." }`.
   - ⚠️ Touch the catalog **only when adding a new** plugin. Bumping an
     existing plugin's version/description happens in its own
     `plugin.json` and does **not** require editing `marketplace.json`.
4. **Add an owner** in [`CODEOWNERS`](./CODEOWNERS): a line
   `/plugins/<name>/ @you`.
5. **Update the plugin's `CHANGELOG.md`** (see
   [`docs/RELEASES.md`](./docs/RELEASES.md)).
6. **Local checks** before opening the PR:
   ```bash
   claude plugin validate ./plugins/<name>
   claude plugin validate .
   node scripts/validate-marketplace.mjs
   ```
7. **Open the PR.** CI (`.github/workflows/validate.yml`) must be green —
   this should be a required status check on `main`.

## Review and release

- A plugin's owner (from `CODEOWNERS`) reviews changes to that plugin;
  adding a new plugin to the catalog is approved by the repo maintainer(s).
- Release flow (SemVer, tags, rollback):
  [`docs/RELEASES.md`](./docs/RELEASES.md).
- Permissions/secrets policy: [`docs/SECURITY.md`](./docs/SECURITY.md).
