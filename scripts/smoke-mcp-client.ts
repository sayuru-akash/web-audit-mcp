#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const args = process.argv.slice(2);
const runAudit = args.includes("--run-audit");
const url = args.find((arg) => !arg.startsWith("--")) ?? "https://example.com";

const transport = new StdioClientTransport({
  command: "npm",
  args: ["run", "mcp"],
});

const client = new Client({
  name: "web-audit-mcp-smoke",
  version: "0.1.0",
});

try {
  await client.connect(transport);

  const tools = await client.listTools();
  const toolNames = tools.tools.map((tool) => tool.name).sort();
  const requiredTools = ["get_audit_report", "run_page_audit", "save_website_and_audit", "validate_audit_url"];
  const missingTools = requiredTools.filter((tool) => !toolNames.includes(tool));
  if (missingTools.length > 0) {
    throw new Error(`Missing MCP tool(s): ${missingTools.join(", ")}`);
  }

  const validation = await client.callTool({
    name: "validate_audit_url",
    arguments: { url },
  });

  const audit = runAudit
    ? await client.callTool({
        name: "run_page_audit",
        arguments: { url },
      })
    : undefined;

  const auditSummary =
    audit && typeof audit.structuredContent === "object" && audit.structuredContent !== null
      ? {
          overallScore: "overallScore" in audit.structuredContent ? audit.structuredContent.overallScore : undefined,
          findingCount:
            "findings" in audit.structuredContent && Array.isArray(audit.structuredContent.findings)
              ? audit.structuredContent.findings.length
              : undefined,
          metricCount:
            "metrics" in audit.structuredContent && Array.isArray(audit.structuredContent.metrics)
              ? audit.structuredContent.metrics.length
              : undefined,
        }
      : undefined;

  console.log(
    JSON.stringify(
      {
        ok: true,
        tools: toolNames,
        validation: validation.structuredContent,
        audit: auditSummary,
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
