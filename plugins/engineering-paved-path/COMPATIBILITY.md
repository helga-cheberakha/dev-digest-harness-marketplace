# Compatibility

- **Claude Code:** requires plugin support (v2.1.x or later recommended).
- **Stack assumptions:** the skills are written for a TypeScript
  full-stack setup — React/Next.js on the frontend, Fastify on the
  backend, Drizzle ORM + PostgreSQL for persistence, Zod for validation.
  A project using a different stack can still install the plugin, but
  only the stack-agnostic skills (`security`, `onion-architecture`,
  `mermaid-diagram`, `typescript-expert`) will be broadly relevant.
- **No external tool dependencies** — all skills are Markdown guidance,
  no bundled scripts, hooks, or MCP servers in this plugin.
