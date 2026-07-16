# sdd-engineering

Spec-Driven Development workflow: spec → plan → implement → verify → retro.
The consumer plugin of this catalog — it assembles the other three
plugins into one flow.

## Components

- **Agents:** `spec-creator`, `implementation-planner`, `implementer`
  (generic profile), `implementer-backend` and `implementer-ui` (trimmed,
  cost-optimized profiles), `plan-verifier` — see [Agents](#agents) below
  for what each one does.
- **Skills:** `implement` (orchestrates an approved plan end-to-end — its
  own [README](./skills/implement/README.md)), `workflow-retro` (analyzes
  a completed run; manual-only), `engineering-insights` (optional —
  captures durable, cross-session insights into a module's notes file;
  generalized from a project-specific version, not required by
  `implement`).
- **Evals:** see [`evals/README.md`](./evals/README.md) — placeholder for
  behavioral tests.

## How the pieces work together

```
spec-creator ─▶ implementation-planner ─▶ [human APPROVES the plan]
     ▲  research-tools:researcher                  │
     │  architecture-review:architecture-reviewer  ▼
     │            (during research / review)   skill: implement
     │                                              │
     │                          ┌───────────────────┼─────────────────────┐
     │                          ▼                    ▼                     ▼
     │                     implementer(s)   architecture-reviewer +   bounded
     │                     (per DAG)         plan-verifier (parallel)  fix loop
     │                                                                    │
     └────────────────────────────────────────────────────────  skill: workflow-retro
```

1. **spec-creator** produces the specification — the "what" and "why".
2. **implementation-planner** turns the spec into a step-by-step plan with
   a DAG; a human **approves** it.
3. **implement** (skill) starts from the approved plan, dispatches
   `implementer`(s) per the DAG, gates with `architecture-reviewer` +
   `plan-verifier` in parallel, and runs a bounded fix loop. Never pushes
   or merges.
4. **workflow-retro** (skill, manual-only) analyzes a completed run for
   cost/orchestration lessons.

## Agents

### spec-creator

Spec Driven Development entry point — turns a feature request plus design
materials (Figma/external links via `WebFetch`, screenshots via `Read`,
text descriptions) into a specification with EARS acceptance criteria.
The spec is the contract that `implementation-planner` and `implementer`
execute against.

- Writes **only** inside `specs/` directories: one affected module → that
  module's own `specs/`; cross-module features → root `specs/`. Never
  writes source code, docs, or plans.
- Spec ID = date + feature name: `SPEC-YYYY-MM-DD-<feature>` (file name
  matches); detects duplicates and handles supersedes both ways.
- Grounds the spec before writing: module docs, existing specs, and
  per-module notes files for the affected modules only; fans out
  parallel `research-tools:researcher` sub-agents for broad exploration.
- Two spec modes — **lightweight** (one page) for a single-module feature
  with no new cross-boundary contract and no new untrusted-input surface;
  **full** template for everything else. States the chosen mode and why.
- Question triage: blocking questions asked first (via `AskUserQuestion`
  when running directly, or a structured "Questions for the user" block
  when running as a subagent — see [COMPATIBILITY.md](./COMPATIBILITY.md));
  assumable points get a recorded default; non-blocking ones become
  inline `[NEEDS CLARIFICATION]` markers.
- Bash is read-only. New specs always start `Status: draft`.

**Model:** `opus` by default — spawn with a `sonnet` override for a
clearly lightweight request. **Tools:** Read · Glob · Grep · Bash ·
WebFetch · Write · Edit · Agent · AskUserQuestion. **Preloaded skills:**
`engineering-paved-path:security` ·
`engineering-paved-path:onion-architecture` ·
`engineering-paved-path:frontend-architecture` ·
`engineering-paved-path:zod` · `engineering-paved-path:mermaid-diagram`
(implementation-level skills are deliberately not loaded — a spec pins
down *what*, not *how*).

### implementation-planner

Analyses a feature request or bug fix (or an approved spec), reads the
project structure and any per-module notes files, and produces a
structured implementation plan written to `docs/plans/`. The plan is the
contract that `implementer` agents execute against. Does **not** write
specifications — that's `spec-creator`'s job.

- Verifies requirements first: flags ambiguous/untestable/conflicting
  ones and recommends improvements to the requested approach.
- **One question round:** all blocking clarifications plus the
  execution-mode question (multi-agent parallel vs. single-agent
  sequential) go into a single `AskUserQuestion` call (max 4 questions)
  — never multiple rounds.
- Reads the notes file of every touched module before writing anything
  (if the project keeps one); folds relevant traps into each task's
  `Known gotchas`.
- Every stated requirement maps to at least one task; every task carries
  a `Covers:` field with the spec AC IDs it fulfils (traceability for
  `plan-verifier`).
- Non-overlapping `Owned paths` so parallel `implementer` instances never
  touch the same file (multi-agent mode only).
- Writes only to `docs/plans/PLAN-<kebab-feature-name>.md` — never writes
  source code, never touches `specs/`.
- Bash is read-only; never runs a test or typecheck command — baseline
  verification belongs to `implementer`.

**Model:** `opus`. **Tools:** Read · Glob · Grep · Bash · Agent · Write ·
Edit · AskUserQuestion. **Preloaded skills:**
`engineering-paved-path:onion-architecture` ·
`engineering-paved-path:fastify-best-practices` ·
`engineering-paved-path:drizzle-orm-patterns` ·
`engineering-paved-path:postgresql-table-design` ·
`engineering-paved-path:zod` ·
`engineering-paved-path:frontend-architecture` ·
`engineering-paved-path:next-best-practices` ·
`engineering-paved-path:react-best-practices` ·
`engineering-paved-path:react-testing-library` ·
`engineering-paved-path:typescript-expert` ·
`engineering-paved-path:security` ·
`engineering-paved-path:mermaid-diagram`.

### implementer

Receives one task from an `implementation-planner`-produced plan and
brings it to green — writes source code, verifies the project typechecks,
and confirms the task's tests pass. Multiple `implementer` instances can
run in parallel on the same branch; each touches only the files
`implementation-planner` assigned to it.

- Reads the relevant module's notes file first (if one exists) and states
  the most relevant points in one line.
- Follows the task's `Action` steps in order; touches only its `Owned
  paths`; does not deviate or refactor neighbours.
- Stops and reports a blocker if it needs to touch a file not in its task
  list.
- If a module has no typecheck or test command configured, records that
  explicitly (`n/a (no ... command)`) rather than inventing a result.
- Returns a lean, structured completion report with files changed,
  verification results, and any blockers.
- Never runs `git push`, `git commit`, `rm`, or destructive resets.

**Model:** `claude-sonnet-4-6`. **Tools:** Read · Bash · Edit · Write.
**Preloaded skills:** `engineering-paved-path:drizzle-orm-patterns` ·
`engineering-paved-path:fastify-best-practices` ·
`engineering-paved-path:onion-architecture` ·
`engineering-paved-path:typescript-expert` ·
`engineering-paved-path:zod` ·
`engineering-paved-path:postgresql-table-design` ·
`engineering-paved-path:security` ·
`engineering-paved-path:frontend-architecture` ·
`engineering-paved-path:react-best-practices` ·
`engineering-paved-path:next-best-practices` ·
`engineering-paved-path:react-testing-library`. Use this profile for a
task that genuinely spans backend and frontend — for single-sided tasks,
`implement` prefers the two cheaper profiles below.

### implementer-backend / implementer-ui

Same contract as `implementer` — identical workflow, hard limits, and
completion report — but each loads only half the skill set, so a
single-sided task doesn't pay for skills it will never use. `implement`
routes to them by the plan's `Type` field: `backend`/`core` →
`implementer-backend`, `ui`/`e2e` → `implementer-ui`, a task spanning
both → the generic `implementer` above. Each carries one extra guard: if
a dispatched task turns out to be the other profile's job, it stops and
reports a blocker instead of doing it anyway — the orchestrator should
re-dispatch to the correct profile.

| Profile | Preloaded skills (7, not 11) |
| --- | --- |
| `implementer-backend` | `drizzle-orm-patterns` · `fastify-best-practices` · `onion-architecture` · `typescript-expert` · `zod` · `postgresql-table-design` · `security` |
| `implementer-ui` | `frontend-architecture` · `react-best-practices` · `next-best-practices` · `react-testing-library` · `typescript-expert` · `zod` · `security` |

**Model:** `claude-sonnet-4-6` for both. **Tools:** Read · Bash · Edit ·
Write for both.

### plan-verifier

Reads a plan from `docs/plans/` and checks the current implementation
state against it. Classifies each task as COMPLETE, DRIFT, or VIOLATION.
Produces a Markdown checklist and a JSON summary block. Read-only.

- Evidence-first verification: consults `git log` (the orchestrator
  commits each phase with task IDs) → file tree → exported symbols →
  test existence → content spot-check, in priority order; never infers
  completion from proximity.
- Three-way classification: **COMPLETE** (all checks pass), **DRIFT**
  (intent fulfilled via a different, defensible approach — human decision
  required), **VIOLATION** (a required artifact is absent — hard fail).
- **Never runs tests itself**: for test tasks it verifies the test file
  exists and contains the described `describe`/`it` blocks; "green" is
  attested by the implementer's own report.
- **Spec coverage check:** every `AC-N` from the cited spec must appear
  in at least one task's `Covers` field; uncovered ACs fail the verdict.
- Scope-creep detection: compares all changed files against the union of
  every task's `Owned paths` and flags anomalies.
- JSON summary block in every report: `total`, `completed`, `violations`,
  `drift_items`, `uncovered_acs`, `percent_complete`, `incomplete_tasks`.

**Model:** `sonnet`. **Tools:** Read · Bash (limited to `git log`, `git
status`, `git diff`, `grep`, `find`). **Preloaded skills:**
`engineering-paved-path:typescript-expert` ·
`engineering-paved-path:drizzle-orm-patterns` ·
`engineering-paved-path:fastify-best-practices` ·
`engineering-paved-path:onion-architecture` ·
`engineering-paved-path:react-best-practices` ·
`engineering-paved-path:next-best-practices`.

## Orchestration protocol

Stages 0–1 run **manually** (each in its own conversation, or one after
another in the same session); the execution stage (2–5) is automated by
the **`implement`** skill.

```
MANUAL
0. Spawn spec-creator → produces specs/SPEC-YYYY-MM-DD-<feature>.md (answer its
   questions; a human flips Status to approved)
1. Spawn implementation-planner → verifies requirements, asks ONE combined question
   round (clarifications + single- vs multi-agent mode) → produces
   docs/plans/PLAN-<feature>.md

AUTOMATED — implement plan:<path> [mode:multi|single] [max-fix:<n>] [free-text run notes]
2. Executes the plan batch by batch, respecting the dependency DAG:
   - Type backend | core → implementer-backend
   - Type ui | e2e      → implementer-ui
   - spans both          → generic implementer
   Parallel tasks within a batch run concurrently (non-overlapping Owned paths).
   ► After each batch/phase the orchestrator COMMITS with the task IDs in the
     message, e.g. `[PLAN-<feature>] Phase 1: T1, T2` — plan-verifier's #1 evidence
     signal, and the only way the work lands in the `main...HEAD` diff that
     architecture-reviewer reads.
3. Review gate — architecture-reviewer AND plan-verifier run in parallel (both
   read-only). Reviewer PASS = zero CRITICAL/HIGH findings; verifier verdict =
   PASS / FAIL / REVIEW NEEDED.
4. Bounded fix loop (default max-fix: 3): backlog = reviewer CRITICAL/HIGH findings +
   verifier VIOLATIONs, grouped into non-overlapping fix dispatches → matching implementer
   profile → commit `[PLAN-<feature>] review fixes (<i>): …` → re-review the touched scope
   only. MEDIUM/LOW recorded, never auto-fixed. DRIFT and uncovered ACs go to a
   human, never into the loop. No progress or cap reached → stop for a human decision.
5. The run ends with a recommendation to run your project's own pre-push review
   (typecheck, tests, lint — whatever gate you use). implement never pushes or opens
   the PR itself.

OPTIONAL / ANY TIME
6. Invoke engineering-insights to capture a durable, cross-session discovery.
   Spawn research-tools:researcher at any point to locate a concept or gather context.
   Run workflow-retro after a completed run to capture orchestration-level lessons.
```

To invoke:

```
@sdd-engineering:spec-creator write a spec for the onboarding overview (designs: docs/design/…)
@sdd-engineering:implementation-planner plan implementation of user notifications
/sdd-engineering:implement plan:docs/plans/PLAN-notifications.md
/sdd-engineering:implement plan:docs/plans/PLAN-notifications.md mode:single max-fix:2 skip phase 3 for now
@research-tools:researcher how does the event bus work in this project?
@architecture-review:architecture-reviewer review the current branch diff (default scope)
@sdd-engineering:plan-verifier verify docs/plans/PLAN-notifications.md
/sdd-engineering:workflow-retro label:notifications
```

Single tasks can still be dispatched by hand when debugging a run:
`@sdd-engineering:implementer-backend execute task T1 from
docs/plans/PLAN-notifications.md`.

## Dependencies

Depends on all three other plugins in this catalog at `^1.0.0`:
[`engineering-paved-path`](../engineering-paved-path),
[`research-tools`](../research-tools),
[`architecture-review`](../architecture-review). Install all four
together; the installer shows the dependency graph before confirming.

See [`docs/DEPENDENCY-GRAPH.md`](../../docs/DEPENDENCY-GRAPH.md) for the
full visualization.

## Compatibility

See [`COMPATIBILITY.md`](./COMPATIBILITY.md) — requires Claude Code
v2.1.196 or later.
