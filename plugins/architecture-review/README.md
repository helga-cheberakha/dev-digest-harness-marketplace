# architecture-review

Provides a **generalized, read-only** `architecture-reviewer` agent: a
five-phase structural review (layering, coupling, security surface, data
consistency, scaling limits, observability, operational cost) that
produces a Concern Matrix, per-finding citations, and a mechanical
`GATE: PASS`/`GATE: FAIL` verdict. CRITICAL/HIGH findings block merge.

This is a generalization of a project-specific architecture reviewer: the
review methodology, citation discipline, and anti-double-counting scoring
logic are unchanged, but the **rule catalog** (which structural rules to
check) is no longer hardcoded — the host project supplies it (via the
dispatch brief or a file like `ARCHITECTURE-RULES.md`), and the agent
reads the project's own `CLAUDE.md`/`AGENTS.md` to build its module map
instead of assuming a fixed package layout.

## Agent

**`architecture-reviewer`** — tools: `Read`, `Bash` (limited to `grep`,
`find`, `git log`, `git diff`, `git status`, `git show` — no
state-mutating commands). No `Edit`/`Write`. Model: `sonnet`.

**What it does:**
- **Default scope = the branch diff** (`git diff main...HEAD` plus each
  changed file's direct imports/importers, one hop). A full
  whole-codebase audit runs only when you explicitly ask for one; the
  report header always states which scope was used.
- **Five-phase sequential analysis:** Discovery (read module docs/notes,
  establish the file set) → Flow tracing (follow a representative request
  end to end, run the derived grep targets) → Draft modeling (a Mermaid
  diagram of the actual layer graph, annotated for violations) → Scoring
  (merge findings that share a root cause *before* assigning severity —
  see "no double-counting" below) → Findings report.
- **Seven concern dimensions** assessed every run: failure modes, data
  consistency, scaling limits, security surface, coupling, observability,
  operational cost. A dimension with nothing wrong is reported as `None
  observed in scope`, never padded with a speculative finding.
- **Every finding cites `file:line`** and the exact rule identifier it
  violates from the rule catalog (or `unmapped-observation` if none
  fits); the `Observation` field is a verbatim quote, never a paraphrase.
- **No double-counting:** one root cause spanning several lines, files,
  or concern dimensions is exactly one finding, merged before severity is
  assigned — not filed three times under three different labels.
- **Mechanical gate verdict:** `GATE: FAIL` if the findings section
  contains any CRITICAL or HIGH entry, `GATE: PASS` otherwise. Never
  softened because a finding "feels minor."

## Supplying your project's rule catalog

Out of the box the agent applies one stack-agnostic rule
(`inward-only-dependencies`, from the loaded `onion-architecture` skill).
For project-specific violations, give it a rule catalog — either inline
in the dispatch brief, or as a file the project maintains (e.g.
`ARCHITECTURE-RULES.md`) with entries shaped like:

```
#### di-discipline
**Source:** CLAUDE.md — "services depend on interfaces via the composition root, not concrete classes"
**Check:** is a concrete repository/adapter/service constructed anywhere outside the composition root?
```

See the agent's own "Rule catalog" section
([`agents/architecture-reviewer.md`](./agents/architecture-reviewer.md))
for the full format.

## Dependency

Depends on [`engineering-paved-path`](../engineering-paved-path) `^1.0.0`
for its architecture/security/testing skills, referenced namespaced
(`engineering-paved-path:onion-architecture`,
`engineering-paved-path:security`,
`engineering-paved-path:fastify-best-practices`,
`engineering-paved-path:drizzle-orm-patterns`,
`engineering-paved-path:postgresql-table-design`,
`engineering-paved-path:frontend-architecture`,
`engineering-paved-path:react-best-practices`,
`engineering-paved-path:next-best-practices`,
`engineering-paved-path:mermaid-diagram`) in the agent's frontmatter and
instructions. Skip whichever of these don't match your stack — the agent
notes the skip under "Not Investigated" rather than forcing an
irrelevant lens.

## Using this plugin's agent from another plugin

Reference it namespaced: `architecture-review:architecture-reviewer`.
`sdd-engineering`'s `implement` skill spawns it as one half of its
parallel review gate (alongside `plan-verifier`) after every implementation
batch.

## Using it standalone

```
/plugin install architecture-review@dev-digest-harness-marketplace
```

Then: `@architecture-review:architecture-reviewer review the current
branch diff` — or ask for a full audit explicitly if you want the whole
codebase, not just the diff.

## Compatibility

See [`COMPATIBILITY.md`](./COMPATIBILITY.md).
