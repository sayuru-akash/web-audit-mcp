import type { AuditCategory, CategoryScores, Finding, Severity } from "@/lib/types";

const weights: Record<AuditCategory, number> = {
  performance: 0.25,
  seo: 0.2,
  accessibility: 0.2,
  security: 0.15,
  technical: 0.1,
  mobile: 0.1,
};

const penalties: Record<Severity, number> = {
  critical: 35,
  high: 20,
  medium: 10,
  low: 4,
  info: 1,
};

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreCategory(category: AuditCategory, findings: Finding[]): number {
  const failed = findings.filter((finding) => finding.category === category && finding.status === "failed");
  const penalty = failed.reduce((sum, finding) => sum + penalties[finding.severity], 0);
  return clampScore(100 - penalty);
}

export function scoreAll(findings: Finding[]): CategoryScores {
  return {
    performance: scoreCategory("performance", findings),
    seo: scoreCategory("seo", findings),
    accessibility: scoreCategory("accessibility", findings),
    security: scoreCategory("security", findings),
    technical: scoreCategory("technical", findings),
    mobile: scoreCategory("mobile", findings),
  };
}

export function overallScore(scores: CategoryScores): number {
  return clampScore(
    Object.entries(weights).reduce((sum, [category, weight]) => sum + scores[category as AuditCategory] * weight, 0),
  );
}

export function scoreLabel(score?: number): string {
  if (score === undefined) return "Pending";
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Needs work";
  if (score >= 40) return "Poor";
  return "Critical";
}

export function severityRank(severity: Severity): number {
  return { critical: 0, high: 1, medium: 2, low: 3, info: 4 }[severity];
}
