# Agent Connections

Web Audit exposes a local stdio MCP server. Codex, Claude Code, Claude Desktop, and generic MCP clients can start it with:

```bash
npm run mcp
```

This connects the agent to Web Audit's audit engine. It does not connect the app to an LLM provider, and it does not send audit data to OpenAI or Anthropic by itself. The LLM client starts the MCP process locally and asks for tool calls through the MCP protocol.

## What To Use

| Client | Best connection | Status |
| --- | --- | --- |
| Codex CLI / Codex IDE | Local stdio MCP through Codex config | Supported now |
| Claude Code | Local stdio MCP through `claude mcp add` or `.mcp.json` | Supported now |
| Claude Desktop | Local stdio MCP through `claude_desktop_config.json` | Supported now |
| Generic MCP client | JSON `mcpServers` config | Supported now |
| ChatGPT custom connector / OpenAI API remote MCP | Remote HTTP MCP server | Future work; this repo currently ships local stdio only |

## Codex

From this repository, the simple local setup is:

```bash
codex mcp add web-audit -- npm run mcp
codex mcp list
```

For a configuration that works even when Codex is launched from another directory, add this to `~/.codex/config.toml` or a trusted project-scoped `.codex/config.toml`:

```toml
[mcp_servers.web-audit]
command = "npm"
args = ["run", "mcp"]
cwd = "/Users/sayuru/Documents/GitHub/web-audit-mcp"
startup_timeout_sec = 20
tool_timeout_sec = 120
```

Then start Codex and use `/mcp` to confirm the server is active.

Use prompts like:

```text
Use the web-audit MCP server to validate https://example.com and run a page audit.
```

## Claude Code

From the repository root:

```bash
claude mcp add --transport stdio --scope local web-audit -- npm run mcp
claude mcp list
```

For a team-shared project config, create `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "web-audit": {
      "command": "npm",
      "args": ["run", "mcp"]
    }
  }
}
```

For user-wide Claude Code or Claude Desktop where the client may not start in this repo, use an absolute command wrapper:

```json
{
  "mcpServers": {
    "web-audit": {
      "command": "/bin/zsh",
      "args": [
        "-lc",
        "cd /Users/sayuru/Documents/GitHub/web-audit-mcp && npm run mcp"
      ]
    }
  }
}
```

Claude Desktop config location on macOS is:

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

Restart Claude Desktop after editing the file.

## Generic MCP JSON

Use this shape when a client supports `mcpServers` and `cwd`:

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

If the client does not support `cwd`, use the `/bin/zsh -lc` wrapper shown above.

## ChatGPT And OpenAI API

This repository currently exposes a local stdio MCP server. That is the correct shape for Codex, Claude Code, Claude Desktop, and local MCP clients.

ChatGPT custom connectors and OpenAI API MCP integrations require a remote MCP server over HTTP/SSE, with deployment, authentication, and connector safety review. To support that, add a separate HTTP MCP transport that calls the same `src/lib/audit-service.ts` and `src/lib/audit-engine.ts` paths, then deploy it behind HTTPS with auth and rate limits. Do not expose the stdio server directly to the internet.

## Smoke Test

Validate the server, tool list, and URL validator:

```bash
npm run mcp:smoke -- https://example.com
```

Run a full MCP audit smoke test:

```bash
npm run mcp:smoke -- https://example.com --run-audit
```

The smoke script starts the same `npm run mcp` server through the official MCP SDK client, lists the four required tools, calls `validate_audit_url`, and optionally calls `run_page_audit`.

## Tool Names

| Tool | Side effect |
| --- | --- |
| `validate_audit_url` | Read-only validation |
| `run_page_audit` | Read-only network audit of the submitted public page |
| `save_website_and_audit` | Writes website, audit, findings, metrics, notifications to local store |
| `get_audit_report` | Read-only local report lookup |

## References Checked

- OpenAI Codex MCP docs: `https://developers.openai.com/codex/mcp`
- OpenAI Docs MCP docs: `https://developers.openai.com/learn/docs-mcp`
- OpenAI MCP server guide for ChatGPT/API integrations: `https://developers.openai.com/api/docs/mcp`
- Claude Code MCP docs: `https://code.claude.com/docs/en/mcp`
- MCP local server connection guide: `https://modelcontextprotocol.io/docs/develop/connect-local-servers`

