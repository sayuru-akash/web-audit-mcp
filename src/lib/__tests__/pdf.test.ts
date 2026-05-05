import { describe, expect, it } from "vitest";
import { buildAuditPdf } from "../pdf";
import type { AuditRun, Finding, Metric, Website } from "../types";

describe("PDF export", () => {
  it("generates a readable PDF buffer for a completed report", async () => {
    const now = new Date().toISOString();
    const website: Website = {
      id: "website-1",
      userId: "user-1",
      displayName: "Codezela",
      originalUrl: "https://codezela.com",
      normalizedUrl: "https://codezela.com/",
      domain: "codezela.com",
      scheduleFrequency: "manual",
      scheduleEnabled: false,
      alertThreshold: 10,
      createdAt: now,
      updatedAt: now,
    };
    const audit: AuditRun = {
      id: "audit-1",
      websiteId: website.id,
      userId: website.userId,
      status: "completed",
      requestedUrl: website.normalizedUrl,
      finalUrl: website.normalizedUrl,
      overallScore: 81,
      categoryScores: {
        performance: 90,
        seo: 96,
        accessibility: 56,
        security: 68,
        technical: 80,
        mobile: 100,
      },
      profile: "desktop",
      createdAt: now,
      updatedAt: now,
      completedAt: now,
    };
    const findings: Finding[] = [
      {
        id: "finding-1",
        auditRunId: audit.id,
        category: "security",
        severity: "high",
        status: "failed",
        title: "Potential mixed content detected",
        description: "The HTTPS page references HTTP resources.",
        evidence: "1 insecure resource",
        impact: "Browsers may block resources.",
        recommendation: "Serve all resources over HTTPS.",
        sortPriority: 1,
      },
    ];
    const metrics: Metric[] = [
      {
        id: "metric-1",
        auditRunId: audit.id,
        category: "performance",
        key: "response_time",
        label: "Initial response",
        value: 332,
        unit: "ms",
      },
    ];

    const pdf = await buildAuditPdf({ website, audit, findings, metrics });

    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });
});
