# evals/

Behavioral tests for this plugin's agents and skills — valid shape (passes
`claude plugin validate`) is not the same as correct behavior.

Not ported yet: the source project has an eval harness (`evals/` at the
product repo root — a vitest + LiteLLM-proxy setup with per-agent and
per-skill `*.cases.ts`/`*.eval.ts` files, plus a `workflow/review-workflow.eval.ts`
that exercises its own review pipeline), but it is tightly coupled to that
harness's fixtures, proxy config, and CI setup — none of it is a
1:1 port. This directory is a placeholder for project-agnostic evals to be
added here instead — e.g. a fixture repo + expected `spec-creator` output
shape, or a scripted `plan-verifier` run against a known-complete vs.
known-incomplete plan — so a change to any agent's prompt can be checked
for regressions before release.

See [`docs/PLUGIN-GUIDELINES.md`](../../../docs/PLUGIN-GUIDELINES.md) —
"Before a PR": schema validation checks shape, evals check behavior.
