# Compatibility

- **Claude Code:** requires plugin support and subagent support (v2.1.x or
  later recommended).
- **Model:** the agent pins `model: claude-sonnet-4-6` in its frontmatter;
  adjust if your Claude Code version resolves models differently.
- **No stack assumptions** — this agent works in any codebase; it only
  reads files and searches the web.
- **No external tool dependencies** — no bundled scripts, hooks, or MCP
  servers.
