# dev-digest-harness-marketplace

A Claude Code plugin marketplace: reusable engineering-harness components
(skills, agents, hooks) extracted from the DevDigest project and packaged
for reuse across other projects and teams.

This repository is separate from the DevDigest product repo on purpose —
the marketplace has different users, owners, and a different release
cadence. A DevDigest product change should not cut a new plugin version,
and a skill/agent change here should not require a DevDigest release.

## Usage

Add the marketplace (once):

```
/plugin marketplace add <owner>/dev-digest-harness-marketplace
```

Install a plugin:

```
/plugin install <plugin-name>@dev-digest-harness-marketplace
```

`<plugin-name>` is the `name` of an entry in `.claude-plugin/marketplace.json`.

### Updating (two different things)

| Command | What it does |
| --- | --- |
| `/plugin marketplace update` | Refreshes the **catalog** — pulls the list of available plugins/versions |
| `/plugin update <plugin>@dev-digest-harness-marketplace` | Updates an already **installed plugin** to a new version |

Refreshing the catalog does not update installed plugins by itself.

## Plugins

| Plugin | Status | Description |
| --- | --- | --- |
| `engineering-paved-path` | in progress | Shared engineering best-practice skills: React, Next.js, Fastify, testing, security, architecture, and full-stack foundations. |
| `research-tools` | in progress | Read-only research agent that gathers and fact-checks information from the codebase or the public web. |
| `architecture-review` | in progress | Read-only architecture reviewer that audits diffs against structural conventions. Depends on `engineering-paved-path`. |
| `sdd-engineering` | in progress | Spec-Driven Development workflow: spec, plan, implement, verify, retro. Depends on the three plugins above. |

## Repository layout

```
.claude-plugin/marketplace.json   the catalog (plugin registry)
plugins/<name>/                   one directory per plugin
docs/                             contributor + policy docs
scripts/validate-marketplace.mjs  structural linter (runs in CI)
scripts/build-index.mjs           generates the static catalog site's data
.github/workflows/validate.yml    CI on every pull request (required check)
.github/workflows/site-build.yml  builds the static catalog site
.github/workflows/pages.yml       deploys the site to GitHub Pages
site/                             static catalog UI (GitHub Pages)
CODEOWNERS · CONTRIBUTING.md
```

## Contributing

Before opening a PR, read [`CONTRIBUTING.md`](./CONTRIBUTING.md) and
[`docs/PLUGIN-GUIDELINES.md`](./docs/PLUGIN-GUIDELINES.md). Every PR runs an
automated check (`.github/workflows/validate.yml`): the structural linter
plus `claude plugin validate`.

> **Recommendation:** make `Validate marketplace` a **required status
> check** in branch protection on `main`, so a PR cannot merge without a
> green check, regardless of approvals.

## Principles

- **Explore first, standardise later** — don't over-engineer governance
  before a few real plugins exist.
- **Pin versions, don't auto-update** external dependencies; update
  deliberately.
- **Portability:** keep `SKILL.md` compatible (Markdown + YAML
  frontmatter) with other agents, not just Claude Code.
