#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { addWebsiteForUser, runAuditForWebsite } from "../lib/audit-service";
import { runPageAudit } from "../lib/audit-engine";
import { findingsFor, metricsFor, readStore } from "../lib/store";
import { assertPublicUrl } from "../lib/url";

const AGENT_USER_ID = "agent";

async function ensureAgentUser() {
  const { updateStore, nowIso } = await import("../lib/store");
  return updateStore((data) => {
    let user = data.users.find((item) => item.id === AGENT_USER_ID);
    if (!user) {
      const ts = nowIso();
      user = {
        id: AGENT_USER_ID,
        email: "agent@webaudit.local",
        passwordHash: "mcp",
        displayName: "Codex Agent",
        createdAt: ts,
        updatedAt: ts,
      };
      data.users.push(user);
    }
    return user;
  });
}

const server = new McpServer({
  name: "web-audit-mcp",
  version: "0.1.0",
});

server.registerTool(
  "validate_audit_url",
  {
    title: "Validate audit URL",
    description: "Normalize a URL and confirm it is safe for Web Audit to scan. Blocks localhost and private networks.",
    inputSchema: { url: z.string().describe("HTTP or HTTPS website URL to validate.") },
  },
  async ({ url }) => {
    const safe = await assertPublicUrl(url);
    return {
      content: [{ type: "text", text: JSON.stringify(safe, null, 2) }],
      structuredContent: safe,
    };
  },
);

server.registerTool(
  "run_page_audit",
  {
    title: "Run page audit",
    description: "Run a safe non-invasive page audit and return scores, metrics, and prioritized findings.",
    inputSchema: { url: z.string().describe("Public HTTP or HTTPS URL to audit.") },
  },
  async ({ url }) => {
    const result = await runPageAudit(url);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
);

server.registerTool(
  "save_website_and_audit",
  {
    title: "Save website and audit",
    description: "Add a website to the agent account, run an audit, and persist the report for the web UI.",
    inputSchema: {
      url: z.string().describe("Public HTTP or HTTPS URL to audit."),
      displayName: z.string().optional().describe("Optional website name."),
    },
  },
  async ({ url, displayName }) => {
    await ensureAgentUser();
    const website = await addWebsiteForUser(AGENT_USER_ID, url, displayName);
    const audit = await runAuditForWebsite(AGENT_USER_ID, website.id);
    return {
      content: [{ type: "text", text: JSON.stringify({ website, audit }, null, 2) }],
      structuredContent: { website, audit },
    };
  },
);

server.registerTool(
  "get_audit_report",
  {
    title: "Get audit report",
    description: "Fetch a persisted audit report with findings and metrics.",
    inputSchema: { auditId: z.string().describe("Audit run id.") },
  },
  async ({ auditId }) => {
    const data = await readStore();
    const audit = data.audits.find((item) => item.id === auditId);
    if (!audit) throw new Error("Audit not found.");
    const website = data.websites.find((item) => item.id === audit.websiteId);
    const report = {
      website,
      audit,
      findings: findingsFor(audit.id, data.findings),
      metrics: metricsFor(audit.id, data.metrics),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      structuredContent: report,
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
