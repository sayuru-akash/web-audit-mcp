# Agent Notes

- Use `README.md` and `docs/` as the current product source of truth.
- Documentation-only work may edit `README.md`, `AGENTS.md`, `.env.example`, and files under `docs/`. Do not edit source when the requested ownership is docs-only.
- Preserve the report-first, calm, professional UI direction.
- Do not imply full-site crawling or penetration testing. The v1 audit is a page audit with selected website health checks.
- Keep SSRF protections, rate limits, timeouts, and private network blocking active in every audit path, including MCP tools.
- Preserve redirect-hop validation, admin allowlisting, cron secret enforcement, and serialized store writes.
- Document the current storage truthfully: local JSON is the active store; Postgres/Drizzle schema and migration exist, but service wiring is still required before DATABASE_URL becomes active runtime persistence.
- Keep route, command, MCP, admin, cron, and deployment-checklist docs in sync with the implementation.
- Validate with `npm run check` before calling the repo healthy.
- For MCP or agent-connection changes, also run `npm run mcp:smoke -- https://example.com --run-audit`.
- Use the OpenAI developer documentation MCP server or official OpenAI developer docs when changing Codex, ChatGPT Apps SDK, OpenAI API, or OpenAI MCP guidance.
