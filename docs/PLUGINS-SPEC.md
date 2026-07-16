# Specification: the four plugins and how they fit together

> What we extract from the source project's `.claude/` into this
> marketplace, and the shape each plugin takes. Structure/manifest rules
> live in [`PLUGIN-GUIDELINES.md`](./PLUGIN-GUIDELINES.md), releases in
> [`RELEASES.md`](./RELEASES.md).

**Content source:** an internal engineering-harness project's `.claude/`
directory — agents, skills, hooks, and evals live there. The source
project's own name, module layout, and internal policies are not
reproduced here; every ported component was generalized to be
project-agnostic (see the per-plugin sections below for what changed).

---

## 1. Overview

We extract **four** plugins. Three are reusable **dependencies** (each
supplies one self-contained thing); the fourth is the **consumer** that
assembles them into a Spec-Driven Development workflow:

| Plugin | Role | Provides |
| --- | --- | --- |
| `engineering-paved-path` | dependency | shared engineering skills (React, Next.js, Fastify, architecture, testing, security, full-stack foundations) |
| `research-tools` | dependency | the read-only `researcher` agent |
| `architecture-review` | dependency | a generalized `architecture-reviewer` agent |
| `sdd-engineering` | consumer | 6 agents + the `implement`, `workflow-retro`, and `engineering-insights` skills; depends on the three above at `^1.0.0` |

**Dependency graph** (a DAG, not a star — `architecture-review` also
builds on `engineering-paved-path`):

```
sdd-engineering  ──depends^1.0.0──▶  engineering-paved-path ◀─┐
                 ──depends^1.0.0──▶  research-tools           │
                 ──depends^1.0.0──▶  architecture-review ──depends^1.0.0┘
```

Full visualization — [`DEPENDENCY-GRAPH.md`](./DEPENDENCY-GRAPH.md).

**What we do NOT port** (stays in the source project — verified
project-specific, not just assumed):
- `code-review-conventions`, `pr-self-review` — the review-process/gate
  skills are written against the source project's own severity/blocking
  policy and its own branch-diff gate.
- `dependency-checker` — analyzes the source project's own multi-package
  layout, with no project-agnostic equivalent to generalize into.
- `engineering-insights` **is** ported, but only after a generalization
  pass — see §3, it ships inside `sdd-engineering` as optional
  infrastructure, not standalone.
- `implementer-backend` and `implementer-ui` **are** ported too — see §3.
  They aren't source-project-specific: they're a generic
  cost-optimization (a trimmed skill set per task type), built entirely
  from skills already generalized in `engineering-paved-path`.
- Agents that write product docs, curate an internal insights archive, a
  cost-trimmed review variant, and a disabled test-writer — all bound to
  the source project's own module layout or product decisions (e.g. "no
  dedicated test-writer" was a cost call specific to that project, not a
  portable default) with no project-agnostic equivalent worth
  generalizing.
- Product specs, secrets, cache, and any project-specific instructions
  from the source project.

---

## 2. Dependency plugins

### 2.1 `engineering-paved-path`

The single canonical source for shared engineering skills, grouped by
layer of the stack:

| Category | Skills |
| --- | --- |
| React | `react-best-practices` |
| Next.js | `next-best-practices` |
| Fastify | `fastify-best-practices` |
| testing | `react-testing-library` |
| security | `security` |
| architecture | `frontend-architecture`, `onion-architecture`, `mermaid-diagram` |
| full-stack foundations | `typescript-expert`, `zod`, `drizzle-orm-patterns`, `postgresql-table-design` |

```
plugins/engineering-paved-path/
├── .claude-plugin/plugin.json
├── skills/
│   ├── react-best-practices/SKILL.md
│   ├── next-best-practices/SKILL.md
│   ├── fastify-best-practices/SKILL.md
│   ├── react-testing-library/SKILL.md
│   ├── security/SKILL.md
│   ├── frontend-architecture/SKILL.md
│   ├── onion-architecture/SKILL.md
│   ├── mermaid-diagram/SKILL.md
│   ├── typescript-expert/SKILL.md
│   ├── zod/SKILL.md
│   ├── drizzle-orm-patterns/SKILL.md
│   └── postgresql-table-design/SKILL.md
├── README.md
├── CHANGELOG.md
└── COMPATIBILITY.md
```

Eleven of these twelve skills ported with no changes needed — no
project-specific paths in their content. **`onion-architecture` is the
exception**: the source version was a project-*instance* skill, hardcoded
to that codebase's own package names and a live drift count against its
own import-graph linter output. It was **rewritten** (not copied) into a
project-agnostic onion/ports-and-adapters skill: same core teaching (the
dependency rule, a generic layer table, the "judge the import closure,
not the first hop" decision framework, enforcing it with a static
import-graph linter), with the concrete source-project layer map and
drift numbers replaced by a generic example a consuming project adapts
to its own layout.

### 2.2 `research-tools`

Provides a single **read-only** `researcher` agent. Ports with only the
description generalized (removes source-project framing) — the agent
body was already project-agnostic (no hardcoded paths, reads whatever
project it's invoked in).

```
plugins/research-tools/
├── .claude-plugin/plugin.json
├── agents/researcher.md          # tools: Read, Bash, WebSearch, WebFetch — no Edit/Write
├── README.md
├── CHANGELOG.md
└── COMPATIBILITY.md
```

### 2.3 `architecture-review`

Provides a **generalized** `architecture-reviewer` agent. In the source,
`architecture-reviewer` was **tightly bound to the source project** —
hardcoded package names, onion layering specifics tied to that project's
own layout, and grep commands against its own directory structure. This
is **not** a copy-paste — it is a generalization pass:

- Drop the project-specific paths and invariants; replace them with
  explicit inputs (the set of structural rules is passed to the agent via
  its invocation context, not hardcoded).
- Keep the read-only guarantee, the five-phase review structure, and the
  output format (Concern Matrix + per-finding severity/file:line).

**Dependency:** the agent leans on architecture/security/testing best
practices, so the plugin declares a dependency on
`engineering-paved-path ^1.0.0` and references its skills namespaced
(`engineering-paved-path:onion-architecture`, etc.).

```
plugins/architecture-review/
├── .claude-plugin/plugin.json        # dependencies: [engineering-paved-path ^1.0.0]
├── agents/architecture-reviewer.md   # tools: Read, Bash — read-only
├── README.md
├── CHANGELOG.md
└── COMPATIBILITY.md
```

---

## 3. Consumer plugin: `sdd-engineering`

The core of Spec-Driven Development. Ports six agents and three skills.

```
plugins/sdd-engineering/
├── .claude-plugin/plugin.json        # declares three dependencies (see §4)
├── agents/
│   ├── spec-creator.md               # writes specs only (EARS acceptance criteria)
│   ├── implementation-planner.md     # spec → plan (read-only except the plan file)
│   ├── implementer.md                # generic profile — executes one plan task spanning backend+frontend
│   ├── implementer-backend.md        # trimmed profile — Type: backend | core
│   ├── implementer-ui.md             # trimmed profile — Type: ui | e2e
│   └── plan-verifier.md              # read-only gate — traceability + verdict
├── skills/
│   ├── implement/
│   │   └── SKILL.md                  # orchestrates an approved plan
│   ├── workflow-retro/
│   │   ├── SKILL.md                  # analyzes a completed run (manual-only)
│   │   └── scripts/analyze_journals.py
│   └── engineering-insights/
│       └── SKILL.md                  # generalized — captures durable insights between sessions
├── evals/                            # valid shape ≠ correct behavior
├── README.md                         # how the pieces work together (required)
├── CHANGELOG.md
└── COMPATIBILITY.md
```

`engineering-insights` is optional infrastructure, shipped only after its own generalization
pass (the source version routed writes to a fixed, project-specific module list — the
generalized version routes to whatever module the work touched, generically). Teams that don't
want cross-session insight capture can simply not invoke it; it adds no required step to the
`implement` flow.

**`implementer-backend` / `implementer-ui` — why they're worth the extra two files.** The
source's generic `implementer` already carries all 11 `engineering-paved-path` skills so it can
handle a task spanning both halves of the stack. But most tasks a plan produces are single-sided,
and every spawned agent pays a full cold-start cost proportional to what it loads. The two
profiles are exact clones of `implementer`'s contract (same workflow, same hard limits, same
completion report) with a trimmed, namespaced skill set — backend: `drizzle-orm-patterns`,
`fastify-best-practices`, `onion-architecture`, `typescript-expert`, `zod`,
`postgresql-table-design`, `security` (7, not 11); UI: `frontend-architecture`,
`react-best-practices`, `next-best-practices`, `react-testing-library`, `typescript-expert`,
`zod`, `security` (7, not 11) — plus a guard clause that stops and reports a blocker if a task
turns out to be the other profile's job. `implement`'s Step 1 routes by the plan's `Type` field:
`backend`/`core` → `implementer-backend`, `ui`/`e2e` → `implementer-ui`, spanning both →
generic `implementer`. None of this is project-specific — it's a portable pattern, built
entirely from skills already generalized in §2.1.

**How the pieces work together:**

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

1. **spec-creator** produces the specification — the "what" and "why", not
   the "how".
2. **implementation-planner** turns the spec into a step-by-step plan with
   a DAG; a human **approves** it.
3. **implement** (skill) starts **from the approved plan** (a `plan:<path>`
   argument is required). It dispatches `implementer`(s) per the DAG →
   gates with `architecture-reviewer` + `plan-verifier` in parallel → runs
   a bounded fix loop. It never pushes or merges.
4. **workflow-retro** (skill) runs **after** a completed run: gathers
   metrics + qualitative insights → recommendations.
5. **researcher** and **architecture-reviewer** are pulled in from the
   dependency plugins (namespaced) wherever research or an architecture
   review is needed.

### Porting rules

- **Remove source-project paths, replace with explicit inputs**:
  `implement`'s hardcoded plan-directory convention and git baseline
  become skill parameters; `spec-creator`'s hardcoded module list becomes
  explicit input; `architecture-reviewer` — see §2.3. `implementer-backend`
  and `implementer-ui` get the same treatment as `implementer`: the
  hardcoded module-map table is replaced with "read the plan / the
  project's own `CLAUDE.md`/`AGENTS.md`", and their frontmatter `skills`
  list is namespaced to `engineering-paved-path:<skill>`.
- **Reference skills namespaced**:
  `engineering-paved-path:react-best-practices`,
  `research-tools:researcher`, `architecture-review:architecture-reviewer`
  — never bare names.
- **Supporting scripts via `${CLAUDE_SKILL_DIR}`.** The source hardcodes
  a path under its own `.claude/skills/workflow-retro/scripts/` — this
  becomes `${CLAUDE_SKILL_DIR}/scripts/analyze_journals.py`.
- **Port evals alongside** and update them whenever behavior changes.

---

## 4. Registration

Four entries in the root `.claude-plugin/marketplace.json`, each with its
own `name`, `version` (via its `plugin.json`), `author`, and `source`.

The `dependencies` field in `plugin.json` is an **array** (string entries
or `{ "name", "version" }` objects), **not** an object map.
`sdd-engineering` declares three, `architecture-review` declares one.

- Relative `source` values start with `./` and never escape the repo
  root. `metadata.pluginRoot` shortens paths.
- **Release order:** the three dependencies first, then `sdd-engineering`
  (the consumer).
- Bumping a single plugin's version does **not** touch `marketplace.json`
  — that file is edited only when *adding a new* plugin.

## 5. Documentation and versions

- Each plugin has its own `README.md`, `CHANGELOG.md`, `COMPATIBILITY.md`.
- `sdd-engineering/README.md` explains how the 6 agents + `implement` +
  `workflow-retro` compose into a single flow (diagram in §3).
- Versioning and releases follow [`RELEASES.md`](./RELEASES.md).
