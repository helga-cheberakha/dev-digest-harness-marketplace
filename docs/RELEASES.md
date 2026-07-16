# Releases

## Versioning

Every plugin uses [SemVer](https://semver.org/) in its own
`plugins/<name>/.claude-plugin/plugin.json`:

- **patch** (`1.0.1`) — bug fixes, wording/content corrections, no
  behavior change for existing users.
- **minor** (`1.1.0`) — new skills/agents/capabilities added,
  backward-compatible.
- **major** (`2.0.0`) — breaking change: a skill/agent is removed or its
  contract changes, a `name` is renamed (see below), a dependency's
  required version bumps major.

Claude Code resolves a plugin's version from, in order: `version` in
`plugin.json` → `version` in the marketplace entry → the git commit SHA.
This catalog always sets `version` in `plugin.json` and nowhere else —
**bump it on every release**, or updates silently stop reaching users.

## When to touch `.claude-plugin/marketplace.json`

**Only when adding a brand-new plugin** (a new entry in the `plugins`
array) or removing/renaming one (via the top-level `renames` map). A
version bump of an existing plugin happens entirely inside that plugin's
own `plugin.json` + `CHANGELOG.md` — the catalog file does not change and
does not need a new PR review from the whole team.

## Process

1. Bump `version` in `plugins/<name>/.claude-plugin/plugin.json`.
2. Add an entry at the top of `plugins/<name>/CHANGELOG.md`:
   ```markdown
   ## 1.1.0 — 2026-08-01
   - Added `zod` skill.
   ```
3. Run local checks (`claude plugin validate ./plugins/<name>`,
   `node scripts/validate-marketplace.mjs`).
4. Open a PR; once merged, tag the release:
   `git tag <plugin-name>-v<version>` and push the tag.
5. If the plugin is depended on by another plugin in this catalog
   (`sdd-engineering` depends on the other three), check whether the
   dependent's `dependencies` semver range (e.g. `^1.0.0`) still allows the
   new version; if not, this is a breaking change for the dependent too.

## Rollback

If a released version turns out to be broken, re-pin the plugin's `source`
in `marketplace.json` to the previous good `sha` (git-based sources
support `{ "source": "github", "repo": "...", "sha": "<previous-commit>" }`)
rather than force-reverting the plugin's own `version` field, since the
version string alone doesn't tell Claude Code which commit to fetch. Once
a fixed version ships, remove the `sha` pin again so normal version
resolution resumes. `scripts/rollback.mjs` automates this re-pin.

## History

| Plugin | Version | Date | Notes |
| --- | --- | --- | --- |
