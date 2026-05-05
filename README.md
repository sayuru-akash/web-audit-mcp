# Web Audit

Web Audit is a production-minded website audit and monitoring product built from the local `SPEC.md`, `DESIGN.md`, and agent brief.

It includes:

- Next.js App Router product UI with landing, auth, dashboard, websites, reports, notifications, settings, admin health, shared reports, and polished error states.
- Safe non-invasive audit engine for performance signals, SEO, accessibility signals, security headers, technical health, mobile readiness, robots/sitemap, and limited same-origin link checks.
- SSRF protection by protocol validation, DNS lookup, private network blocking, redirect-safe fetch behavior, rate limits, timeouts, and HTML size limits.
- Durable local JSON store for self-hosted/local operation.
- In-app notifications, scheduled audit endpoint, PDF export, private share links, revocation, and score-drop alerts.
- MCP stdio server for Codex/agent access.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run check
npm run mcp
npm run audit:url -- https://example.com
```

## Environment

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=replace-for-production
```

## MCP connection

Use this server command in an MCP-compatible client:

```bash
npm run mcp
```

Tools:

- `validate_audit_url`
- `run_page_audit`
- `save_website_and_audit`
- `get_audit_report`

## Production notes

The current implementation is complete for local/self-hosted single-node operation and stores runtime data under `data/webaudit.json`. For multi-instance serverless production, replace the JSON store with PostgreSQL and the inline audit runner with a dedicated queue/worker using the same service and audit-engine boundaries.

Do not remove the URL safety checks when moving to a database/queue. The audit worker must keep blocking private/internal networks by default.
