# Site Spec

## Purpose

A static catalog UI, published via GitHub Pages, that lets a human search
and browse everything in this marketplace — plugins, and the skills/agents
each one ships — and copy a ready-to-run install command. This is **not**
part of the Claude Code plugin-marketplace mechanism: Claude Code reads
`.claude-plugin/marketplace.json` directly and never touches `site/`. The
site exists purely so a human can discover a plugin/skill/agent in a
browser by describing what they need in their own words.

## Constraints

GitHub Pages is static hosting only — no server, no database, no API
endpoints we control. Everything that looks dynamic is either:

1. **Computed at build time** (GitHub Actions runs a Node script that
   reads the repo's manifests/markdown and writes static JSON/XML), or
2. **Computed at request time in the browser** from those static files
   (search, filtering, the dependency graph, the install command).

There is no step where the site calls back to anything we host. The only
network calls the page makes are `fetch()` against files served from its
own origin.

## Status

Not yet built. `site/` does not exist on disk yet. This spec is written
*before* any real plugin has been registered (`marketplace.json.plugins`
is currently `[]`) so the pipeline is ready the moment
`engineering-paved-path` (the first planned plugin) lands. See "Open
items" at the end — a few things here need re-checking against a real
`SKILL.md`/agent file once one exists.

## Data pipeline

Extend `scripts/build-index.mjs` (currently reads only
`marketplace.json` + each `plugin.json`) to also read:

- `plugins/<name>/skills/*/SKILL.md` frontmatter (`name`, `description`)
- `plugins/<name>/agents/*.md` frontmatter (`name`, `description`, `tools`)
- `plugins/<name>/CHANGELOG.md` — entries in the format already fixed by
  `docs/RELEASES.md`: `## <version> — <date>` headings followed by a
  bullet list. Parsed with a small regex splitter, no changelog-parser
  dependency needed.

Frontmatter itself is read with a minimal hand-rolled extractor (split on
the `---\n...\n---` block, parse flat `key: value` lines) — not a full
YAML parser. This runs only in the Node build script, so it never affects
the browser bundle; it's kept minimal to match this repo's current
zero-dependency `scripts/` style rather than pulling in `gray-matter` for
two fields.

**Inheritance rule:** a skill or agent does not carry its own
`category`/`status` — it inherits both from its parent plugin. Tagging
every individual skill would be busywork with no real payoff at this
catalog's size; the plugin is the unit of classification, the
skill/agent is a unit of full-text search only (its `name` +
`description` feed the index, nothing else).

### Output files (`site/public/`, generated on every build, not committed)

| File | Contents |
| --- | --- |
| `catalog.json` | One entry per plugin — existing shape from today's `build-index.mjs`, plus `status`, `license`, and a `components` count (`{skills, agents}`). |
| `search-index.json` | Flattened: one entry per **searchable unit** — a plugin, a skill, or an agent. Shape below. |
| `changelog.json` | Every plugin's `CHANGELOG.md` entries merged and sorted by date, newest first. |
| `feed.xml` | RSS 2.0 built from the same changelog entries. |
| `plugins/<name>.json` | Full detail for one plugin: everything in its `catalog.json` row + raw `README.md` text + its own filtered changelog + its skills/agents with descriptions. Powers the detail page and doubles as a static per-plugin "API" response. |
| `badge.svg` | One marketplace-wide badge (not per-plugin — see "Explicitly out of scope"). |

`search-index.json` entry shape:

```jsonc
{
  "id": "engineering-paved-path:react-best-practices",
  "type": "skill",              // "plugin" | "skill" | "agent"
  "name": "react-best-practices",
  "displayName": "React Best Practices",
  "description": "…",
  "pluginName": "engineering-paved-path",
  "category": "engineering-skills",   // inherited from the plugin
  "keywords": ["react", "frontend"],  // inherited from the plugin
  "version": "1.0.0",                 // the plugin's version
  "status": "in-progress",
  "path": "plugin.html?name=engineering-paved-path#react-best-practices"
}
```

A plugin's own entry (`type: "plugin"`) has `pluginName` equal to its own
`name` and `path` pointing at the detail page with no anchor.

### Schema additions this requires

Two fields are new and need to be documented in
`docs/PLUGIN-GUIDELINES.md` and enforced by
`scripts/validate-marketplace.mjs` (both optional — must not break an
empty `plugins: []` today):

- **`category`** (string) — already read by `build-index.mjs`
  (`entry.category`) but never documented or validated. A small fixed
  set, e.g. `engineering-skills | research | review | workflow`
  (matches the four plugins' roles in `docs/PLUGINS-SPEC.md`).
- **`status`** (string enum: `planned | in-progress | released`) — does
  not exist as data anywhere today; the only place a plugin's status
  lives is free text in the `README.md` table. The site needs this as a
  real field to filter/badge by. Lives on the marketplace entry (or
  `plugin.json` — marketplace entry is simpler since `README.md`'s table
  already tracks status at that level).

`keywords` (already an existing, documented field) is reused as the tag
source — no separate `tags` field is introduced.

## Index / search page

One page, `site/index.html`. Cards for every entry in
`search-index.json` — plugins, skills, and agents appear side by side,
distinguished by a type badge, so a query like "architecture review skill"
surfaces `architecture-review` (the plugin) *and*
`architecture-reviewer` (the agent) if either matches.

- **Search**: client-side, vendored **Fuse.js** (`site/vendor/fuse.min.js`
  — checked into git, not loaded from a CDN, so the page has no
  third-party runtime dependency and still works if a CDN is down).
  Weighted keys, highest first: `name`/`displayName` → `keywords` →
  `description` → `pluginName` (so searching "engineering-paved-path"
  also surfaces its skills).
- **Facets**: `category`, `type` (plugin/skill/agent), `status`,
  `author.name`. All derived straight from `search-index.json` — no
  extra data needed.
- **URL sync**: `?q=&category=&type=&status=`, kept in sync via
  `history.replaceState` as the user types/filters, so a search result
  is a shareable, bookmarkable link.
- **Card content**: type badge, name, one-line description, keyword
  chips, "Copy install command" button (see below), and — for a
  skill/agent card only — a small "part of `<plugin>`" link. Plugin
  cards additionally get a "View details" link to the detail page;
  skill/agent cards link straight to their anchor on the parent's detail
  page instead of having their own page.

## Plugin detail page

One template, `site/plugin.html?name=<plugin>`, fetches
`site/public/plugins/<name>.json` client-side and renders:

- Name, description, version, `status` badge, `category`, keyword chips,
  author, license, homepage/repository links.
- Install command with the same copy button as the cards.
- Dependency list — each a link to that dependency's own detail page.
- `README.md` rendered to HTML with a vendored Markdown renderer
  (`site/vendor/marked.min.js`).
- Its skills and agents, each as an anchor-targetable section (name,
  description, and for agents, `tools`) — this is what
  `search-index.json`'s per-skill/agent `path` links into.
- Its slice of `changelog.json` (filtered by `pluginName`), newest first.

## Install command copy button

Template: `` /plugin install <name>@<marketplace name> ``, where
`<marketplace name>` is read from `catalog.json`'s top-level `name`
field at render time — never hardcoded in the site's JS, so a future
marketplace rename doesn't require an app.js edit.

Behavior: `navigator.clipboard.writeText(...)`, button label flips to
"Copied!" for ~1.5s, falls back to selecting the text in a hidden input
if the Clipboard API is unavailable.

## Changelog feed + RSS

- `site/changelog.html` — reverse-chronological list from
  `changelog.json`, with a plugin filter dropdown.
- `site/public/feed.xml` — generated at build time from the same data.
  Linked from every page's `<head>`
  (`<link rel="alternate" type="application/rss+xml" ...>`) plus a
  visible "Subscribe" link on the changelog page, so users can follow
  the marketplace in a feed reader without us running anything.

## Dependency graph

Rendered **client-side**, not pre-baked: a small function in
`site/render.js` builds a Mermaid graph definition string directly from
the `dependencies` arrays already present in `catalog.json`, rendered
with vendored `site/vendor/mermaid.min.js`. This deliberately does not
duplicate the hand-written graph in `docs/DEPENDENCY-GRAPH.md` — that
file documents *why* the dependencies exist (prose, for contributors);
the site's graph is generated straight from the registered data, so it
cannot drift out of sync as plugins are added.

Shown as a dedicated section on the index page (or `site/dependencies.html`
if the index page gets crowded — a call to make once there's real content
to look at).

## Static JSON "API"

Stable URLs, documented here as an informal contract external scripts/CI
can rely on (additive changes only — new fields fine, removing/renaming
one is a breaking change to flag):

| URL | Contents |
| --- | --- |
| `/public/catalog.json` | All plugins, summary shape |
| `/public/search-index.json` | All searchable units (plugins + skills + agents) |
| `/public/plugins/<name>.json` | One plugin, full detail |
| `/public/feed.xml` | RSS feed of all changelog entries |

## Badge generator

One SVG (`site/public/badge.svg`, shields.io-style, "uses
dev-digest-harness-marketplace") plus a ready-to-paste Markdown snippet
shown in the index page's footer. **v1 ships a single marketplace-wide
badge, not one per plugin** — per-plugin badges are the same generator
parameterized by name and can be added later if anyone actually asks for
one; building it now would be speculative.

## Tech stack & file layout

No build step for the UI itself (Node is only used for the
`build-index.mjs` generation step, which already exists):

```
site/
├── index.html            # search + cards + dependency graph
├── plugin.html            # detail page template (reads ?name=)
├── changelog.html         # changelog feed + RSS link
├── styles.css
├── app.js                 # bootstraps each page
├── search.js              # Fuse.js wiring, URL sync
├── render.js               # card/detail/graph rendering
├── copy.js                 # clipboard button behavior
├── vendor/                 # committed, not CDN-loaded
│   ├── fuse.min.js
│   ├── marked.min.js
│   └── mermaid.min.js
└── public/                 # generated by scripts/build-index.mjs — gitignored
    ├── catalog.json
    ├── search-index.json
    ├── changelog.json
    ├── feed.xml
    ├── badge.svg
    └── plugins/<name>.json
```

**`.gitignore` fix needed:** it currently ignores `site/dist/`, a path
nothing writes to. `build-index.mjs` writes to `site/public/`. Change the
ignored path to `site/public/` — otherwise generated JSON either gets
committed by accident, or someone "fixes" the script to match the wrong
path.

## Build and deploy

Neither workflow exists yet; both need to be created:

- **`.github/workflows/site-build.yml`** — on push/PR to `main` touching
  `.claude-plugin/**`, `plugins/**`, or `site/**`: run
  `npm run build:index` (the extended version of today's script). On a
  PR this is just a sanity check that the build doesn't error; on a push
  to `main` it feeds the deploy step.
- **`.github/workflows/pages.yml`** — after a successful build on
  `main`: upload `site/` (hand-written files + the freshly generated
  `site/public/*`) via `actions/upload-pages-artifact`, then
  `actions/deploy-pages`. Needs `permissions: pages: write, id-token:
  write`.
- One-time manual step outside CI: enable GitHub Pages with
  **Source: GitHub Actions** in the repo's Settings.

## Explicitly out of scope for v1 (backlog)

- **Live GitHub metrics** (stars, last commit) — considered and
  deliberately dropped: fetching from the client risks the unauthenticated
  60-req/hour rate limit, and baking it in at build time adds a moving
  part for a "nice to have." Revisit only if someone asks for it.
- Privacy-friendly analytics (GoatCounter/Plausible) — external service,
  not needed for a first release.
- PWA / offline support (service worker) — the catalog is small enough
  that this isn't solving a real problem yet.
- "Suggest a plugin" pre-filled GitHub Issues link — cheap to add later
  (`https://github.com/<owner>/<repo>/issues/new?title=&body=`), doesn't
  need its own design pass, fine for a v1.1 follow-up PR.
- Per-plugin badges — see "Badge generator" above.

## Open items before implementation

- **`category` and `status` values** need to be set on the four planned
  plugins (`engineering-paved-path`, `research-tools`,
  `architecture-review`, `sdd-engineering`) once they're registered —
  today none of them exist in `marketplace.json` yet (`plugins: []`).
- **Frontmatter field names are unconfirmed.** No real `SKILL.md` or
  agent file exists anywhere in this repo yet — the shape assumed above
  (`name`, `description`, and `tools` for agents) comes from
  `docs/PLUGINS-SPEC.md`'s prose description, not from an actual file.
  Verify the extraction code in `build-index.mjs` against the real
  `engineering-paved-path` skills once they're ported, before relying on
  it.
