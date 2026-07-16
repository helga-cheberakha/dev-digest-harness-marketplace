# site/ — marketplace catalog (React + Vite)

Catalog web app: search, filters, dependency graph, plugin detail with README
+ changelog. Lives in its own directory so it doesn't mix with the plugin
structure (`plugins/`, `docs/`, `scripts/`). See [`../docs/SITE-SPEC.md`](../docs/SITE-SPEC.md).

## How it works

**Static index + client-side search.** GitHub Pages serves static files only, so:

1. `../scripts/build-index.mjs` (zero-dep Node) walks `plugins/**` at build time,
   parses manifests + frontmatter + CHANGELOG, and writes to `public/`:
   `index.json`, `bodies/<id>.md`.
2. The browser fetches `index.json` and searches/filters client-side.

**Reindexing is automatic** — every push to `main` touching `plugins/**` rebuilds
the index and redeploys via `.github/workflows/pages.yml`. Manually: `npm run build:index`.

Generated files (`public/index.json`, `public/bodies/`, `dist/`) are gitignored —
they're build artifacts, never committed.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server at http://localhost:5173/ (builds the index first). |
| `npm run build` | Rebuilds the index, then `vite build` → `dist/`. |
| `npm run preview` | Serves the production build locally (checks the base path). |
| `npm run build:index` | Only regenerates `public/index.json` from `plugins/**`. |

## Stack

React + Vite, no TypeScript. State lives in URL query params (`?q=&type=&view=&plugin=`),
so any search/filter/detail state is a shareable link — no router needed since
there's only ever one page. Markdown detail (README bodies) — `marked` + `DOMPurify`
(sanitized). UI copy lives in one file, `src/i18n/strings.js` — never hardcoded in components.

## Hosting (GitHub Pages)

Deployed automatically by `.github/workflows/pages.yml` (build → `dist/` → Pages)
on every push to `main`, after `.github/workflows/site-build.yml` (a PR-only
build check, no deploy) has succeeded — kept apart from `validate.yml`'s
marketplace/harness checks so a broken site build shows as its own status,
not mixed in with those.

**One-time setup** (repo admin, only needed once — before the first deploy
will actually go live):

1. GitHub → this repo → **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**
   (not "Deploy from a branch" — `pages.yml` already does the build).
3. Push to `main` (or open **Actions → Deploy Pages → Run workflow** to
   trigger it manually). The first successful run publishes the site.

**Where to find the live page:**

- **Settings → Pages** shows the live URL at the top once a deploy has
  succeeded.
- **Actions → Deploy Pages** → the latest run → the `deploy` job's
  `page_url` output links straight to it.
- GitHub Pages always serves a project site at
  `https://<owner>.github.io/<repo>/`, so for this repo that's
  **https://helga-cheberakha.github.io/dev-digest-harness-marketplace/**.
