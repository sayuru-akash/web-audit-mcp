import { describe, expect, it } from "vitest";
import { overallScore, scoreAll, scoreLabel } from "../scoring";
import type { Finding } from "../types";

const finding = (
  category: Finding["category"],
  severity: Finding["severity"],
  status: Finding["status"] = "failed",
): Finding => ({
  id: `${category}-${severity}`,
  auditRunId: "audit",
  category,
  severity,
  status,
  title: "Issue",
  description: "Description",
  evidence: "Evidence",
  impact: "Impact",
  recommendation: "Fix",
  sortPriority: 1,
});

describe("scoring", () => {
  it("scores categories from severity penalties", () => {
    const scores = scoreAll([finding("seo", "high"), finding("seo", "low"), finding("security", "critical")]);
    expect(scores.seo).toBe(76);
    expect(scores.security).toBe(65);
    expect(scores.performance).toBe(100);
  });

  it("does not penalize manual-review findings", () => {
    const scores = scoreAll([finding("technical", "medium", "needs_review")]);
    expect(scores.technical).toBe(100);
  });

  it("calculates weighted overall score", () => {
    expect(
      overallScore({
        performance: 100,
        seo: 80,
        accessibility: 80,
        security: 60,
        technical: 100,
        mobile: 90,
      }),
    ).toBe(85);
  });

  it("labels score bands without exaggerating", () => {
    expect(scoreLabel(92)).toBe("Excellent");
    expect(scoreLabel(64)).toBe("Needs work");
    expect(scoreLabel(38)).toBe("Critical");
  });
});
