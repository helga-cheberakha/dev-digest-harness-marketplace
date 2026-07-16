# Changelog

## 1.0.0 — 2026-07-16

- Initial release: `architecture-reviewer` agent generalized from a
  project-specific version. Removed hardcoded package names, DI-container
  paths, and a fixed module map; the rule catalog and module map are now
  supplied by the host project instead of hardcoded. Skill references
  updated to the `engineering-paved-path:<skill>` namespace. Dropped the
  dependency on a `code-review-conventions` skill (not part of this
  catalog) — its severity/blocking definitions are now inlined directly
  in this agent.
