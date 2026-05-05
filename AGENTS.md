# Agent Notes

- Read `SPEC.md`, `DESIGN.md`, and `webaudit_agent_development_brief.md` before changing product behavior.
- Preserve the report-first, calm, professional UI direction.
- Do not imply full-site crawling or penetration testing. The v1 audit is a page audit with selected website health checks.
- Keep SSRF protections, rate limits, timeouts, and private network blocking active in every audit path, including MCP tools.
- Validate with `npm run check` before calling the repo healthy.
