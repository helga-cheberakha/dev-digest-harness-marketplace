# engineering-paved-path

Shared engineering best-practice skills — the single canonical source for
conventions other plugins in this catalog (and their host projects) build
on. Install this plugin on its own for the skills, or pull it in as a
dependency from another plugin. Every skill is on-demand: Claude loads it
only when the task at hand makes it relevant, not on every turn.

## Skills

| Skill | Scope | What it covers |
| --- | --- | --- |
| [`react-best-practices`](./skills/react-best-practices/SKILL.md) | Frontend | React anti-patterns, state management, hooks rules |
| [`next-best-practices`](./skills/next-best-practices/SKILL.md) | Frontend | Next.js App Router, RSC boundaries, data fetching, optimization |
| [`fastify-best-practices`](./skills/fastify-best-practices/SKILL.md) | Backend | Fastify routes, plugins, JSON-schema validation, error handling |
| [`react-testing-library`](./skills/react-testing-library/SKILL.md) | Frontend | General-purpose React Testing Library guide with Vitest |
| [`security`](./skills/security/SKILL.md) | Full-stack | OWASP Top 10, auth, injection, uploads, secrets |
| [`frontend-architecture`](./skills/frontend-architecture/SKILL.md) | Frontend | Where files/components live, folder structure, splitting components, business-logic layering |
| [`onion-architecture`](./skills/onion-architecture/SKILL.md) | Backend | Ports-and-adapters layering, the dependency rule, enforcing it with a static import-graph linter |
| [`mermaid-diagram`](./skills/mermaid-diagram/SKILL.md) | Shared | Mermaid diagrams in markdown (flowcharts, sequence, ERD, …) |
| [`typescript-expert`](./skills/typescript-expert/SKILL.md) | Full-stack | Type-level programming, performance, tooling, migrations |
| [`zod`](./skills/zod/SKILL.md) | Full-stack | Zod schema validation, parsing, error handling, type inference |
| [`drizzle-orm-patterns`](./skills/drizzle-orm-patterns/SKILL.md) | Backend | Drizzle schema, queries, relations, transactions, migrations |
| [`postgresql-table-design`](./skills/postgresql-table-design/SKILL.md) | Backend | Postgres schema design, data types, indexing, constraints |

`onion-architecture` is a generalized ports-and-adapters skill: the
version here teaches the pattern with a generic example layer map you
adapt to your own project, rather than one specific codebase's layout.
`react-testing-library`, `frontend-architecture`, and `zod` ship their own
supplementary `README.md`/reading-list files alongside `SKILL.md` for
provenance and further reading.

## Using this plugin's skills from another plugin

Reference a skill from this plugin **namespaced**:
`engineering-paved-path:react-best-practices`, never a bare
`react-best-practices`. Declare the dependency in the consuming plugin's
`plugin.json`:

```json
"dependencies": [{ "name": "engineering-paved-path", "version": "^1.0.0" }]
```

Two plugins in this catalog do exactly this today — `sdd-engineering`
(its `implementer`, `implementation-planner`, and `plan-verifier` agents
all preload a subset of these skills) and `architecture-review` (its
`architecture-reviewer` agent leans on `onion-architecture`, `security`,
`fastify-best-practices`, `drizzle-orm-patterns`,
`postgresql-table-design`, `frontend-architecture`,
`react-best-practices`, `next-best-practices`, and `mermaid-diagram`).

## Using it standalone

Install just this plugin to get the skills on their own — useful if you
only want the conventions, not the SDD workflow or the review agent:

```
/plugin install engineering-paved-path@dev-digest-harness-marketplace
```

Claude picks up a skill automatically when a task matches its
description; you can also reference one explicitly, e.g. "apply
`react-best-practices` to this component."

## Compatibility

See [`COMPATIBILITY.md`](./COMPATIBILITY.md).
