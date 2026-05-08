# MCP Usage

Web Audit includes a local MCP stdio server for agent workflows. The MCP tools use the same URL safety checks and audit engine as the web app. Keep this path non-invasive and honest: it runs a page audit with selected website health checks, not a crawler or penetration test.

## Start The Server

```bash
npm run mcp
```

Run the built-in MCP smoke test:

```bash
npm run mcp:smoke -- https://example.com
npm run mcp:smoke -- https://example.com --run-audit
```

Example MCP client configuration:

```json
{
  "mcpServers": {
    "web-audit": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/Users/sayuru/Documents/GitHub/web-audit-mcp"
    }
  }
}
```

## Tools

| Tool | Purpose | Writes to store |
| --- | --- | --- |
| `validate_audit_url` | Normalize a URL and confirm it is safe to audit. | No |
| `run_page_audit` | Run a safe one-off page audit and return structured scores, metrics, and findings. | No |
| `save_website_and_audit` | Create or reuse the internal MCP agent user, save a website, run an audit, and persist the report for the web UI. | Yes |
| `get_audit_report` | Fetch a persisted audit report by audit ID. | No additional writes |

Tool annotations are set so clients can distinguish read-only validation/report tools from the persistence tool. `save_website_and_audit` is the only MCP tool that writes product data.

Returned findings can use `failed`, `needs_review`, `passed`, or `skipped` status. `needs_review` is used for automation-limited items such as provider-managed same-origin assets that should be checked in a real browser before a fix is assigned.

## Connect Codex Or Claude

See [docs/agent-connections.md](agent-connections.md) for exact Codex CLI, Codex config.toml, Claude Code, Claude Desktop, generic MCP JSON, and ChatGPT/API remote-MCP guidance.

## Suggested Workflow

1. Call `validate_audit_url` for the submitted URL.
2. Call `run_page_audit` when the agent needs an immediate report without saving data.
3. Call `save_website_and_audit` when the report should be visible in the web UI.
4. Call `get_audit_report` with the audit ID when the agent needs the persisted result later.

## Persistence Boundary

`save_website_and_audit` creates an internal user with:

- ID: `agent`
- Email: `agent@webaudit.local`
- Display name: `Codex Agent`

Persisted MCP audits use the same active store adapter as the web app:

- JSON mode writes to `data/webaudit.json`.
- Postgres mode writes to the configured `DATABASE_URL`.

In JSON mode, the same JSON limits apply:

- single-process write serialization only.
- no multi-instance safety.
- no distributed rate limits.
- private audit/account data stored in the local file.

For production MCP usage across multiple app instances or workers, use Postgres mode and keep MCP tools on the same service-layer safety path.

## Security Expectations

MCP tools must preserve:

- HTTP/HTTPS-only URL validation.
- credential and fragment stripping.
- DNS resolution before audit execution.
- localhost/private/internal network blocking.
- redirect-hop validation.
- timeout and response-size limits.
- HTML-only audit fetch behavior.
- non-invasive same-origin link and asset status checks only.
- manual-review classification for automation-limited provider resources without bypassing URL safety.

Do not add MCP tools that bypass `assertPublicUrl`, redirect validation, rate limits where persistence is involved, or the shared audit engine safety model.
