# Changelog

## 1.0.0 — 2026-07-16

- Initial release: 6 agents (`spec-creator`, `implementation-planner`,
  `implementer`, `implementer-backend`, `implementer-ui`, `plan-verifier`)
  and 3 skills (`implement`, `workflow-retro`, `engineering-insights`)
  extracted from an internal engineering harness and generalized —
  removed hardcoded package names/module maps, fixed a hardcoded script
  path to `${CLAUDE_SKILL_DIR}`, and updated all cross-plugin skill/agent
  references to the `plugin:component` namespace. Kept the source's
  three-way implementer routing (`implementer-backend` for
  `Type: backend | core`, `implementer-ui` for `Type: ui | e2e`, the
  generic `implementer` for tasks spanning both) — it's a portable
  cost-optimization, not something specific to the source project, so
  both trimmed profiles were ported alongside the generic one rather
  than dropped. Ported `engineering-insights` after its own
  generalization pass (source version routed to a fixed, project-specific
  module list; this version routes generically to whichever module the
  work touched); it is optional infrastructure and not required by
  `implement`. `evals/` shipped as a placeholder — the source eval
  harness was too tightly coupled to its own fixtures to port as-is.
