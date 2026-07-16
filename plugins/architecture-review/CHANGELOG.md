# Changelog

## 1.1.0 — 2026-07-17

- `architecture-reviewer` now falls back to the root `README.md` for a
  coarser picture of the package/module layout when no `CLAUDE.md`/
  `AGENTS.md` module map exists, before resorting to inferring the layout
  from directory structure alone. Verifies the version bump propagates
  through Claude Code's marketplace auto-update mechanism.

## 1.0.0 — 2026-07-16

- Initial release: `architecture-reviewer` agent generalized from a
  project-specific version. Removed hardcoded package names, DI-container
  paths, and a fixed module map; the rule catalog and module map are now
  supplied by the host project instead of hardcoded. Skill references
  updated to the `engineering-paved-path:<skill>` namespace. Dropped the
  dependency on a `code-review-conventions` skill (not part of this
  catalog) — its severity/blocking definitions are now inlined directly
  in this agent.
